import { NextRequest, NextResponse } from "next/server";
import { placeQuerySchema } from "../../../contracts/places";
import { actorFrom, sameOrigin } from "../../../server/session";
import { PlaceService } from "../../../server/places";
import { OpenStreetMapProvider } from "../../../infrastructure/osm-place-provider";
import { SqlitePlaceCache } from "../../../infrastructure/place-cache";
import { loadBundledPlaces } from "../../../infrastructure/bundled-places";
import { z } from "zod";
export const runtime = "nodejs";
let service: PlaceService | undefined;
const schema = placeQuerySchema.extend({
  network: z.boolean().default(false),
  approve: z.boolean().default(false),
});
export async function POST(req: NextRequest) {
  const actor = actorFrom(req);
  if (!actor || !sameOrigin(req))
    return NextResponse.json(
      { error: "ログインしてください" },
      { status: 403 },
    );
  const body = await req.text();
  if (body.length > 2000)
    return NextResponse.json({ error: "入力が大きすぎます" }, { status: 413 });
  let input;
  try {
    input = schema.parse(JSON.parse(body));
  } catch {
    return NextResponse.json({ error: "検索範囲が不正です" }, { status: 400 });
  }
  try {
    service ??= new PlaceService(
      new OpenStreetMapProvider(),
      new SqlitePlaceCache(),
      loadBundledPlaces(),
    );
    return NextResponse.json(
      await service.search(actor, input, input.network, input.approve),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "周辺情報を読み込めませんでした。地図は引き続き利用できます。" },
      { status: 503 },
    );
  }
}
