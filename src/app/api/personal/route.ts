import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { actorFrom, sameOrigin } from "../../../server/session";
import { services } from "../../../server/services";
import { visitInputSchema } from "../../../contracts/personal-insights";
export const runtime = "nodejs";
export const maxDuration = 120;
const input = z.discriminatedUnion("op", [
  z.object({ op: z.literal("state") }).strict(),
  z.object({ op: z.literal("generate") }).strict(),
  z.object({ op: z.literal("visit"), visit: visitInputSchema }).strict(),
  z
    .object({
      op: z.literal("favorite"),
      placeId: z.string().max(200),
      favorite: z.boolean(),
    })
    .strict(),
  z
    .object({
      op: z.literal("candidate"),
      id: z.string().max(200),
      accept: z.boolean(),
    })
    .strict(),
]);
export async function POST(req: NextRequest) {
  const actor = actorFrom(req);
  if (!actor || !sameOrigin(req))
    return NextResponse.json(
      { error: "利用者を確認してください" },
      { status: 403 },
    );
  const text = await req.text();
  if (text.length > 4000)
    return NextResponse.json({ error: "入力が大きすぎます" }, { status: 413 });
  let body;
  try {
    body = input.parse(JSON.parse(text));
  } catch {
    return NextResponse.json(
      { error: "入力を確認してください" },
      { status: 400 },
    );
  }
  try {
    const service = services().personal;
    const state =
      body.op === "state"
        ? service.state(actor)
        : body.op === "generate"
          ? await service.generate(actor)
          : body.op === "visit"
            ? service.record(actor, body.visit)
            : body.op === "favorite"
              ? service.favorite(actor, body.placeId, body.favorite)
              : service.confirm(actor, body.id, body.accept);
    return NextResponse.json(state, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      {
        error:
          body.op === "generate"
            ? "AIの更新を完了できませんでした。前回の結果と記録は残っています。少し待って再試行してください。"
            : "記録を保存できませんでした。場所・時刻・重複を確認してください。",
      },
      { status: 400 },
    );
  }
}
