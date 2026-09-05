"""Rebuild the bundled Yokohama extracts. Python standard library only."""
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[1] / "public" / "data"
source = root / "yokohama.osm"
tree = ET.parse(source).getroot()
nodes = {node.attrib["id"]: [float(node.attrib["lon"]), float(node.attrib["lat"])] for node in tree.findall("node")}
collections = {name: {"type": "FeatureCollection", "features": []} for name in ["buildings", "roads", "water"]}
for way in tree.findall("way"):
    tags = {tag.attrib["k"]: tag.attrib["v"] for tag in way.findall("tag")}
    coords = [nodes[nd.attrib["ref"]] for nd in way.findall("nd") if nd.attrib["ref"] in nodes]
    if len(coords) < 2:
        continue
    if "building" in tags and len(coords) >= 4 and coords[0] == coords[-1]:
        try:
            height = float(tags.get("height", "").removesuffix(" m"))
            if not 0 < height < 500:
                height = None
        except ValueError:
            height = None
        collections["buildings"]["features"].append({"type": "Feature", "id": int(way.attrib["id"]), "properties": {"id": way.attrib["id"], "name": tags.get("name"), "building": tags.get("building"), "amenity": tags.get("amenity"), "shop": tags.get("shop"), "height": height, "height_source": "OSM height tag" if height else "unknown"}, "geometry": {"type": "Polygon", "coordinates": [coords]}})
    if "highway" in tags:
        collections["roads"]["features"].append({"type": "Feature", "properties": {"kind": tags["highway"]}, "geometry": {"type": "LineString", "coordinates": coords}})
    if (tags.get("natural") == "water" or tags.get("landuse") == "reservoir") and coords[0] == coords[-1]:
        collections["water"]["features"].append({"type": "Feature", "properties": {}, "geometry": {"type": "Polygon", "coordinates": [coords]}})
for name, collection in collections.items():
    (root / f"{name}.geojson").write_text(json.dumps(collection, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
manifest = {
    "region": "yokohama", "retrieved_at": "2026-09-05", "bounds": [139.647, 35.438, 139.653, 35.445],
    "source": "https://www.openstreetmap.org/api/0.6/map?bbox=139.647,35.438,139.653,35.445",
    "license": "ODbL-1.0", "attribution": "© OpenStreetMap contributors",
    "license_url": "https://www.openstreetmap.org/copyright", "coordinate_system": "WGS84 longitude, latitude",
    "height_rule": "Only numeric OSM height tags, in metres; no building:levels conversion; unknown remains null.",
    "files": {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in [source, *sorted(root.glob("*.geojson"))]},
    "counts": {name: len(collection["features"]) for name, collection in collections.items()}
}
(root / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(manifest["counts"]))

