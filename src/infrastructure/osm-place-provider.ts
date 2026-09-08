import type { PlaceProvider, PlaceQuery } from "../contracts/places";
import { osmPlaces } from "../domain/place-adapters";
export class OpenStreetMapProvider implements PlaceProvider {
  readonly source = "osm" as const;
  async getPlacesAround(q: PlaceQuery) {
    const area = `(around:${q.radius},${q.lat.toFixed(4)},${q.lng.toFixed(4)})`;
    const query = `[out:json][timeout:15];(${["amenity", "shop", "tourism", "leisure", "office"].map((k) => `nwr[${k}]${area};`).join("")}nwr[railway=station]${area};);out center tags;`;
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(18000),
      cache: "no-store",
    });
    if (!response.ok)
      throw new Error(
        `地理情報サービスから取得できませんでした（HTTP ${response.status}）`,
      );
    const reader = response.body?.getReader();
    if (!reader) throw new Error("空の地理情報応答です");
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 4_000_000)
          throw new Error("地理情報が多すぎます。範囲を狭めてください");
        chunks.push(value);
      }
    } finally {
      await reader.cancel();
    }
    return osmPlaces(JSON.parse(Buffer.concat(chunks).toString("utf8")));
  }
}
