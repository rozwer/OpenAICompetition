import type { Snapshot } from "../contracts";
export async function api<T = Snapshot>(
  action: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`/api/v1/${action}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await res.json();
  if (!res.ok) throw Error(result.error || "通信に失敗しました");
  return result;
}
