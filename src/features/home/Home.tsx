"use client";
import {
  Navigation,
  Users,
  UserRound,
  Footprints,
  MessageCircle,
  Sprout,
  Waves,
  Coffee,
  Mountain,
  Route,
  ChevronRight,
  MapPin,
} from "lucide-react";
import type { Snapshot } from "../../contracts";
import { trackLength } from "../../domain/tracks";

type Props = {
  snapshot: Snapshot;
  mapMenu?: boolean;
  onActor?(actor: string): void;
  onExplore(): void;
  onSection(section: string): void;
};
export function Home({
  snapshot,
  onExplore,
  onSection,
  mapMenu = false,
  onActor,
}: Props) {
  const places = new Set(
    snapshot.messages
      .filter((m) => m.role === "user" && m.placeId)
      .map((m) => m.placeId),
  ).size;
  return (
    <section
      className={`home-screen ${mapMenu ? "map-menu-screen" : ""}`}
      aria-label={mapMenu ? "地図メニュー" : "ホーム"}
    >
      <div className="home-art" aria-hidden="true" />
      <header className="home-header">
        <div className="home-brand">
          育てる地図<span>YOUR WORLD, GROWING.</span>
        </div>
        {mapMenu ? (
          <div className="map-menu-account">
            <span>
              <i />
              ローカルデモ
            </span>
            <select
              aria-label="デモ利用者"
              value={snapshot.actor}
              onChange={(e) => onActor?.(e.target.value)}
            >
              <option value="A">利用者 A</option>
              <option value="B">利用者 B</option>
            </select>
          </div>
        ) : (
          <button
            className="home-profile"
            aria-label="プロフィールをひらく"
            onClick={() => onSection("personal")}
          >
            <UserRound size={26} strokeWidth={1.6} />
          </button>
        )}
      </header>
      <div className="home-copy">
        {mapMenu && <div className="eyebrow">MY GROWING MAP</div>}
        <h1>
          歩くほど、
          <br />
          自分が見える。
        </h1>
        <p>
          {mapMenu
            ? "行った場所が、つながっていく。"
            : "行った場所が、あなたをつくる。"}
          <br />
          {mapMenu
            ? "あなただけの地図を、これからも。"
            : "歩いた分だけ、地図が育っていく。"}
        </p>
      </div>
      {mapMenu ? (
        <div className="map-menu-cards">
          <button
            className="map-menu-card exploration-card"
            onClick={() => onSection("transfer")}
          >
            <span className="map-card-copy">
              <strong>
                <Navigation />
                探索モード
              </strong>
              <span>
                AIが、あなただけの
                <br />
                特別な経路を提案します。
              </span>
            </span>
            <span className="map-card-art" aria-hidden="true">
              <svg viewBox="0 0 240 160">
                <path d="M20 150 C180 125 15 75 160 70 S130 20 220 10" />
              </svg>
              <MapPin className="pin-one" />
              <MapPin className="pin-two" />
            </span>
            <span className="map-card-arrow">
              <ChevronRight />
            </span>
          </button>
          <button
            className="map-menu-card community-card"
            onClick={() => onSection("friends")}
          >
            <span className="map-card-copy">
              <strong>
                <Users />
                みんなの地図
              </strong>
              <span>
                友達の目で、街を見てみよう。
                <br />
                <small>地図を訪ねて、ふたりの好きを比べる。</small>
              </span>
            </span>
            <span className="map-card-art" aria-hidden="true">
              <span className="postcard">
                <Waves />
              </span>
              <span className="postcard">
                <Coffee />
              </span>
              <span className="postcard">
                <Mountain />
              </span>
            </span>
            <span className="map-card-arrow">
              <ChevronRight />
            </span>
          </button>
          <button
            className="map-menu-card history-card"
            onClick={() => onSection("history")}
            aria-label="これまでの軌跡"
          >
            <span className="map-card-copy">
              <strong>
                <Route />
                これまでの軌跡
              </strong>
              <span>
                歩いた場所から、
                <br />
                自分の地図の成長を振り返る。
              </span>
            </span>
            <span className="map-card-art" aria-hidden="true">
              <svg viewBox="0 0 240 160">
                <path d="M0 160 C140 140 35 90 140 80 S150 20 240 0" />
              </svg>
              <span className="postcard">
                <Mountain />
              </span>
              <span className="postcard">
                <Sprout />
              </span>
            </span>
            <span className="map-card-arrow">
              <ChevronRight />
            </span>
          </button>
        </div>
      ) : (
        <>
          <div className="home-world">
            <span className="home-note" aria-hidden="true">
              More places,
              <br />a brighter you.
            </span>
            <button className="home-explore" onClick={onExplore}>
              <Navigation size={38} fill="currentColor" strokeWidth={1.5} />
              <span>地図をひらく</span>
              <small>EXPLORE</small>
            </button>
            <div className="home-pin home-pin-sea" aria-hidden="true">
              <Waves />
            </div>
            <div className="home-pin home-pin-cafe" aria-hidden="true">
              <Coffee />
            </div>
            <div className="home-pin home-pin-hill" aria-hidden="true">
              <Mountain />
            </div>
            <span className="home-discovery">
              新しい発見が
              <br />
              待っています
            </span>
          </div>
          <div className="home-stats" aria-label="あなたの記録">
            <div>
              <strong>
                <Footprints />
                {(trackLength(snapshot.points) / 1000).toFixed(2)}
                <small>km</small>
              </strong>
              <span>記録した距離</span>
            </div>
            <div>
              <strong>
                <MessageCircle />
                {places}
              </strong>
              <span>会話した場所</span>
            </div>
            <div>
              <strong>
                <Sprout />
                {snapshot.memories.length}
              </strong>
              <span>残した記憶</span>
            </div>
          </div>
          <p className="home-caption">
            あなたの記録から育つ地図
            {snapshot.points.some((p) => p.origin === "synthetic")
              ? " · デモの散歩を含みます"
              : ""}
          </p>
        </>
      )}
    </section>
  );
}

