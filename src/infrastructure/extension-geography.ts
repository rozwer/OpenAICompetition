import type { Definition } from "../contracts/extensions";
import type { Place } from "../contracts";
export const externalScope = (d: Definition) =>
  d.external
    ? `overpass-api.de|coordinates,category,radius|nearby:${d.external.category}`
    : null;
const cache = new Map<string, { expires: number; places: Place[] }>();
let busy = false,
  last = 0;
export async function nearby(
  d: Definition,
  point: { lat: number; lng: number },
): Promise<Place[]> {
  const e = d.external;
  if (!e) throw Error("外部連携は定義されていません");
  const lat = Number(point.lat.toFixed(4)),
    lng = Number(point.lng.toFixed(4));
  const key = JSON.stringify([lat, lng, e]);
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.places;
  if (busy || Date.now() - last < 5000)
    throw Error("地理情報の取得間隔を空けて再試行してください");
  busy = true;
  last = Date.now();
  try {
    const tag =
      e.category === "park"
        ? "leisure=park"
        : e.category === "museum"
          ? "tourism=museum"
          : `amenity=${e.category}`;
    const query = `[out:json][timeout:12];nwr[${tag}](around:${e.radius},${lat},${lng});out center 60;`;
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(18000),
      redirect: "error",
    });
    if (!res.ok)
      throw Error("地理情報サービスが混雑しています。後で再試行してください");
    const reader = res.body?.getReader();
    if (!reader) throw Error("地理情報の応答が空です");
    let length = 0,
      raw = "";
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 1000000) {
        await reader.cancel();
        throw Error("地理情報の応答が大きすぎます");
      }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
    const body = JSON.parse(raw);
    if (body.remark)
      throw Error("地理情報の取得が完了しませんでした。再試行してください");
    const places: Place[] = (body.elements || [])
      .slice(0, 60)
      .flatMap((v: any) => {
        const p = v.center || v;
        return Number.isFinite(p.lat) && Number.isFinite(p.lon)
          ? [
              {
                id: `osm-${v.type}-${v.id}`,
                name: String(
                  v.tags?.name || v.tags?.["name:en"] || e.category,
                ).slice(0, 100),
                lat: p.lat,
                lng: p.lon,
                category: e.category,
                description: "© OpenStreetMap contributors",
              },
            ]
          : [];
      });
    if (cache.size > 100) cache.clear();
    cache.set(key, { expires: Date.now() + 300000, places });
    return places;
  } finally {
    busy = false;
  }
}
