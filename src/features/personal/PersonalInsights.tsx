"use client";
import { useState } from "react";
import type { PersonalState } from "../../contracts/personal-insights";
import { personalApi } from "../../client/personal";
import {
  PersonaSection,
  PersonalCompass,
  PersonalTimeline,
} from "./InsightSections";
export function PersonalInsights({
  state,
  onChange,
  onMap,
}: {
  state: PersonalState | null;
  onChange: (s: PersonalState) => void;
  onMap: () => void;
}) {
  const [tab, setTab] = useState("insights"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function run(body: unknown) {
    setBusy(true);
    setError("");
    try {
      onChange(await personalApi(body));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="feature-panel personal-insights">
      <div className="eyebrow">MY PERSONAL MAP</div>
      <h2>自分と街との関係</h2>
      <p className="muted">
        過ごした場所から、最近のあなたが少しずつ見えてきます。
      </p>
      <button onClick={onMap}>自分の地図を眺める</button>
      <div className="personal-facts">
        <span>
          <b>{state?.visits.length || 0}</b>確認した訪問
        </span>
        <span>
          <b>{state?.relations.filter((r) => r.visitCount).length || 0}</b>
          関わった場所
        </span>
      </div>
      {!!state?.candidates.length && (
        <details className="personal-pattern">
          <summary>訪問候補を確認 · {state.candidates.length}件</summary>
          <p>GPSからの滞在推定です。店舗への訪問かどうか確認してください。</p>
          {state.candidates.map((c) => (
            <div key={c.id}>
              <p>
                {state.places.find((p) => p.id === c.placeId)?.name} · 約
                {c.durationMinutes}分
                <small>{new Date(c.enteredAt).toLocaleString("ja-JP")}</small>
              </p>
              <button
                disabled={busy}
                onClick={() =>
                  void run({ op: "candidate", id: c.id, accept: true })
                }
              >
                訪問した
              </button>
              <button
                disabled={busy}
                onClick={() =>
                  void run({ op: "candidate", id: c.id, accept: false })
                }
              >
                違います
              </button>
            </div>
          ))}
        </details>
      )}
      <div className="personal-tabs">
        <button
          aria-pressed={tab === "insights"}
          onClick={() => setTab("insights")}
        >
          AIが見つけたあなた
        </button>
        <button
          aria-pressed={tab === "timeline"}
          onClick={() => setTab("timeline")}
        >
          変化の記録
        </button>
      </div>
      {tab === "insights" ? (
        <>
          <button
            disabled={busy || !state?.activity.current.visits}
            onClick={() => void run({ op: "generate" })}
          >
            {busy ? "集計から読み解いています…" : "最近の行動をAIで読み解く"}
          </button>
          <small>
            確認済みの訪問を集計してAIへ送ります。生GPSは送りません。
          </small>
          {error && <p role="alert">{error}</p>}
          {!state?.activity.current.visits && (
            <p className="personal-empty">
              最近30日間の確認済み訪問がまだありません。地図の場所を開いて訪問を記録すると、関係が育ち始めます。
            </p>
          )}
          {state?.snapshots[0] && (
            <div className="personal-summary">
              <small>
                AIの解釈 ·{" "}
                {new Date(state.snapshots[0].generatedAt).toLocaleDateString(
                  "ja-JP",
                )}
                時点
              </small>
              <p>{state.snapshots[0].result.summary}</p>
            </div>
          )}
          {state && (
            <>
              <PersonaSection state={state} />
              <PersonalCompass state={state} />
            </>
          )}
        </>
      ) : (
        state && <PersonalTimeline state={state} />
      )}
    </section>
  );
}
