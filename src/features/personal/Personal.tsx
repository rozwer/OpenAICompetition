"use client";
import { useEffect, useState } from "react";
import { api } from "../../client/api";
import type { FeatureContext } from "../../contracts";
import { axes, type DiagnosisReport } from "../../contracts/diagnosis";
import { diagnosisInput } from "../../domain/diagnosis";
export function Personal({ snapshot, places }: FeatureContext) {
  const [report, setReport] = useState<DiagnosisReport | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [retry, setRetry] = useState(0);
  const signature = JSON.stringify([snapshot.actor, diagnosisInput(snapshot, places)]);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setBusy(true); setError("");
      api<DiagnosisReport>("diagnosis", {}).then(result => { if (active) setReport(result); })
        .catch(e => { if (active) setError(e.message); })
        .finally(() => { if (active) setBusy(false); });
    }, 800);
    return () => { active = false; clearTimeout(timer); };
  }, [signature, retry]);
  const known = report?.axes.filter(a => a.score !== null).length ?? 0;
  const point = (i: number, radius: number) => {
    const angle = -Math.PI / 2 + i * Math.PI / 3;
    return [170 + Math.cos(angle) * radius, 155 + Math.sin(angle) * radius];
  };
  const polygon = (radius: number) => axes.map((_, i) => point(i, radius).join(",")).join(" ");
  return <section className="feature-panel diagnosis-panel">
    <div className="eyebrow">YOUR WALKING TYPE</div>
    <h2>タイプ診断</h2>
    <p className="muted">過ごした場所と、何気ない会話から。<br />あなたの「好き」の輪郭が育ちます。</p>
    <div className="diagnosis-chart">
      <div className="diagnosis-progress">{known}<span> / 6 項目の傾向が見えてきました</span></div>
      <svg viewBox="0 0 340 310" role="img" aria-label={`好みのレーダーチャート。${known}項目を推定済み。未判定の項目は数値を表示しません。`}>
        {[100,75,50,25].map(r => <polygon key={r} points={polygon(r)} fill={r === 100 ? "#f4f7ef" : "none"} stroke="#dbe3d4" />)}
        {axes.map((axis, i) => <line key={axis.id} x1="170" y1="155" x2={point(i,100)[0]} y2={point(i,100)[1]} stroke="#dbe3d4" />)}
        {known === 6 && <polygon points={axes.map((axis,i) => point(i,report!.axes.find(a => a.id === axis.id)!.score!).join(",")).join(" ")} fill="#72a58a55" stroke="#477d62" strokeWidth="2" />}
        {axes.map((axis,i) => {
          const score = report?.axes.find(a => a.id === axis.id)?.score;
          const label = point(i,128), dot = point(i,score ?? 0);
          return <g key={axis.id}>
            {score != null && <><line x1="170" y1="155" x2={dot[0]} y2={dot[1]} stroke="#477d62" strokeWidth="2" /><circle cx={dot[0]} cy={dot[1]} r="4" fill="#477d62" /></>}
            <text x={label[0]} y={label[1]} textAnchor="middle" fontSize="11" fill="#345344">{axis.label}</text>
            <text x={label[0]} y={label[1]+15} textAnchor="middle" fontSize="10" fill="#6c7b6a">{score == null ? "推定中" : score}</text>
          </g>;
        })}
      </svg>
      <p>{known === 6 ? "数値は好みの強さを表す推定です。" : "根拠が揃った項目から表示。6項目が揃うと多角形になります。"}</p>
    </div>
    {busy && <p className="muted" role="status">会話と滞在記録から診断しています…</p>}
    {error && <div className="inline-note" role="alert">診断を更新できませんでした。{error}<button onClick={() => setRetry(n => n+1)}>診断を再試行</button></div>}
    <div className="diagnosis-reasons">
      {axes.map(axis => {
        const result = report?.axes.find(a => a.id === axis.id);
        return <details key={axis.id}>
          <summary><span>{axis.label}</span><b>{result?.score == null ? "推定中" : `${result.score} / 100`}</b></summary>
          <p>{result?.reason ?? "会話や滞在の記録が増えると、傾向が見えてきます。"}</p>
          {result?.evidenceIds.map(id => <blockquote key={id}>{report?.evidence.find(e => e.id === id)?.text}</blockquote>)}
        </details>;
      })}
    </div>
    <p className="diagnosis-note">滞在は最近30日間、会話の好みは期間を越えて参考にします。架空の散歩は診断に使いません。数値は優劣や確定した性格を表しません。</p>
    {report?.updatedAt && <small className="muted">前回の診断：{new Date(report.updatedAt).toLocaleString("ja-JP")}{busy || error ? "（前回の結果を表示中）" : ""}</small>}
  </section>;
}
