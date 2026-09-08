"""Rebuild the bundled Nagoya extracts. Python standard library only."""
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[1] / "public" / "data"
sources = [root / "nagoya.osm", root / "nagoya-university.osm"]
collections = {
    name: {"type": "FeatureCollection", "features": []}
    for name in ["buildings", "roads", "water"]
}

for source in sources:
    tree = ET.parse(source).getroot()
    nodes = {
        node.attrib["id"]: [float(node.attrib["lon"]), float(node.attrib["lat"])]
        for node in tree.findall("node")
    }
    for way in tree.findall("way"):
        tags = {tag.attrib["k"]: tag.attrib["v"] for tag in way.findall("tag")}
        coords = [
            nodes[nd.attrib["ref"]]
            for nd in way.findall("nd")
            if nd.attrib["ref"] in nodes
        ]
        if len(coords) < 2:
            continue
        if "building" in tags and len(coords) >= 4 and coords[0] == coords[-1]:
            try:
                height = float(tags.get("height", "").removesuffix(" m"))
                if not 0 < height < 500:
                    height = None
            except ValueError:
                height = None
            collections["buildings"]["features"].append(
                {
                    "type": "Feature",
                    "id": int(way.attrib["id"]),
                    "properties": {
                        "id": way.attrib["id"],
                        "name": tags.get("name"),
                        "building": tags.get("building"),
                        "amenity": tags.get("amenity"),
                        "shop": tags.get("shop"),
                        "height": height,
                        "height_source": "OSM height tag" if height else "unknown",
                    },
                    "geometry": {"type": "Polygon", "coordinates": [coords]},
                }
            )
        if "highway" in tags:
            collections["roads"]["features"].append(
                {
                    "type": "Feature",
                    "properties": {"kind": tags["highway"]},
                    "geometry": {"type": "LineString", "coordinates": coords},
                }
            )
        if (
            tags.get("natural") == "water" or tags.get("landuse") == "reservoir"
        ) and coords[0] == coords[-1]:
            collections["water"]["features"].append(
                {
                    "type": "Feature",
                    "properties": {},
                    "geometry": {"type": "Polygon", "coordinates": [coords]},
                }
            )

for name, collection in collections.items():
    (root / f"{name}.geojson").write_text(
        json.dumps(collection, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

generated = sorted(root.glob("*.geojson"))
manifest = {
    "region": "nagoya-sakae-osu-and-higashiyama-campus",
    "retrieved_at": "2026-09-07",
    "areas": [
        {"name": "sakae-osu", "bounds": [136.898, 35.1585, 136.911, 35.173]},
        {
            "name": "nagoya-university-higashiyama",
            "bounds": [136.9607, 35.148, 136.9743, 35.1587],
        },
    ],
    "sources": [
        "https://www.openstreetmap.org/api/0.6/map?bbox=136.898,35.1585,136.911,35.173",
        "https://www.openstreetmap.org/api/0.6/map?bbox=136.9607,35.148,136.9743,35.1587",
    ],
    "license": "ODbL-1.0",
    "attribution": "© OpenStreetMap contributors",
    "license_url": "https://www.openstreetmap.org/copyright",
    "coordinate_system": "WGS84 longitude, latitude",
    "height_rule": "Numeric OSM height tags are preserved; unknown heights remain null in source and use display-only models.",
    "files": {
        p.name: hashlib.sha256(p.read_bytes()).hexdigest()
        for p in [*sources, *generated]
    },
    "counts": {
        name: len(collection["features"])
        for name, collection in collections.items()
    },
}
(root / "manifest.json").write_text(
    json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
)
print(json.dumps(manifest["counts"]))
