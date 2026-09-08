"use client";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, LocateFixed, Upload } from "lucide-react";
import { gpx } from "@tmcw/togeojson";
import { api } from "../../client/api";
import {
  pointSchema,
  type FeatureContext,
  type TrackPoint,
} from "../../contracts";
import { demoTrack } from "../../fixtures/nagoya";
export function Recording({
  snapshot,
  refresh,
  compact = false,
}: FeatureContext & { compact?: boolean }) {
  const [playing, setPlaying] = useState(false),
    [recording, setRecording] = useState(false),
    [error, setError] = useState(""),
    [needsSecureConnection, setNeedsSecureConnection] = useState(false),
    [busy, setBusy] = useState(false);
  const watch = useRef<number | null>(null),
    file = useRef<HTMLInputElement>(null),
    inflight = useRef(false);
  const remaining = demoTrack().filter(
    (p) => !snapshot.points.some((x) => x.id === p.id),
  );
  const latestDevicePoint = snapshot.points
    .filter((p) => p.origin === "device")
    .sort((a, b) => b.time.localeCompare(a.time))[0];
  const next = useRef(remaining);
  next.current = remaining;
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(async () => {
      if (inflight.current) return;
      const batch = next.current.slice(0, 2);
      if (!batch.length) {
        setPlaying(false);
        return;
      }
      inflight.current = true;
      try {
        await api("points", { points: batch });
        await refresh();
      } catch (e) {
        setError((e as Error).message);
        setPlaying(false);
      } finally {
        inflight.current = false;
      }
    }, 650);
    return () => clearInterval(timer);
  }, [playing, refresh]);
  useEffect(
    () => () => {
      if (watch.current !== null)
        navigator.geolocation.clearWatch(watch.current);
    },
    [],
  );
  async function importFile(f: File) {
    setBusy(true);
    setError("");
    try {
      if (f.size > 2_000_000) throw Error("2MB以下のファイルを選んでください");
      const text = await f.text();
      let input: unknown[];
      if (f.name.toLowerCase().endsWith(".gpx")) {
        const xml = new DOMParser().parseFromString(text, "text/xml");
        if (xml.querySelector("parsererror"))
          throw Error("GPXを読み込めません");
        if (!xml.querySelector("gpx"))
          throw Error("GPX形式のファイルを選んでください");
        // Conversion validates geometry support; source trackpoints retain accuracy semantics.
        gpx(xml);
        const { hash } = await api<{ hash: string }>("hash", { text });
        input = Array.from(xml.querySelectorAll("trkpt")).map((p, i) => ({
          id: `gpx-${hash}-${i}`,
          lng: Number(p.getAttribute("lon")),
          lat: Number(p.getAttribute("lat")),
          time: p.querySelector("time")?.textContent || "",
          accuracy: null,
          origin: "imported",
        }));
      } else {
        const parsed = JSON.parse(text);
        input = Array.isArray(parsed) ? parsed : parsed.points;
      }
      if (!Array.isArray(input) || !input.length)
        throw Error("位置記録がありません");
      if (input.length > 10000) throw Error("1万点以下に分割してください");
      const points = input.map((p) => pointSchema.parse(p));
      await api("points", { points });
      await refresh();
      setError(
        points.some((p) => p.accuracy === null)
          ? "取込みました。精度不明の点は保存のみ行い、街の解放・通行済み判定には使いません。"
          : "取込みました。",
      );
    } catch (e) {
      setError(
        (e as Error).message.startsWith("[")
          ? "座標・時刻・精度などの形式を確認してください。"
          : (e as Error).message,
      );
    } finally {
      setBusy(false);
      if (file.current) file.current.value = "";
    }
  }
  function gps() {
    setError("");
    setNeedsSecureConnection(false);
    if (recording) {
      if (watch.current !== null)
        navigator.geolocation.clearWatch(watch.current);
      watch.current = null;
      setRecording(false);
      return;
    }
    if (!navigator.geolocation || !window.isSecureContext) {
      setNeedsSecureConnection(true);
      setError("iPhoneの位置情報を使うにはHTTPS接続が必要です。");
      return;
    }
    setRecording(true);
    watch.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const point: TrackPoint = {
          id: `gps-${pos.timestamp}`,
          lng: pos.coords.longitude,
          lat: pos.coords.latitude,
          time: new Date(pos.timestamp).toISOString(),
          accuracy: pos.coords.accuracy,
          origin: "device",
        };
        try {
          await api("points", { points: [point] });
          await refresh();
        } catch (e) {
          setError((e as Error).message);
        }
      },
      (e) => {
        setError(
          e.code === 1
            ? "位置情報が許可されていません。ブラウザ設定を確認してください。"
            : "現在地を取得できません。屋外で再試行してください。",
        );
        setRecording(false);
        if (watch.current !== null)
          navigator.geolocation.clearWatch(watch.current);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
    );
  }
  return (
    <div className={`recording ${compact ? "compact" : ""}`}>
      {remaining.length > 0 && (
        <button className="primary" onClick={() => setPlaying(!playing)}>
          {playing ? <Pause size={16} /> : <Play size={16} />}{" "}
          {playing ? "一時停止" : "散歩を再生"}
        </button>
      )}
      <button
        className={recording ? "recording-active" : ""}
        aria-label={recording ? "位置記録を停止" : "現在地を記録"}
        onClick={gps}
      >
        <LocateFixed size={18} />
        {compact && <span>{recording ? "停止" : "現在地"}</span>}
      </button>
      {!compact && (
        <button
          aria-label="履歴を取り込む"
          disabled={busy}
          onClick={() => file.current?.click()}
        >
          <Upload size={18} />
        </button>
      )}
      <input
        ref={file}
        type="file"
        accept=".gpx,.json"
        hidden
        onChange={(e) =>
          e.target.files?.[0] && void importFile(e.target.files[0])
        }
      />
      {!compact && (
        <span className="recording-caption">
          {recording
            ? "画面表示中のGPSを記録中"
            : remaining.length
              ? "再生は架空の散歩 · 実GPSも取込み可"
              : "実GPSの記録・取込み可"}
        </span>
      )}
      {latestDevicePoint && (
        <span className="gps-reading" aria-live="polite">
          現在地 {latestDevicePoint.lat.toFixed(5)},{" "}
          {latestDevicePoint.lng.toFixed(5)}
          {latestDevicePoint.accuracy !== null
            ? ` · 精度 約${Math.round(latestDevicePoint.accuracy)}m`
            : ""}
        </span>
      )}
      {error && (
        <p className="inline-note" role="status">
          {error}
        </p>
      )}
      {needsSecureConnection && (
        <div className="gps-setup">
          <a href="/grow-map-local.cer">1. 証明書をダウンロード</a>
          <span>設定でインストール・信頼した後</span>
          <a href={`https://${window.location.hostname}:3443/`}>
            2. HTTPS版を開く
          </a>
        </div>
      )}
    </div>
  );
}
