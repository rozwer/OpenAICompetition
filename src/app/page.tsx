"use client";
import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Map,
  Users,
  Sparkles,
  Leaf,
  MessageCircle,
  ChevronRight,
  ArrowLeft,
  Expand,
  House,
} from "lucide-react";
import type { FeatureContext, Place, Snapshot } from "../contracts";
import { places } from "../fixtures/nagoya";
import { api } from "../client/api";
import { trackLength } from "../domain/tracks";
import { Recording } from "../features/recording/Recording";
import { Conversation } from "../features/conversation/Conversation";
import { PersonalInsights } from "../features/personal/PersonalInsights";
import { PlaceRelationshipSheet } from "../features/personal/PlaceRelationshipSheet";
import type { PersonalState } from "../contracts/personal-insights";
import { personalApi } from "../client/personal";
import { HistoryPage } from "../features/history/HistoryPage";
import { Friends } from "../features/friends/Friends";
import { Everyone } from "../features/friends/Everyone";
import { friendLenses, myLens, lensPlaces } from "../fixtures/everyone";
import { Transfer } from "../features/transfer/Transfer";
import { ExtensionHost } from "../features/extensions/ExtensionHost";
import type { ExtensionMarker } from "../contracts/extensions";
import { Extensions } from "../features/extensions/Extensions";
import { Home } from "../features/home/Home";
import { PlacesPanel } from "../features/places/PlacesPanel";
import type { SemanticPlace, PlaceQuery } from "../contracts/places";
const MapCanvas = dynamic(
  () => import("../features/map/MapCanvas").then((m) => m.MapCanvas),
  { ssr: false },
);
export default function Page() {
  const [personal, setPersonal] = useState<PersonalState | null>(null);
  const [semanticPlaces, setSemanticPlaces] = useState<SemanticPlace[]>([]);
  const [poiSelected, setPoiSelected] = useState<SemanticPlace | null>(null);
  const [poiQuery, setPoiQuery] = useState<PlaceQuery>({lat:35.1688,lng:136.9089,radius:1000});
  const [extensionStudio, setExtensionStudio] = useState(false);
  const [extensionMarkers, setExtensionMarkers] = useState<ExtensionMarker[]>([]);
  const [extensionFocus, setExtensionFocus] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null),
    [routePreview, setRoutePreview] = useState<Snapshot["route"]>(),
    [actor, setActor] = useState(""),
    [tab, setTab] = useState("map"),
    [selected, setSelected] = useState<Place | null>(null),
    [count, setCount] = useState(0),
    [error, setError] = useState(""),
    [code, setCode] = useState(""),
    [immersive, setImmersive] = useState(false),
    [home, setHome] = useState(true),
    [mapMenu, setMapMenu] = useState(false),
    [mobileOpen, setMobileOpen] = useState(false);
  const actorRef = useRef(actor); actorRef.current = actor;
  const personalChanged = useCallback((value: PersonalState) => { if (actorRef.current === value.userId) setPersonal(value); }, []);
  useEffect(() => {
    if (!actor) return; let active = true;
    personalApi({op:"state"}).then(value => { if (active) personalChanged(value); }).catch(() => {});
    return () => { active = false; };
  }, [actor, snapshot?.points.length, personalChanged]);
  const actorPersonal = personal?.userId === actor ? personal : null;
  const mapPlaces = useMemo(() => [...new globalThis.Map([...semanticPlaces,...(actorPersonal?.places || [])].map(p=>[p.id,p])).values()].slice(0,800), [semanticPlaces,actorPersonal]);
  const enterMap = useCallback(() => {
    setHome(false);
    setTab("map");
    setImmersive(true);
    setMobileOpen(false);
    if (window.location.hash !== "#explore")
      window.history.pushState({ growMapExplore: true }, "", "#explore");
  }, []);
  const openPlanner = useCallback(() => {
    setImmersive(false);
    setHome(false);
    setTab("transfer");
    setMobileOpen(true);
    window.history.pushState(null, "", "#plan");
  }, []);
  const leaveMap = useCallback(() => {
    setHome(true);
    setImmersive(false);
    setMobileOpen(false);
    if (window.history.state?.growMapExplore) window.history.back();
    else if (window.location.hash === "#explore")
      window.history.replaceState(null, "", window.location.pathname);
  }, []);
  const navigatePrimary = useCallback((target: string) => {
    setImmersive(false);
    setMapMenu(target === "map");
    setHome(target === "home" || target === "map");
    setMobileOpen(target === "apps" || target === "connect");
    setTab(
      target === "apps"
        ? "extensions"
        : target === "connect"
          ? "friends"
          : "map",
    );
    window.history.pushState(
      null,
      "",
      target === "map"
        ? "#maps"
        : target === "apps"
          ? "#apps"
          : target === "connect"
            ? "#friends"
            : window.location.pathname,
    );
  }, []);
  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash;
      setImmersive(hash === "#explore");
      setMapMenu(hash === "#maps");
      setHome(!["#explore", "#plan", "#apps", "#friends", "#history"].includes(hash));
      if (hash === "#history") { setTab("history"); setMobileOpen(false); } else if (hash === "#plan") {
        setTab("transfer");
        setMobileOpen(true);
      } else if (hash === "#apps" || hash === "#friends") {
        setTab(hash === "#apps" ? "extensions" : "friends");
        setMobileOpen(true);
      } else {
        setTab("map");
        setMobileOpen(false);
      }
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
    if (!actor || tab === "history") return;
    const timer = setInterval(
      () => void refresh().catch((e) => setError(e.message)),
      pending ? 1800 : 6000,
    );
    return () => clearInterval(timer);
  }, [actor, pending, refresh, tab]);
  async function login(a: string) {
    setError("");
    setRoutePreview(undefined);
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
  const primarySection = home
    ? mapMenu
      ? "map"
      : "home"
    : tab === "extensions" || tab === "personal"
      ? "apps"
      : tab === "friends"
        ? "connect"
        : "map";
  return (
    <main
      className={`app ${tab === "history" && !home ? "history-active" : ""} ${immersive ? "exploring" : ""} ${home && snapshot && !immersive ? "landing" : ""} ${snapshot && tab === "transfer" && mobileOpen && !home ? "planning" : ""}`}
    >
      {ctx && <ExtensionHost key={actor} ctx={ctx} studio={extensionStudio} onClose={() => { setExtensionStudio(false); setExtensionFocus(null); }} mapVisible={immersive || (!home && tab === "transfer")} onMarkers={setExtensionMarkers} focusId={extensionFocus} />}
      {home && snapshot && !immersive && (
        <Home
          snapshot={snapshot}
          mapMenu={mapMenu}
          onActor={(a) => void login(a)}
          onExplore={enterMap}
          onSection={(section) => {
            if (section === "map" || section === "home") {
              navigatePrimary(section);
              return;
            }
            if (section === "friends" || section === "extensions") {
              navigatePrimary(section === "friends" ? "connect" : "apps");
              return;
            }
            if (section === "history") { setHome(false); setImmersive(false); setTab("history"); setMobileOpen(false); window.history.pushState(null,"","#history"); return; }
            if (section === "transfer") {
              openPlanner();
              return;
            }
            setHome(false);
            setTab(
              section === "conversation" || section === "history"
                ? "map"
                : section,
            );
            setMobileOpen(section !== "history");
          }}
        />
      )}
      {snapshot && tab === "history" && !home && <HistoryPage key={actor} actor={actor} onBack={() => navigatePrimary("map")} onMap={enterMap} />}
      {snapshot && (
        <nav className="app-global-nav" aria-label="ホームナビゲーション">
          <button
            className={primarySection === "map" ? "current" : ""}
            aria-current={primarySection === "map" ? "page" : undefined}
            onClick={() => navigatePrimary("map")}
          >
            <Map />
            <span>地図を育てる</span>
          </button>
          <button
            className={primarySection === "apps" ? "current" : ""}
            aria-current={primarySection === "apps" ? "page" : undefined}
            onClick={() => navigatePrimary("apps")}
          >
            <Sparkles />
            <span>アプリを育てる</span>
          </button>
          <button
            className={primarySection === "home" ? "current" : ""}
            aria-current={primarySection === "home" ? "page" : undefined}
            onClick={() => navigatePrimary("home")}
          >
            <House fill="currentColor" />
            <span>ホーム</span>
          </button>
          <button
            className={primarySection === "connect" ? "current" : ""}
            aria-current={primarySection === "connect" ? "page" : undefined}
            onClick={() => navigatePrimary("connect")}
          >
            <Users />
            <span>つながる</span>
          </button>
        </nav>
      )}
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
            {tab !== "history" && <MapCanvas
              semanticPlaces={home || immersive || tab === "transfer" ? [] : mapPlaces}
              personalRelations={actorPersonal?.relations || []}
              onPoiSelect={setPoiSelected}
              onViewChange={setPoiQuery}
              extensionMarkers={immersive ? [] : extensionMarkers}
              onExtensionSelect={setExtensionFocus}
              route={routePreview ?? snapshot?.route}
              points={snapshot?.points || []}
              places={places}
              selected={selected}
              onSelect={select}
              onCount={setCount}
              immersive={immersive}
              planning={tab === "transfer" && mobileOpen && !home}
              onEnter={enterMap}
            />}
            {immersive ? (
              <div className="explore-toolbar">
                <button onClick={leaveMap}>
                  <ArrowLeft size={18} />
                  ホームに戻る
                </button>
              </div>
            ) : (
              <button className="enter-map" onClick={enterMap}>
                <Expand size={16} />
                地図の世界に入る<span>地図をタップして探索</span>
              </button>
            )}
            {immersive && (
              <>
                <div className="immersive-route-key">
                  <span>
                    <i />
                    AI提案ルート
                  </span>
                  <span>
                    <i />
                    これまでの軌跡
                  </span>
                </div>
                <section className="immersive-action-sheet">
                  <div className="immersive-sheet-handle" aria-hidden="true" />
                  <span>
                    <Sparkles size={16} /> AIが次の散歩を提案
                  </span>
                  <strong>次はどこへ行きますか？</strong>
                  <button onClick={openPlanner}>
                    行き先をAIと探す <ChevronRight size={19} />
                  </button>
                  <div className="immersive-quick-actions">
                    {ctx && <Recording key={`${actor}-gps`} {...ctx} compact />}
                    <button
                      className="talk-place"
                      aria-label="地図と話す"
                      onClick={() => {
                        setTab("map");
                        setMobileOpen(true);
                      }}
                    >
                      <MessageCircle size={17} /> この場所について話す
                    </button>
                  </div>
                </section>
              </>
            )}
            <div className="map-heading">
              <div className="eyebrow">MY GROWING MAP</div>
              <h1>
                歩くほど、
                <br />
                自分が見える。
              </h1>
              <p>名古屋 · 栄 / 久屋大通</p>
            </div>
            <div className="map-city">
              NAGOYA <span>↗</span>
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
              {ctx && !immersive && <Recording key={actor} {...ctx} />}
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
            {ctx ? (
              tab === "map" ? (
                <Conversation
                  key={actor}
                  {...ctx}
                  onPlanRoute={() => {
                    openPlanner();
                  }}
                />
              ) : tab === "personal" ? (
                <PersonalInsights key={actor} state={actorPersonal} onChange={personalChanged} onMap={enterMap}/>
              ) : tab === "friends" ? (
                <Everyone key={actor} friends={friendLenses} mine={myLens} places={lensPlaces} invitations={<Friends {...ctx} />} />
              ) : tab === "transfer" ? (
                <Transfer
                  key={actor}
                  {...ctx}
                  onRouteGenerated={(route) => {
                    setRoutePreview(route);
                    setSnapshot((current) =>
                      current ? { ...current, route } : current,
                    );
                  }}
                  onEnterMap={enterMap}
                  onBack={() => navigatePrimary("map")}
                />
              ) : tab === "history" ? null : (
                <Extensions
                  onCreate={() => setExtensionStudio(true)}
                  onBack={() => navigatePrimary("home")}
                  onDiagnosis={() => {
                    setTab("personal");
                    setMobileOpen(true);
                  }}
                />
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
          <span>NAGOYA FIELD NOTES / 01</span>
        </footer>
      </div>
    </main>
  );
}





