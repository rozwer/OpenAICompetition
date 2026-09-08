"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { HistoryData, HistoryMode } from "../../contracts/history";
import { japanDay } from "../../domain/history";
import { DayJourneyTimeline, MonthlyRecap } from "./HistorySections";
const HistoryMap = dynamic(
  () => import("./HistoryMap").then((m) => m.HistoryMap),
  { ssr: false },
);
export function HistoryPage({
  actor,
  onBack,
  onMap,
}: {
  actor: string;
  onBack: () => void;
  onMap: () => void;
}) {
  const [mode, setMode] = useState<HistoryMode>("replay"),
    [month, setMonth] = useState(japanDay(Date.now()).slice(0, 7)),
    [date, setDate] = useState(japanDay(Date.now())),
    [data, setData] = useState<HistoryData | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [playing, setPlaying] = useState(false),
    [onlyNew, setOnlyNew] = useState(false),
    [selected, setSelected] = useState<string | null>(null),
    [retry, setRetry] = useState(0);
  const cache = useRef(new Map<string, HistoryData>()),
    generation = useRef(0);
  const period = mode === "day" ? date : month;
  const today = japanDay(Date.now());
  function moveDay(offset: number) {
    setSelected(null);
    setDate(new Date(Date.parse(date + "T00:00:00Z") + offset * 86400000).toISOString().slice(0, 10));
  }
  useEffect(() => {
    let active = true;
    const version = ++generation.current,
      key = `${actor}:${mode}:${period}`,
      cached = cache.current.get(key),
      controller = new AbortController();
    setError("");
    if (cached) setData(cached);
    setBusy(!cached);
    if (cached)
      return () => {
        active = false;
      };
    const timer = setTimeout(() => {
      fetch(`/api/history?mode=${mode}&period=${period}`, {
        signal: controller.signal,
      })
        .then(async (r) => {
          const value = await r.json();
          if (!r.ok) throw Error(value.error);
          if (active && version === generation.current) {
            cache.current.set(key, value);
            if (cache.current.size > 30)
              cache.current.delete(cache.current.keys().next().value!);
            setData(value);
          }
        })
        .catch((e) => {
          if (active && !controller.signal.aborted) setError(e.message);
        })
        .finally(() => {
          if (active) setBusy(false);
        });
    }, 150);
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [actor, mode, period, retry]);
  useEffect(() => {
    if (!playing || busy || !data || mode !== "replay") return;
    const timer = setTimeout(() => {
      const index = data.months.indexOf(month);
      if (index < 0 || index >= data.months.length - 1) {
        setPlaying(false);
        return;
      }
      setMonth(data.months[index + 1]);
    }, 1100);
    return () => clearTimeout(timer);
  }, [playing, busy, data, month, mode]);
  function changeMode(value: HistoryMode) {
    setPlaying(false);
    setMode(value);
    setOnlyNew(false);
    if (value === "day")
      setDate(month === today.slice(0, 7) ? today : data?.days.find((d) => d.startsWith(month)) || month + "-01");
    else if (mode === "day") setMonth(date.slice(0, 7));
  }
  async function generate() {
    setBusy(true);
    setError("");
    const version = generation.current;
    try {
      const r = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      });
      const value = await r.json();
      if (!r.ok) throw Error(value.error);
      if (version === generation.current) {
        cache.current.clear();
        setData(value);
      }
    } catch (e) {
      if (version === generation.current) setError((e as Error).message);
    } finally {
      if (version === generation.current) setBusy(false);
    }
  }
  const current = data?.mode === mode && (mode !== "day" || data.period === date) ? data : null;
  const pins =
      mode === "day"
        ? current?.day?.pins || []
        : (current?.replay.pins || []).filter((p) => !onlyNew || p.isNew),
    route = mode === "day" ? current?.day?.route : current?.replay.route;
  return (
    <section className="history-page" data-mode={mode} aria-label="これまでの軌跡">
      {mode === "day" && <div className="journey-datebar">
        <button className="journey-round" onClick={onBack} aria-label="地図メニューに戻る"><ChevronLeft /></button>
        <div className="journey-datepill">
          <button onClick={() => moveDay(-1)} aria-label="前の日"><ChevronLeft size={18} /></button>
          <span>{new Date(date + "T00:00:00+09:00").toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "long", day: "numeric", weekday: "short" })}</span>
          <button onClick={() => moveDay(1)} disabled={date >= today} aria-label="次の日"><ChevronRight size={18} /></button>
        </div>
        <label className="journey-round journey-calendar"><CalendarDays size={21} /><input aria-label="履歴の日付" type="date" value={date} max={today} onChange={(e) => { if (e.target.value && e.target.value <= today) { setDate(e.target.value); setSelected(null); } }} /></label>
      </div>}
      <header className="history-header">
        <button onClick={onBack} aria-label="地図メニューに戻る">
          ←
        </button>
        <div className="eyebrow">YOUR JOURNEY, GROWING</div>
        <h1>
          {mode === "day"
            ? "その日の歩み"
            : mode === "month"
              ? "今月の振り返り"
              : "これまでの軌跡"}
        </h1>
        <p>歩いた場所が、あなたの地図を育てていく。</p>
      </header>
      <div
        className="history-tabs"
        role="tablist"
        aria-label="履歴の表示モード"
      >
        {(
          [
            ["replay", "Replay"],
            ["day", "Day"],
            ["month", "Month"],
          ] as const
        ).map(([id, label]) => (
          <button
            role="tab"
            aria-selected={mode === id}
            key={id}
            onClick={() => changeMode(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {mode !== "day" && <label className="history-date">
        <span>振り返る月</span>
        <input
          aria-label="履歴の月"
          type="month"
          value={period}
          max={today.slice(0, 7)}
          onChange={(e) => {
            if (!e.target.value) return;
            setPlaying(false);
            setMonth(e.target.value);
          }}
        />
      </label>}
      {error && (
        <p role="alert">
          {error}
          <button
            onClick={() => {
              cache.current.clear();
              setRetry((n) => n + 1);
            }}
          >
            再試行
          </button>
        </p>
      )}
      {busy && (
        <p role="status" className="history-loading">
          読み込み中…
        </p>
      )}
      {current?.empty ? (
        <div className="history-empty">
          <img src="/images/history/empty.png" alt="街を眺める人のイラスト" />
          <h2>まだ、軌跡がありません</h2>
          <p>
            街を歩くと、あなたの行動がここに残り、
            <br />
            少しずつ地図が育っていきます。
          </p>
          <button onClick={onMap}>地図を開く</button>
        </div>
      ) : (
        current && (
          <>
            <HistoryMap
              pins={pins}
              route={
                route || {
                  lines: [],
                  kind: "none",
                  distanceMeters: null,
                  simplified: false,
                }
              }
              onSelect={(p) => {
                if (busy) return;
                if (mode === "day") {
                  setSelected(p.id);
                  document
                    .getElementById(`visit-${p.id}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
                } else {
                  setPlaying(false);
                  setDate(japanDay(p.firstVisitedAt));
                  setMode("day");
                }
              }}
            />
            <div className="history-content">
              {mode === "day" && <div className="journey-sheet-heading"><div><span className="journey-kicker">DAY JOURNEY</span><h1>{date === today ? "今日の振り返り" : "この日の振り返り"}</h1></div><button onClick={() => { setDate(today); setSelected(null); }} disabled={date === today}>今日</button></div>}
              {current.warning && <p role="status">{current.warning}</p>}
              {current.truncated && (
                <small>件数上限により一部の記録を表示しています。</small>
              )}
              <small className="history-route-note">
                {route?.kind === "visit_order"
                  ? "破線は訪問順の目安です。実際に歩いた経路ではありません。"
                  : route?.kind === "gps"
                    ? "線は記録されたGPS軌跡です。欠測区間はつなぎません。"
                    : "GPS軌跡の記録はありません。"}
              </small>
              {mode === "replay" ? (
                <>
                  <div className="replay-legend">
                    <span>● この月に初訪問</span>
                    <span>◌ 以前からの場所</span>
                    <span>● 3回以上訪問</span>
                  </div>
                  <div className="replay-controls">
                    <button
                      disabled={current.months.length < 2}
                      aria-label={playing ? "リプレイを停止" : "リプレイを再生"}
                      onClick={() => {
                        if (!playing && month === current.months.at(-1))
                          setMonth(current.months[0]);
                        setPlaying(!playing);
                      }}
                    >
                      {playing ? "Ⅱ" : "▶"}
                    </button>
                    <input
                      type="range"
                      aria-label="リプレイの月"
                      min="0"
                      max={Math.max(0, current.months.length - 1)}
                      value={Math.max(0, current.months.indexOf(month))}
                      onChange={(e) => {
                        setPlaying(false);
                        setMonth(current.months[Number(e.target.value)]);
                      }}
                    />
                    <strong>{month}</strong>
                  </div>
                  <label>
                    <input
                      type="checkbox"
                      checked={onlyNew}
                      onChange={(e) => setOnlyNew(e.target.checked)}
                    />{" "}
                    この月に初めて訪れた場所だけ
                  </label>
                  <div className="history-stats">
                    <span>
                      <b>{current.replay.pins.length}</b>この時点までの場所
                    </span>
                    <span>
                      <b>{current.summary.newPlaces}</b>この月の新しい場所
                    </span>
                    <span>
                      <b>{current.summary.visitDays}</b>この月の訪問日数
                    </span>
                  </div>
                  <h3>最近の記録</h3>
                  {current.days
                    .filter((d) => d.startsWith(month))
                    .slice(0, 10)
                    .map((d) => (
                      <button
                        className="recent-day"
                        key={d}
                        onClick={() => {
                          setDate(d);
                          setMode("day");
                          setPlaying(false);
                        }}
                      >
                        {d} の一日を振り返る <span>→</span>
                      </button>
                    ))}
                </>
              ) : mode === "day" && current.day ? (
                <>
                  <DayJourneyTimeline
                    day={current.day}
                    selected={selected}
                    onSelect={setSelected}
                  />
                  <button onClick={() => changeMode("month")}>
                    この月の振り返りへ →
                  </button>
                </>
              ) : (
                <MonthlyRecap
                  summary={current.summary}
                  busy={busy}
                  onAI={() => void generate()}
                  onDiscoveries={() => {
                    setMode("replay");
                    setOnlyNew(true);
                  }}
                />
              )}
            </div>
          </>
        )
      )}
    </section>
  );
}
