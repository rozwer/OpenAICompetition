import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { FeatureCollection, Polygon } from "geojson";
import type { Building } from "../contracts/places";
import { osmPlaces } from "../domain/place-adapters";
export function loadBundledPlaces() {
  const root = join(process.cwd(), "public/data");
  const raw = JSON.parse(readFileSync(join(root, "pois.osm.json"), "utf8"));
  const geometry = JSON.parse(
    readFileSync(join(root, "buildings.geojson"), "utf8"),
  ) as FeatureCollection<Polygon>;
  const buildings: Building[] = geometry.features.map((f) => ({
    id: `osm:way:${f.properties?.id}`,
    source: "osm",
    sourceId: `way/${f.properties?.id}`,
    name: f.properties?.name || undefined,
    buildingType: f.properties?.building || undefined,
    geometry: f.geometry,
    rawTags: f.properties || {},
  }));
  return {
    places: osmPlaces(raw, raw.retrievedAt),
    fetchedAt: String(raw.retrievedAt),
    buildings,
  };
}
