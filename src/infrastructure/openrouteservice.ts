import { z } from "zod";
import type { Place } from "../contracts";
import type { WalkingRouter } from "../contracts/routes";
import { distance } from "../domain/tracks";
const coordinate = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);
const responseSchema = z.object({ features: z.array(z.object({ geometry: z.object({ type: z.literal("LineString"), coordinates: z.array(coordinate).min(2) }), properties: z.object({ summary: z.object({ distance: z.number().nonnegative(), duration: z.number().nonnegative() }), way_points: z.array(z.number().int().nonnegative()) }) })).min(1) });
export class OpenRouteService implements WalkingRouter {
  constructor(private key = process.env.ORS_API_KEY ?? "", private request: typeof fetch = fetch) {}
  configured() { return !!this.key.trim(); }
  async route(points: Place[]) {
    if (!this.configured()) throw Error("openrouteserviceのAPIキーが未設定です。");
    let response: Response;
    try {
      response = await this.request("https://api.openrouteservice.org/v2/directions/foot-walking/geojson", {
        method: "POST", headers: { Authorization: this.key, "Content-Type": "application/json" },
        body: JSON.stringify({ coordinates: points.map(p => [p.lng, p.lat]), radiuses: points.map(() => 100), instructions: false }),
        signal: AbortSignal.timeout(20000),
      });
    } catch { throw Error("経路サービスに接続できません。時間を置いて再試行してください。"); }
    if (!response.ok) throw Error(response.status === 429 ? "経路サービスの利用上限に達しました。時間を置いて再試行してください。" : response.status === 401 || response.status === 403 ? "経路APIのキーまたは利用権限を確認してください。" : "指定地点をつなぐ徒歩経路を取得できません。出発地・経由地を見直してください。");
    const parsed = responseSchema.safeParse(await response.json());
    if (!parsed.success) throw Error("経路サービスの応答を確認できません。");
    const f = parsed.data.features[0];
    if (f.properties.way_points.length !== points.length) throw Error("経由地点の通過を確認できません。");
    let previous = -1;
    f.properties.way_points.forEach((index, i) => {
      const c = f.geometry.coordinates[index];
      if (!c || index < previous || distance(points[i], { lng: c[0], lat: c[1] }) > 105) throw Error("指定地点付近を通る経路を確認できません。");
      previous = index;
    });
    return { geometry: f.geometry, ...f.properties.summary };
  }
}
