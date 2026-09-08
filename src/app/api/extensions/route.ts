import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { actorFrom, sameOrigin } from "@/server/session";
import { services } from "@/server/services";
export const runtime = "nodejs";
export const maxDuration = 180;
const id = z.string().uuid(),
  version = z.number().int().positive();
const command = z.discriminatedUnion("op", [
  z
    .object({
      op: z.literal("generate"),
      id: id.optional(),
      text: z.string().trim().min(1).max(4000),
    })
    .strict(),
  z
    .object({
      op: z.literal("install"),
      id,
      version,
      source: z.enum(["draft", "public"]),
      approved: z.literal(true),
    })
    .strict(),
  z
    .object({
      op: z.literal("publish"),
      id,
      version,
      approved: z.literal(true),
    })
    .strict(),
  z.object({ op: z.literal("toggle"), id, enabled: z.boolean() }).strict(),
  z.object({ op: z.literal("revoke"), id }).strict(),
  z
    .object({
      op: z.literal("run"),
      id,
      version,
      actionId: z.string().max(40),
      placeId: z.string().max(120),
      input: z.record(
        z.string().max(40),
        z.union([z.string().max(4000), z.number().finite(), z.boolean()]),
      ),
      preview: z.boolean(),
    })
    .strict(),
  z
    .object({ op: z.literal("geography"), id, version, approve: z.boolean() })
    .strict(),
]);
export async function GET(req: NextRequest) {
  const actor = actorFrom(req);
  if (!actor)
    return NextResponse.json(
      { error: "ログインしてください" },
      { status: 401 },
    );
  return NextResponse.json(services().extensions.read(actor), {
    headers: { "Cache-Control": "no-store" },
  });
}
export async function POST(req: NextRequest) {
  if (!sameOrigin(req))
    return NextResponse.json(
      { error: "接続元を確認してください" },
      { status: 403 },
    );
  const actor = actorFrom(req);
  if (!actor)
    return NextResponse.json(
      { error: "ログインしてください" },
      { status: 401 },
    );
  try {
    const raw = await req.text();
    if (raw.length > 50000) throw Error("入力が大きすぎます");
    const b = command.parse(JSON.parse(raw)),
      s = services().extensions;
    switch (b.op) {
      case "generate":
        return NextResponse.json(await s.generate(actor, b.id, b.text));
      case "install":
        s.install(actor, b.id, b.version, b.source);
        break;
      case "publish":
        s.publish(actor, b.id, b.version);
        break;
      case "toggle":
        s.toggle(actor, b.id, b.enabled);
        break;
      case "revoke":
        s.revoke(actor, b.id);
        break;
      case "run":
        return NextResponse.json(
          s.run(
            actor,
            b.id,
            b.version,
            b.actionId,
            b.placeId,
            b.input,
            b.preview,
          ),
        );
      case "geography":
        return NextResponse.json(
          await s.geography(actor, b.id, b.version, b.approve),
        );
    }
    return NextResponse.json(s.read(actor));
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof z.ZodError
            ? "入力の形式を確認してください"
            : e instanceof Error
              ? e.message
              : "処理に失敗しました",
      },
      { status: 400 },
    );
  }
}
