"use client";
import { useState } from "react";
import type { SemanticPlace } from "../../contracts/places";
import type { PersonalState } from "../../contracts/personal-insights";
import { personalApi } from "../../client/personal";
export function PlaceRelationshipSheet({
  place,
  state,
  onChange,
}: {
  place: SemanticPlace;
  state: PersonalState | null;
  onChange: (s: PersonalState) => void;
}) {
  const [form, setForm] = useState(false),
    [minutes, setMinutes] = useState(""),
    [company, setCompany] = useState("unknown"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const relation = state?.relations.find((r) => r.placeId === place.id),
    insight = state?.snapshots[0]?.result.placeRelationships.find(
      (r) => r.placeId === place.id,
    );
  async function mutate(body: unknown) {
    setBusy(true);
    setError("");
    try {
      onChange(await personalApi(body));
      setForm(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="place-relationship">
      <div className="eyebrow">YOU & THIS PLACE</div>
      <h3>あなたとこの場所</h3>
      <div className="relation-facts">
        <strong>
          {relation?.visitCount || 0}
          <small>確認済みの訪問</small>
        </strong>
        <strong>
          {relation?.totalStayMinutes || 0}
          <small>分の記録済み滞在</small>
        </strong>
      </div>
      {relation?.unknownDurationVisits ? (
        <small>
          滞在時間が未記録の訪問が{relation.unknownDurationVisits}件あります。
        </small>
      ) : null}
      {relation?.firstVisitedAt && (
        <p>
          初訪問 {new Date(relation.firstVisitedAt).toLocaleDateString("ja-JP")}
          <br />
          最近の訪問{" "}
          {new Date(relation.lastVisitedAt!).toLocaleDateString("ja-JP")}
        </p>
      )}
      {insight && (
        <div className="personal-interpretation">
          <small>
            AIの解釈 · 確信度 {Math.round(insight.confidence * 100)}%
          </small>
          <p>{insight.summary}</p>
          <div className="personal-tags">
            {insight.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      )}
      <div className="personal-actions">
        <button
          disabled={busy}
          aria-pressed={relation?.favorite || false}
          onClick={() =>
            void mutate({
              op: "favorite",
              placeId: place.id,
              favorite: !relation?.favorite,
            })
          }
        >
          {relation?.favorite ? "♥ お気に入り" : "♡ お気に入りにする"}
        </button>
        <button disabled={busy} onClick={() => setForm(!form)}>
          訪問を記録
        </button>
      </div>
      {form && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const duration = minutes === "" ? null : Number(minutes);
            void mutate({
              op: "visit",
              visit: {
                id: crypto.randomUUID(),
                placeId: place.id,
                enteredAt: new Date(
                  Date.now() - (duration ?? 0) * 60000,
                ).toISOString(),
                durationMinutes: duration,
                company,
                weather: "unknown",
              },
            });
          }}
        >
          <p>
            今までの訪問を記録します。移動や通過だけの場合は記録しないでください。
          </p>
          <label>
            滞在時間（分・不明なら空欄）
            <input
              type="number"
              min="0"
              max="1440"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </label>
          <label>
            同行者
            <select
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            >
              <option value="unknown">記録しない</option>
              <option value="solo">一人</option>
              <option value="together">誰かと一緒</option>
            </select>
          </label>
          <button disabled={busy} type="submit">
            この訪問を保存
          </button>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
