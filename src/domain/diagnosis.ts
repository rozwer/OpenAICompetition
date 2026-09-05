import type { Snapshot, Place } from "../contracts";
import { axes, diagnosisSchema, type Diagnosis, type DiagnosisInput } from "../contracts/diagnosis";
import { distance, segments } from "./tracks";

export function diagnosisInput(state: Snapshot, places: Place[], now = Date.now()): DiagnosisInput {
  const evidence: DiagnosisInput["evidence"] = state.messages.filter(m => m.role === "user")
    .slice(-80).map(m => ({ id: `message:${m.id}`, kind: "conversation", text: `${m.createdAt} ${places.find(p => p.id === m.placeId)?.name ?? "場所指定なし"}: ${m.text}` }));
  // Keep explicit long-term preferences, with their original user statement.
  for (const memory of state.memories.filter(m => m.source === "user").slice(-80)) {
    const original = state.messages.find(m => m.id === memory.evidence && m.role === "user");
    if (original && !evidence.some(e => e.id === `message:${original.id}`))
      evidence.push({ id: `message:${original.id}`, kind: "conversation", text: original.text });
  }
  const points = state.points.filter(p => p.origin !== "synthetic" && Date.parse(p.time) >= now - 30 * 86400000 && Date.parse(p.time) <= now);
  // At least 5 minutes within 30m of the first observation; gaps >120s break a stay.
  for (const line of segments(points)) {
    let start = 0;
    const save = (end: number) => {
      const first = line[start], last = line[end];
      const minutes = (Date.parse(last.time) - Date.parse(first.time)) / 60000;
      if (minutes < 5) return;
      const nearby = places.map(p => ({ p, d: distance(first, p) })).sort((a, b) => a.d - b.d)[0];
      const location = nearby && nearby.d <= 50 ? `${nearby.p.name}付近（${nearby.p.category}）` : "種類不明の場所";
      evidence.push({ id: `stay:${first.id}`, kind: "stay", text: `${first.time}から${Math.floor(minutes)}分、${location}で滞在候補。測位からの推定で、訪問目的は不明。` });
    };
    for (let i = 1; i < line.length; i++) if (distance(line[start], line[i]) > 30) { save(i - 1); start = i; }
    if (line.length) save(line.length - 1);
  }
  return { evidence: [...evidence.filter(e => e.kind === "conversation"), ...evidence.filter(e => e.kind === "stay").slice(-60)] };
}
export function emptyDiagnosis(): Diagnosis {
  return { axes: axes.map(a => ({ id: a.id, score: null, reason: "判断できる記録がまだありません。", evidenceIds: [] })) };
}
export function validateDiagnosis(value: Diagnosis, input: DiagnosisInput): Diagnosis {
  const result = diagnosisSchema.parse(value);
  if (new Set(result.axes.map(a => a.id)).size !== 6) throw Error("診断項目が揃っていません。再試行してください。");
  const allowed = new Set(input.evidence.map(e => e.id));
  for (const axis of result.axes) {
    if (axis.evidenceIds.some(id => !allowed.has(id))) throw Error("診断の根拠を確認できません。再試行してください。");
    if (axis.score !== null && !axis.evidenceIds.length) throw Error("診断に根拠がありません。再試行してください。");
    if (axis.score !== null && axis.evidenceIds.every(id => input.evidence.find(e => e.id === id)?.kind === "stay")) axis.score = Math.min(axis.score, 60);
  }
  return { axes: axes.map(a => result.axes.find(item => item.id === a.id)!) };
}
