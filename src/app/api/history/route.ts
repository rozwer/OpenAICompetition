import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { daySchema, monthSchema } from "../../../contracts/history";
import { services } from "../../../server/services";
import { actorFrom, sameOrigin } from "../../../server/session";
export const runtime = "nodejs";
export const maxDuration = 120;
const query = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("day"), period: daySchema }).strict(),
  z.object({ mode: z.enum(["month", "replay"]), period: monthSchema }).strict(),
]);
export async function GET(req: NextRequest) {
  const actor = actorFrom(req);
  if (!actor)
    return NextResponse.json(
      { error: "利用者を確認してください" },
      { status: 403 },
    );
  const parsed = query.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success)
    return NextResponse.json(
      { error: "日付を確認してください" },
      { status: 400 },
    );
  try {
    return NextResponse.json(
      services().history.get(actor, parsed.data.mode, parsed.data.period),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "履歴を読み込めませんでした" },
      { status: 503 },
    );
  }
}
export async function POST(req: NextRequest) {
  const actor = actorFrom(req);
  if (!actor || !sameOrigin(req))
    return NextResponse.json(
      { error: "利用者を確認してください" },
      { status: 403 },
    );
  const raw = await req.text();
  if (raw.length > 300)
    return NextResponse.json(
      { error: "入力を確認してください" },
      { status: 400 },
    );
  try {
    const { month } = z
      .object({ month: monthSchema })
      .strict()
      .parse(JSON.parse(raw));
    return NextResponse.json(
      await services().history.generateMonthlyInsight(actor, month),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "月を確認してください" },
      { status: 400 },
    );
  }
}
