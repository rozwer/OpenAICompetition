"use client";
import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Map,
  Users,
  Route,
  Sparkles,
  Leaf,
  MessageCircle,
  UserRound,
  ChevronRight,
  ArrowLeft,
  Expand,
} from "lucide-react";
import type { FeatureContext, Place, Snapshot } from "../contracts";
import { places } from "../fixtures/yokohama";
import { api } from "../client/api";
import { trackLength } from "../domain/tracks";
import { Recording } from "../features/recording/Recording";
import { Conversation } from "../features/conversation/Conversation";
import { Personal } from "../features/personal/Personal";
import { Friends } from "../features/friends/Friends";
import { Transfer } from "../features/transfer/Transfer";
import { Extensions } from "../features/extensions/Extensions";
const MapCanvas = dynamic(
  () => import("../features/map/MapCanvas").then((m) => m.MapCanvas),
  { ssr: false },
);
const tabs = [
  { id: "map", label: "地図", icon: Map },
  { id: "friends", label: "友人", icon: Users },
  { id: "transfer", label: "提案", icon: Route },
  { id: "extensions", label: "機能", icon: Sparkles },
];
export default function Page() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null),
    [actor, setActor] = useState(""),
    [tab, setTab] = useState("map"),
    [selected, setSelected] = useState<Place | null>(null),
    [count, setCount] = useState(0),
    [error, setError] = useState(""),
    [code, setCode] = useState(""),
    [immersive, setImmersive] = useState(false),
    [mobileOpen, setMobileOpen] = useState(false);
  const enterMap = useCallback(() => {
    setImmersive(true);
    setMobileOpen(false);
    if (window.location.hash !== "#explore")
      window.history.pushState({ growMapExplore: true }, "", "#explore");
  }, []);
  const leaveMap = useCallback(() => {
    setImmersive(false);
    setMobileOpen(false);
    if (window.history.state?.growMapExplore) window.history.back();
    else if (window.location.hash === "#explore")
      window.history.replaceState(null, "", window.location.pathname);
  }, []);
  useEffect(() => {
    const sync = () => {
      setImmersive(window.location.hash === "#explore");
      setMobileOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") leaveMap();
    };
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("keydown", escape);
    };
  }, [leaveMap]);
  const refresh = useCallback(async () => {
    const state = await api("state");
    setSnapshot(state);
    setActor(state.actor);
  }, []);
  useEffect(() => {
    void refresh().catch(() => {});
  }, [refresh]);
  const pending = snapshot?.messages.some(
    (m) =>
      m.role === "user" && (m.status === "saved" || m.status === "running"),
  );
  useEffect(() => {
    if (!actor) return;
    const timer = setInterval(
      () => void refresh().catch((e) => setError(e.message)),
      pending ? 1800 : 6000,
    );
    return () => clearInterval(timer);
  }, [actor, pending, refresh]);
  async function login(a: string) {
    setError("");
    try {
      await api("session", { actor: a, code });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const select = useCallback((p: Place | null) => {
    setSelected(p);
    setTab("map");
    setMobileOpen(true);
  }, []);
  const ctx: FeatureContext | null = snapshot
    ? { snapshot, places, selected, refresh, select }
    : null;
  return (
    <main className={`app ${immersive ? "exploring" : ""}`}>
      <aside className="rail">
        <a className="logo" href="/" aria-label="育てる地図">
          <Leaf size={26} />
        </a>
        <div className="rail-links">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? "active" : ""}
              onClick={() => {
                setTab(t.id);
                setMobileOpen(t.id !== "map");
              }}
            >
              <t.icon size={21} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        <button
          className={`profile-link ${tab === "personal" ? "active" : ""}`}
          aria-label="タイプ診断"
          onClick={() => {
            setTab("personal");
            setMobileOpen(true);
          }}
        >
          <UserRound size={20} />
        </button>
      </aside>
      <div className="workspace">
        <header>
          <div className="wordmark">
            育てる地図<span>YOUR WORLD, GROWING.</span>
          </div>
          <div className="header-meta">
            <span className="status-dot" />
            ローカルデモ{" "}
            <select
              aria-label="デモ利用者"
              value={actor}
              onChange={(e) => void login(e.target.value)}
            >
              <option value="" disabled>
                利用者
              </option>
              <option value="A">利用者 A</option>
              <option value="B">利用者 B</option>
            </select>
          </div>
        </header>
        <div className="main-grid">
          <section className="map-region">
            <MapCanvas route={snapshot?.route}
              points={snapshot?.points || []}
              places={places}
              selected={selected}
              onSelect={select}
              onCount={setCount}
              immersive={immersive}
              onEnter={enterMap}
            />
            {immersive ? (
              <div className="explore-toolbar">
                <button onClick={leaveMap}>
                  <ArrowLeft size={18} />
                  ホームに戻る
                </button>
                <span>YOKOHAMA / 街を探索中</span>
              </div>
            ) : (
              <button className="enter-map" onClick={enterMap}>
                <Expand size={16} />
                地図の世界に入る<span>地図をタップして探索</span>
              </button>
            )}
            {immersive && (
              <div className="explore-hint">
                人物の周りをなぞって回転 · ピンチで拡大
              </div>
            )}
            <div className="map-heading">
              <div className="eyebrow">MY GROWING MAP</div>
              <h1>
                歩くほど、
                <br />
                自分が見える。
              </h1>
              <p>横浜 · 元町 / 山下公園</p>
            </div>
            <div className="map-city">
              YOKOHAMA <span>↗</span>
            </div>
            <div className="map-legend">
              <span>
                <i />
                歩いた周辺
              </span>
              <span>
                <i />
                まだ知らない場所
              </span>
            </div>
            <div className="map-bottom">
              <div className="journey-card">
                <div>
                  <small>今日の小さな発見</small>
                  <strong>
                    {count}
                    <span>棟の輪郭を解放</span>
                  </strong>
                </div>
                <div className="journey-distance">
                  <b>
                    {(
                      (snapshot ? trackLength(snapshot.points) : 0) / 1000
                    ).toFixed(2)}
                  </b>
                  <span>km の記録</span>
                </div>
              </div>
              {ctx && <Recording key={actor} {...ctx} />}
              <p className="map-footnote">
                実際の建物輪郭 · 高さ・外観は演出モデル · 解放範囲20m
              </p>
            </div>
            <button
              className="mobile-conversation"
              onClick={() => setMobileOpen(true)}
            >
              <MessageCircle size={18} />
              地図と話す
              <ChevronRight size={16} />
            </button>
          </section>
          <aside className={`side-panel ${mobileOpen ? "mobile-open" : ""}`}>
            <button
              className="mobile-close"
              onClick={() => setMobileOpen(false)}
            >
              地図に戻る
            </button>
            {ctx ? (
              tab === "map" ? (
                <Conversation key={actor} {...ctx} onPlanRoute={() => { setTab("transfer"); setMobileOpen(true); }} />
              ) : tab === "personal" ? (
                <Personal key={actor} {...ctx} />
              ) : tab === "friends" ? (
                <Friends key={actor} {...ctx} />
              ) : tab === "transfer" ? (
                <Transfer key={actor} {...ctx} onShowMap={() => { if (immersive) leaveMap(); setTab("map"); setMobileOpen(false); }} />
              ) : (
                <Extensions />
              )
            ) : (
              <section className="welcome">
                <span className="welcome-leaf">
                  <Leaf size={34} />
                </span>
                <div className="eyebrow">HELLO, EXPLORER</div>
                <h2>
                  あなたの街を、
                  <br />
                  育てよう。
                </h2>
                <p>
                  散歩を再生して、場所について話す。
                  <br />
                  小さな記憶が、自分だけの地図になる。
                </p>
                <button className="primary" onClick={() => void login("A")}>
                  利用者 A で始める <ChevronRight size={17} />
                </button>
                <button onClick={() => void login("B")}>
                  利用者 B で始める
                </button>
                <input
                  aria-label="デモ接続コード"
                  placeholder="別端末から接続する場合のコード"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  type="password"
                />
                <small>架空の二人を使う開発用デモです。</small>
              </section>
            )}
          </aside>
        </div>
        {error && (
          <div
            className="global-error"
            role="alert"
            onClick={() => setError("")}
          >
            {error} ×
          </div>
        )}
        <footer>
          <span>歩く。気づく。自分の地図になる。</span>
          <span>YOKOHAMA FIELD NOTES / 01</span>
        </footer>
      </div>
    </main>
  );
}


