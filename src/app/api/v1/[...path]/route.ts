import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { after } from "next/server";
import { z } from "zod";
import { services } from "@/server/services";
import { actorFrom, sameOrigin, token } from "@/server/session";
import { messageSchema, pointSchema } from "@/contracts";
import { places } from "@/fixtures/nagoya";
import { routeRequestSchema } from "@/contracts/routes";
export const runtime = "nodejs";
export const maxDuration = 120;
export async function GET(req: NextRequest) {
  const actor = actorFrom(req);
  if (!actor)
    return NextResponse.json(
      { error: "利用者を選択してください" },
      { status: 401 },
    );
  return NextResponse.json(services().repo.read(actor), {
    headers: { "Cache-Control": "no-store" },
  });
}
export async function POST(req: NextRequest) {
  if (!sameOrigin(req))
    return NextResponse.json(
      { error: "接続元を確認してください" },
      { status: 403 },
    );
  try {
    if (Number(req.headers.get("content-length")) > 2_000_000)
      return NextResponse.json(
        { error: "ファイルが大きすぎます" },
        { status: 413 },
      );
    const raw = await req.text();
    if (raw.length > 2_000_000)
      return NextResponse.json(
        { error: "入力が大きすぎます" },
        { status: 413 },
      );
    const body = JSON.parse(raw);
    const action = req.nextUrl.pathname.split("/").at(-1);
    if (action === "session") {
      const { actor, code } = z
        .object({ actor: z.enum(["A", "B"]), code: z.string().optional() })
        .parse(body);
      const host = req.headers.get("host")?.split(":")[0];
      if (
        process.env.DEMO_ALLOW_NO_CODE !== "true" &&
        (process.env.DEMO_ACCESS_CODE
          ? code !== process.env.DEMO_ACCESS_CODE
          : !["localhost", "127.0.0.1", "[::1]"].includes(host || ""))
      )
        return NextResponse.json(
          { error: "デモ接続コードが必要です" },
          { status: 403 },
        );
      const res = NextResponse.json({ actor });
      res.cookies.set("grow-map-session", token(actor), {
        httpOnly: true,
        sameSite: "strict",
        secure: req.nextUrl.protocol === "https:",
        path: "/",
        maxAge: 86400,
      });
      return res;
    }
    const actor = actorFrom(req);
    if (!actor)
      return NextResponse.json(
        { error: "利用者を選択してください" },
        { status: 401 },
      );
    const { repo, conversation } = services();
    switch (action) {
      case "hash": {
        const { text } = z
          .object({ text: z.string().max(2_000_000) })
          .parse(body);
        return NextResponse.json({
          hash: createHash("sha256").update(text).digest("hex"),
        });
      }
      case "points":
        repo.addPoints(
          actor,
          z.array(pointSchema).max(10000).parse(body.points),
        );
        break;
      case "diagnosis": {
        return NextResponse.json(await services().diagnosis.diagnose(actor), {
          headers: { "Cache-Control": "no-store" },
        });
      }
      case "route": {
        return NextResponse.json(
          await services().routes.create(actor, routeRequestSchema.parse(body)),
          { headers: { "Cache-Control": "no-store" } },
        );
      }
      case "messages": {
        const m = messageSchema.parse(body);
        if (m.placeId && !places.some((p) => p.id === m.placeId))
          throw Error("場所が見つかりません");
        const existing = repo.read(actor).messages.find((x) => x.id === m.id);
        if (
          existing &&
          (existing.text !== m.text || existing.placeId !== m.placeId)
        )
          return NextResponse.json(
            { error: "同じIDの別の入力があります" },
            { status: 409 },
          );
        repo.saveMessage(actor, {
          ...m,
          role: "user",
          createdAt: new Date().toISOString(),
          status: "saved",
        });
        after(() =>
          conversation
            .respond(actor, m.id)
            .catch((e) =>
              repo.updateMessage(actor, m.id, "waiting", String(e.message)),
            ),
        );
        break;
      }
      case "retry": {
        const { id } = z.object({ id: z.string().uuid() }).parse(body);
        after(() =>
          conversation
            .respond(actor, id)
            .catch((e) =>
              repo.updateMessage(actor, id, "waiting", String(e.message)),
            ),
        );
        break;
      }
      case "memory": {
        const b = z
          .object({
            id: z.string(),
            text: z.string().trim().min(1).max(1000),
            revision: z.number().int().positive(),
          })
          .parse(body);
        if (!repo.reviseMemory(actor, b.id, b.text, b.revision))
          return NextResponse.json(
            { error: "別の画面で更新されました。再読込みしてください。" },
            { status: 409 },
          );
        break;
      }
      case "invite": {
        const { code } = z
          .object({ code: z.enum(["NAGOYA-A", "NAGOYA-B"]) })
          .parse(body);
        repo.requestFriend(actor, code.endsWith("A") ? "A" : "B");
        break;
      }
      case "accept":
        repo.acceptFriend(
          actor,
          z.object({ id: z.string().uuid() }).parse(body).id,
        );
        break;
      default:
        return NextResponse.json(
          { error: "未対応の操作です" },
          { status: 404 },
        );
    }
    return NextResponse.json(repo.read(actor));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof z.ZodError
            ? "入力の形式を確認してください"
            : error instanceof Error
              ? error.message
              : "処理に失敗しました",
      },
      { status: 400 },
    );
  }
}
