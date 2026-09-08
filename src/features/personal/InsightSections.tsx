import type { PersonalState } from "../../contracts/personal-insights";
export function PersonaSection({ state }: { state: PersonalState }) {
  const result = state.snapshots[0]?.result;
  return (
    <>
      <div className="persona-scroll">
        {result?.personaCards.map((c) => (
          <article className="persona-card" key={c.id}>
            <small>
              最近見えてきた行動モード · {Math.round(c.confidence * 100)}%
            </small>
            <h3>{c.name}</h3>
            <p>{c.description}</p>
            <div className="personal-tags">
              {c.traits.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <details>
              <summary>根拠</summary>
              {c.evidenceIds.map((id) => (
                <small key={id}>{id}</small>
              ))}
            </details>
          </article>
        ))}
      </div>
      <h3>AIが見つけたあなたのパターン</h3>
      {result?.patterns.length ? (
        result.patterns.map((p) => (
          <details className="personal-pattern" key={p.id}>
            <summary>{p.title}</summary>
            <p>{p.description}</p>
            <small>AIの解釈 · 確信度 {Math.round(p.confidence * 100)}%</small>
          </details>
        ))
      ) : (
        <p className="muted">まだパターンは見つかっていません。</p>
      )}
    </>
  );
}
const compassLabels = {
  quiet: ["賑やか", "静か"],
  social: ["一人", "社交"],
  exploration: ["定番", "新規探索"],
  nature: ["都市", "自然"],
  longStay: ["短時間", "長時間"],
  localness: ["チェーン", "ローカル"],
};
export function PersonalCompass({ state }: { state: PersonalState }) {
  return (
    <section>
      <h3>最近の行動から見える傾向</h3>
      <p className="muted">
        性格を決める数値ではありません。根拠がない軸は未判定です。
      </p>
      {Object.entries(compassLabels).map(([axis, labels]) => {
        const score = state.snapshots[0]?.result.preferenceScores.find(
          (s) => s.axis === axis,
        );
        return (
          <div className="compass-axis" key={axis}>
            <div>
              <span>{labels[0]}</span>
              <small>
                {score?.score == null
                  ? "未判定"
                  : `確信度 ${Math.round(score.confidence * 100)}%`}
              </small>
              <span>{labels[1]}</span>
            </div>
            <div className="compass-track">
              {score?.score != null && (
                <i style={{ left: `${score.score}%` }} />
              )}
            </div>
            {score?.reason && <small>{score.reason}</small>}
          </div>
        );
      })}
    </section>
  );
}
export function PersonalTimeline({ state }: { state: PersonalState }) {
  return (
    <section>
      <h3>最近の変化</h3>
      {state.snapshots.length ? (
        state.snapshots.map((s) => (
          <details className="personal-pattern" key={s.id}>
            <summary>
              {new Date(s.generatedAt).toLocaleDateString("ja-JP")} の記録
            </summary>
            <p>{s.result.summary}</p>
            {s.result.changes.map((c) => (
              <p key={c.id}>
                {c.title}
                <small>
                  {c.description} · AIの解釈 {Math.round(c.confidence * 100)}%
                </small>
              </p>
            ))}
            {!s.result.changes.length && (
              <small>比較できる変化はまだ見つかっていません。</small>
            )}
          </details>
        ))
      ) : (
        <p>AIで更新した結果が、ここに残っていきます。</p>
      )}
    </section>
  );
}
