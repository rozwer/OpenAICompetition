import { z } from "zod";
import type { Building, PlaceQuery, SemanticPlace } from "../contracts/places";
import { normalizeBrand, normalizePlaceCategory } from "./place-normalization";

const coordinates = {
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
};
const elementSchema = z.object({
  type: z.enum(["node", "way", "relation"]),
  id: z.number().int().positive(),
  lat: coordinates.lat.optional(),
  lon: coordinates.lon.optional(),
  center: z.object(coordinates).optional(),
  tags: z.record(z.string(), z.string()).default({}),
});
export function osmPlaces(
  data: unknown,
  at = new Date().toISOString(),
): SemanticPlace[] {
  const response = z
    .object({ elements: z.array(z.unknown()), remark: z.string().optional() })
    .parse(data);
  if (response.remark)
    throw new Error("地理情報サービスが不完全な結果を返しました");
  const unique = new Map<string, SemanticPlace>();
  for (const raw of response.elements) {
    const parsed = elementSchema.safeParse(raw);
    if (!parsed.success) continue;
    const e = parsed.data,
      t = e.tags,
      c = e.type === "node" ? e : e.center;
    if (!c || c.lat === undefined || c.lon === undefined) continue;
    if (
      !["amenity", "shop", "tourism", "leisure", "office"].some((k) => t[k]) &&
      t.railway !== "station"
    )
      continue;
    const classification = normalizePlaceCategory({ source: "osm", tags: t }),
      sourceId = `${e.type}/${e.id}`,
      id = `osm:${e.type}:${e.id}`;
    unique.set(id, {
      id,
      sourceId,
      source: "osm",
      name:
        t["name:ja"] ||
        t.name ||
        t.brand ||
        `名称未登録の${classification.category}`,
      lat: c.lat,
      lng: c.lon,
      description: t.description || "",
      ...classification,
      ...normalizeBrand(t),
      openingHours: t.opening_hours,
      level: t.level,
      operator: t.operator,
      cuisine: t.cuisine,
      rawTags: { ...t },
      normalizedAt: at,
      normalizationVersion: 1,
    });
  }
  return [...unique.values()];
}
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const rad = Math.PI / 180,
    dlat = (a.lat - b.lat) * rad,
    dlng = (a.lng - b.lng) * rad;
  return (
    6371000 *
    2 *
    Math.asin(
      Math.min(
        1,
        Math.sqrt(
          Math.sin(dlat / 2) ** 2 +
            Math.cos(a.lat * rad) *
              Math.cos(b.lat * rad) *
              Math.sin(dlng / 2) ** 2,
        ),
      ),
    )
  );
}
export function withinPlaces(places: SemanticPlace[], q: PlaceQuery) {
  return places
    .filter((p) => distanceMeters(p, q) <= q.radius)
    .sort((a, b) => distanceMeters(a, q) - distanceMeters(b, q));
}
function inRing(x: number, y: number, ring: number[][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i],
      [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}
export function linkBuildings(
  places: SemanticPlace[],
  buildings: Building[],
): SemanticPlace[] {
  return places.map((p) => {
    const exact = buildings.find(
      (b) => b.source === p.source && b.sourceId === p.sourceId,
    );
    if (exact)
      return { ...p, buildingId: exact.id, buildingLink: "same_feature" };
    // Area feature centers are bounding-box centers, not a trustworthy tenant position.
    if (p.source === "osm" && !p.sourceId.startsWith("node/")) return p;
    const candidates = buildings.filter((b) => {
      const polygons =
        b.geometry.type === "Polygon"
          ? [b.geometry.coordinates]
          : b.geometry.coordinates;
      return polygons.some(
        (rings) =>
          inRing(p.lng, p.lat, rings[0]) &&
          !rings.slice(1).some((r) => inRing(p.lng, p.lat, r)),
      );
    });
    return candidates.length === 1
      ? {
          ...p,
          buildingId: candidates[0].id,
          buildingLink: "spatial_candidate",
        }
      : p;
  });
}
