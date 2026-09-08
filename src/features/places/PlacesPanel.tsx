"use client";
import { useEffect, useRef, useState } from "react";
import type {
  PlaceQuery,
  PlaceSearchResult,
  SemanticPlace,
} from "../../contracts/places";
export function PlacesPanel({
  actor,
  query,
  onPlaces,
  selected,
  onSelect,
  relationship,
}: {
  actor: string;
  query: PlaceQuery;
  onPlaces: (p: SemanticPlace[]) => void;
  selected: SemanticPlace | null;
  onSelect: (p: SemanticPlace | null) => void;
  relationship?: import("react").ReactNode;
}) {
  const [open, setOpen] = useState(false),
    [result, setResult] = useState<PlaceSearchResult | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [filter, setFilter] = useState("");
  const dialog = useRef<HTMLDialogElement>(null),
    request = useRef(0),
    controller = useRef<AbortController | null>(null);
  async function search(network = false, approve = false) {
    const version = ++request.current;
    controller.current?.abort();
    const control = new AbortController();
    controller.current = control;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...query, network, approve }),
        signal: control.signal,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "周辺情報を読み込めませんでした");
      if (version !== request.current) return;
      setResult(data);
      onPlaces(data.places);
      setFilter("");
    } catch (e) {
      if (version === request.current && !control.signal.aborted)
        setError(e instanceof Error ? e.message : "取得できませんでした");
    } finally {
      if (version === request.current) setBusy(false);
    }
  }
  useEffect(() => {
    const timer = setTimeout(() => void search(), 500);
    return () => {
      clearTimeout(timer);
      request.current++;
      controller.current?.abort();
    };
  }, [actor, query.lat, query.lng, query.radius]); // Cache only: map gestures never trigger external queries.
  useEffect(() => {
    if (open || selected) {
      if (!dialog.current?.open) dialog.current?.showModal();
    } else dialog.current?.close();
  }, [open, selected]);
  function close() {
    setOpen(false);
    onSelect(null);
  }
  function update() {
    const approve = Boolean(result?.approvalRequired);
    if (
      approve &&
      !window.confirm(
        "OpenStreetMapのOverpass APIへ、地図の検索中心（約200m単位に丸めた座標）と半径を送信します。会話や訪問履歴は送りません。以降もこの利用者の周辺更新を許可しますか？",
      )
    )
      return;
    void search(true, approve);
  }
  const visible = (result?.places || []).filter(
    (p) => !filter || p.categoryL1 === filter,
  );
  return (
    <>
      <button className="poi-launch" onClick={() => setOpen(true)}>
        📍 周辺の場所{result ? ` · ${result.places.length}` : ""}
      </button>
      <dialog
        className="poi-dialog"
        ref={dialog}
        onCancel={close}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="poi-heading">
          <h2>
            {selected ? `${selected.icon} ${selected.name}` : "周辺の場所"}
          </h2>
          <button onClick={close} aria-label="周辺情報を閉じる">
            閉じる
          </button>
        </div>
      {selected ? (
        <>
          {relationship}
            <dl className="poi-details">
              <dt>カテゴリ</dt>
              <dd>
                {selected.category}
                <small>{selected.categoryPath.join(" › ")}</small>
              </dd>
              <dt>ブランド</dt>
              <dd>
                {selected.brand || "未登録"}
                {selected.brandMatch === "name_hint" && "（店名からの候補）"}
                <small>{selected.brandId}</small>
              </dd>
              <dt>営業時間</dt>
              <dd>{selected.openingHours || "未登録"}</dd>
              <dt>階数</dt>
              <dd>{selected.level || "未登録"}</dd>
              <dt>建物</dt>
              <dd>
                {result?.buildings.find((b) => b.id === selected.buildingId)
                  ?.name ||
                  selected.buildingId ||
                  "未関連付け"}
                {selected.buildingLink === "spatial_candidate" &&
                  "（位置から推定）"}
              </dd>
              <dt>データソース</dt>
              <dd>
                {selected.source === "osm" ? "OpenStreetMap" : selected.source}{" "}
                · {selected.sourceId}
              </dd>
            </dl>
            {selected.source === "osm" &&
              /^(node|way|relation)\/\d+$/.test(selected.sourceId) && (
                <a
                  href={`https://www.openstreetmap.org/${selected.sourceId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  OpenStreetMapで詳細を見る
                </a>
              )}
            <p>
              <button
                onClick={() => {
                  setOpen(true);
                  onSelect(null);
                }}
              >
                一覧に戻る
              </button>
            </p>
          </>
        ) : (
          <>
            <p>
              地図の中心から半径{query.radius}
              m。現在地ボタンで移動すると、その周辺を検索できます。
            </p>
            <button onClick={update} disabled={busy}>
              {busy ? "読み込み中…" : "この周辺を更新"}
            </button>
            <label>
              種類{" "}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="">すべて</option>
                {[
                  ...new Set((result?.places || []).map((p) => p.categoryL1)),
                ].map((c) => (
                  <option key={c} value={c}>
                    {(
                      {
                        food: "飲食",
                        shopping: "買い物",
                        outdoors: "自然",
                        education: "教育",
                        work: "仕事",
                        residential: "住宅",
                        culture: "文化",
                        travel: "旅行",
                        transport: "交通",
                        entertainment: "娯楽",
                        other: "その他",
                      } as Record<string, string>
                    )[c] || c}
                  </option>
                ))}
              </select>
            </label>
            {result?.warning && <p role="status">{result.warning}</p>}
            {error && <p role="alert">{error}</p>}
            <small>
              {result?.fetchedAt &&
                `取得日 ${result.fetchedAt.slice(0, 10)} · `}
              © OpenStreetMap contributors / ODbL
              {result?.truncated && " · 近い順に600件まで表示"}
            </small>
            <div className="poi-list">
              {visible.map((p) => (
                <button key={p.id} onClick={() => onSelect(p)}>
                  <span>{p.icon}</span>
                  <span>
                    {p.name}
                    <small>
                      {p.category}
                      {p.brand ? ` · ${p.brand}` : ""}
                    </small>
                  </span>
                </button>
              ))}
              {!busy && !visible.length && (
                <p>
                  この範囲の情報はありません。周辺を更新するか、地図を移動してください。
                </p>
              )}
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
