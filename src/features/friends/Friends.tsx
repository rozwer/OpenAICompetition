"use client";
import { useState } from "react";
import { api } from "../../client/api";
import type { FeatureContext } from "../../contracts";
export function Friends({ snapshot, refresh }: FeatureContext) {
  const [code, setCode] = useState(""),
    [error, setError] = useState("");
  return (
    <section className="feature-panel">
      <div className="eyebrow">ANOTHER PERSPECTIVE</div>
      <h2>友人と、街を歩く。</h2>
      <p className="muted">同じ街にも、違う好きがある。</p>
      <div className="invite-card">
        <small>あなたの招待コード</small>
        <strong>YOKOHAMA-{snapshot.actor}</strong>
        <span>同じデモPCに接続した相手へ伝える</span>
      </div>
      <form
        className="inline-form"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api("invite", { code: code.trim().toUpperCase() });
            setCode("");
            await refresh();
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <input
          aria-label="友人の招待コード"
          placeholder="友人の招待コード"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button className="primary">申請</button>
      </form>
      {snapshot.requests.map((r) => (
        <div className="friend-row" key={r.id}>
          <span className="avatar">
            {r.from === snapshot.actor ? r.to : r.from}
          </span>
          <div>
            <b>デモ利用者 {r.from === snapshot.actor ? r.to : r.from}</b>
            <small>
              {r.status === "accepted"
                ? "友人になりました"
                : r.to === snapshot.actor
                  ? "友人申請が届いています"
                  : "承認を待っています"}
            </small>
          </div>
          {r.status === "pending" && r.to === snapshot.actor && (
            <button
              onClick={() =>
                void api("accept", { id: r.id })
                  .then(refresh)
                  .catch((e) => setError(e.message))
              }
            >
              承認
            </button>
          )}
        </div>
      ))}
      {error && <p className="error">{error}</p>}
      <div className="empty-card">
        <b>好みの共通点から、一緒の散歩へ</b>
        <p>
          相性の比較・二人の経路作成は次の実装対象です。共有方法が決まるまで、友人の非公開記録は読み込みません。
        </p>
      </div>
    </section>
  );
}
