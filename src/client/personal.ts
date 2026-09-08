import type { PersonalState } from "../contracts/personal-insights";
export async function personalApi(body: unknown): Promise<PersonalState> {
  const response = await fetch("/api/personal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.error || "読み込めませんでした");
  return data;
}
