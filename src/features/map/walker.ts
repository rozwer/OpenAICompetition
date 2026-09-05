import type { TrackPoint } from "../../contracts";
import type { Feature, Polygon } from "geojson";

// The fallback is a display position, never a recorded GPS observation.
export function walkerPosition(points: TrackPoint[]) {
  const point = points.reduce<TrackPoint | undefined>((last, p) =>
    !last || p.time >= last.time ? p : last, undefined);
  return {
    lng: point?.lng ?? 139.6478,
    lat: point?.lat ?? 35.4391,
    label: !point ? "デモのスタート地点" : point.origin === "device"
      ? "最後に取得したGPS位置" : point.origin === "synthetic" ? "散歩の再生位置" : "読み込んだ記録の位置",
  };
}

export function walkerCircle(lng: number, lat: number): Feature<Polygon> {
  const coordinates = Array.from({ length: 65 }, (_, i) => {
    const angle = i / 64 * Math.PI * 2;
    return [lng + 20 * Math.cos(angle) / (111320 * Math.cos(lat * Math.PI / 180)),
      lat + 20 * Math.sin(angle) / 111320];
  });
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [coordinates] } };
}

export function createWalker() {
  const el = document.createElement("div");
  el.className = "walker-marker";
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", "自分のアバター");
  el.innerHTML = `<div class="walker-person"><svg width="52" height="86" viewBox="0 0 52 86" aria-hidden="true">
    <ellipse cx="26" cy="80" rx="17" ry="5" fill="#174f5340"/>
    <g class="walker-leg left"><path d="M21 48L18 72" stroke="#244655" stroke-width="8" stroke-linecap="round"/><path d="M18 72L15 78" stroke="#f9ffef" stroke-width="8" stroke-linecap="round"/></g>
    <g class="walker-leg right"><path d="M30 48L34 72" stroke="#244655" stroke-width="8" stroke-linecap="round"/><path d="M34 72L37 78" stroke="#f9ffef" stroke-width="8" stroke-linecap="round"/></g>
    <path d="M16 30L10 48M36 30L42 48" stroke="#e6ad80" stroke-width="7" stroke-linecap="round"/>
    <path d="M17 25Q26 21 35 25L37 51Q26 56 15 51Z" fill="#fbf6dc"/>
    <rect x="18" y="29" width="17" height="22" rx="6" fill="#df754f" stroke="#964d38" stroke-width="2"/>
    <circle cx="26" cy="15" r="10" fill="#e6ad80"/><path d="M16 16Q10 1 26 2Q41 1 36 19L31 10L18 14Z" fill="#263f3c"/>
  </svg></div>`;
  return el;
}

