"use client";
import { useState } from "react";
import {
  ArrowLeft,
  Camera,
  ChevronRight,
  Clock3,
  Coffee,
  Footprints,
  MapPin,
  MessageCircle,
  Navigation,
  Settings2,
  ShoppingBag,
  Sparkles,
  Sun,
  UserRound,
  Users,
  Utensils,
  WalletCards,
} from "lucide-react";
import type { FeatureContext } from "../../contracts";
import type { RouteProposal } from "../../contracts/routes";
import { api } from "../../client/api";

const moods = [
  ["のんびり", Sun],
  ["グルメ", Utensils],
  ["カフェ", Coffee],
  ["写真・絶景", Camera],
  ["ショッピング", ShoppingBag],
  ["運動・散歩", Footprints],
] as const;
const scenes = [
  ["ひとりで", "マイペースに楽しむ", UserRound],
  ["友だちと", "みんなでわいわい", Users],
  ["デートで", "特別な一日を", MessageCircle],
] as const;
const conditions = [
  ["予算", WalletCards],
  ["時間", Clock3],
  ["エリア", MapPin],
  ["その他の条件", Settings2],
] as const;

export function Transfer({
  snapshot,
  places,
  selected,
  refresh,
  onRouteGenerated,
  onEnterMap,
  onBack,
}: FeatureContext & {
  onBack: () => void;
  onRouteGenerated: (route: RouteProposal) => void;
  onEnterMap: () => void;
}) {
  const [start, setStart] = useState("oasis"),
    [end, setEnd] = useState("hisaya"),
    [via, setVia] = useState<string[]>([]);
  const [prompt, setPrompt] = useState(""),
    [mood, setMood] = useState("のんびり"),
    [scene, setScene] = useState("ひとりで"),
    [condition, setCondition] = useState<string[]>([]);
  const [advanced, setAdvanced] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [result, setResult] = useState<RouteProposal | undefined>(
    snapshot.route && places.some((p) => p.id === snapshot.route?.start.id)
      ? snapshot.route
      : undefined,
  );
  async function generate() {
    setBusy(true);
    setError("");
    const preference = [
      prompt.trim(),
      `気分: ${mood}`,
      `シーン: ${scene}`,
      condition.length ? `こだわり: ${condition.join("、")}` : "",
    ]
      .filter(Boolean)
      .join(" / ");
    try {
      const route = await api<RouteProposal>("route", {
        start,
        end,
        via,
        placeId: selected?.id ?? null,
        preference,
      });
      setResult(route);
      onRouteGenerated(route);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="explore-planner">
      <div className="explore-sky" aria-hidden="true" />
      <header className="explore-topbar">
        <button aria-label="地図メニューに戻る" onClick={onBack}>
          <ArrowLeft />
        </button>
        <button
          className="ai-auto"
          onClick={() => void generate()}
          disabled={busy}
        >
          <Sparkles /> AIにおまかせ
        </button>
      </header>
      <div className="explore-intro">
        <div className="eyebrow">探索モード</div>
        <h1>どこへ行こう？</h1>
        <p>
          今日はどんな気分？
          <br />
          あなたにぴったりのまち歩きをAIが提案します。
        </p>
      </div>
      <div className="explore-body">
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-heading">
          <span>
            <Sparkles /> AIがあなただけのルートを提案
          </span>
          <h2>どんな一日を過ごしたいですか？</h2>
        </div>
        <label className="explore-prompt">
          <MessageCircle aria-hidden="true" />
          <span>
            <input
              aria-label="希望するまち歩き"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例：緑の多いカフェでのんびりしたい"
            />
          </span>
          <button
            aria-label="希望から提案する"
            onClick={() => void generate()}
            disabled={busy}
          >
            <Navigation />
          </button>
        </label>
        <div className="planner-group mood-group">
          <div className="mood-options">
            {moods.map(([label, Icon]) => (
              <button
                key={label}
                className={mood === label ? "selected" : ""}
                aria-pressed={mood === label}
                onClick={() => setMood(label)}
              >
                <Icon />
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="planner-group">
          <h2>シーンから選ぶ</h2>
          <div className="scene-options">
            {scenes.map(([label, sub, Icon]) => (
              <button
                key={label}
                className={scene === label ? "selected" : ""}
                aria-pressed={scene === label}
                onClick={() => setScene(label)}
              >
                <Icon />
                <strong>{label}</strong>
                <span>{sub}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="planner-group">
          <h2>こだわり条件</h2>
          <div className="condition-options">
            {conditions.map(([label, Icon]) => (
              <button
                key={label}
                className={condition.includes(label) ? "selected" : ""}
                aria-pressed={condition.includes(label)}
                onClick={() =>
                  setCondition((v) =>
                    v.includes(label)
                      ? v.filter((x) => x !== label)
                      : [...v, label],
                  )
                }
              >
                <Icon />
                {label}
              </button>
            ))}
          </div>
        </div>
        <button
          className="advanced-toggle"
          aria-expanded={advanced}
          onClick={() => setAdvanced(!advanced)}
        >
          出発地・目的地・経由地を指定する <ChevronRight />
        </button>
        {advanced && (
          <div className="route-advanced">
            <label>
              出発地
              <select
                aria-label="出発地"
                value={start}
                onChange={(e) => {
                  setStart(e.target.value);
                  setVia((v) => v.filter((id) => id !== e.target.value));
                }}
                disabled={busy}
              >
                <option value="gps">最後に取得したGPS位置（5分以内）</option>
                {places.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              目的地
              <select
                aria-label="目的地"
                value={end}
                onChange={(e) => {
                  setEnd(e.target.value);
                  setVia((v) => v.filter((id) => id !== e.target.value));
                }}
                disabled={busy}
              >
                {places.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <fieldset disabled={busy}>
              <legend>必ず通りたい場所（選んだ順）</legend>
              {places
                .filter((p) => p.id !== start && p.id !== end)
                .map((p) => (
                  <label className="route-via" key={p.id}>
                    <input
                      type="checkbox"
                      checked={via.includes(p.id)}
                      onChange={(e) =>
                        setVia((v) =>
                          e.target.checked
                            ? [...v, p.id]
                            : v.filter((id) => id !== p.id),
                        )
                      }
                    />
                    {p.name}
                    {via.includes(p.id) && ` (${via.indexOf(p.id) + 1})`}
                  </label>
                ))}
            </fieldset>
          </div>
        )}
        <button
          className="explore-submit"
          disabled={busy}
          onClick={() => void generate()}
        >
          <Sparkles />
          {busy
            ? "AIがルートを考えています…"
            : "この条件でルートを提案してもらう"}
          <ChevronRight />
        </button>
        <p className="planner-note">
          候補は名古屋の登録済み{places.length}
          地点です。営業時間・入口の通行可否は未確認です。
        </p>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {result && (
          <article className="route-result">
            <h3>
              {result.status === "ready"
                ? "おすすめの徒歩ルート"
                : "立ち寄り先の提案"}
            </h3>
            <p>{result.explanation}</p>
            <ol>
              <li>{result.start.name}（出発）</li>
              {result.stops.map((s) => (
                <li key={s.place.id}>
                  <b>{s.place.name}</b>
                  <p>{s.reason}</p>
                </li>
              ))}
              <li>{result.end.name}（到着）</li>
            </ol>
            {result.route && result.status === "ready" ? (
              <>
                <strong>
                  {(result.route.distance / 1000).toFixed(1)} km · 徒歩 約
                  {Math.ceil(result.route.duration / 60)}分
                </strong>
                <p className="muted">
                  立ち寄り時間は含みません。指定地点の近くの歩道へ接続します。
                </p>
                <p className="route-on-map" role="status">
                  <Navigation /> AI提案ルートを地図に表示中
                </p>
                <button className="enter-proposed-map" onClick={onEnterMap}>
                  <Navigation /> このルートで地図の世界に入る
                  <ChevronRight />
                </button>
                <small>
                  経路：openrouteservice / © OpenStreetMap contributors
                </small>
              </>
            ) : (
              <p role="status" className="inline-note">
                {result.status === "needs-key"
                  ? "経由地の提案はできました。徒歩経路の取得にはサーバーのORS_API_KEY設定が必要です。"
                  : result.error}{" "}
                道順はまだ作成されていません。
              </p>
            )}
          </article>
        )}
      </div>
    </section>
  );
}
