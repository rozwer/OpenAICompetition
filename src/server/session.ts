import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { NextRequest } from "next/server";
function secret() {
  const dir = join(process.cwd(), ".local");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, "session-secret");
  try {
    return readFileSync(path, "utf8");
  } catch {
    try {
      writeFileSync(path, randomBytes(32).toString("hex"), { flag: "wx" });
    } catch {}
    return readFileSync(path, "utf8");
  }
}
export function token(actor: string) {
  return (
    actor + "." + createHmac("sha256", secret()).update(actor).digest("hex")
  );
}
export function actorFrom(req: NextRequest) {
  const value = req.cookies.get("grow-map-session")?.value || "";
  const actor = value.split(".")[0];
  if (!["A", "B"].includes(actor)) return null;
  const expected = Buffer.from(token(actor)),
    actual = Buffer.from(value);
  return expected.length === actual.length && timingSafeEqual(expected, actual)
    ? actor
    : null;
}
export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  return (
    !origin ||
    origin === req.nextUrl.origin ||
    new URL(origin).host === req.headers.get("host")
  );
}
