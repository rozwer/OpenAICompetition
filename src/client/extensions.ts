import type { ExtensionState } from "../contracts/extensions";
export async function extensionApi<T = ExtensionState>(
  body?: unknown,
): Promise<T> {
  const r = await fetch("/api/extensions", {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const value = await r.json();
  if (!r.ok) throw Error(value.error || "拡張機能の通信に失敗しました");
  return value;
}
