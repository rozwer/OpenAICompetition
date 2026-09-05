import type { TrackPoint } from "../contracts";
export function distance(
  a: { lng: number; lat: number },
  b: { lng: number; lat: number },
) {
  const r = Math.PI / 180,
    dlat = (b.lat - a.lat) * r,
    dlng = (b.lng - a.lng) * r;
  const h =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dlng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}
export function segments(points: TrackPoint[]): TrackPoint[][] {
  const sorted = [...new Map(points.map((p) => [p.id, p])).values()].sort(
    (a, b) => a.time.localeCompare(b.time) || a.id.localeCompare(b.id),
  );
  const result: TrackPoint[][] = [];
  let current: TrackPoint[] = [];
  for (const p of sorted) {
    if (p.accuracy === null || p.accuracy > 50) {
      if (current.length) result.push(current);
      current = [];
      continue;
    }
    const last = current.at(-1);
    const seconds = last
      ? (Date.parse(p.time) - Date.parse(last.time)) / 1000
      : 0;
    if (
      last &&
      (seconds > 120 || seconds <= 0 || distance(last, p) / seconds > 12)
    ) {
      result.push(current);
      current = [];
    }
    current.push(p);
  }
  if (current.length) result.push(current);
  return result;
}
export function distanceToSegment(
  p: { lng: number; lat: number },
  a: TrackPoint,
  b: TrackPoint,
) {
  const sx = 111320 * Math.cos((p.lat * Math.PI) / 180),
    sy = 111320;
  const ax = (a.lng - p.lng) * sx,
    ay = (a.lat - p.lat) * sy,
    bx = (b.lng - p.lng) * sx,
    by = (b.lat - p.lat) * sy;
  const dx = bx - ax,
    dy = by - ay,
    t = Math.max(
      0,
      Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)),
    );
  return Math.hypot(ax + t * dx, ay + t * dy);
}
export function explored(
  p: { lng: number; lat: number },
  tracks: TrackPoint[][],
  radius = 20,
) {
  return tracks.some((track) =>
    track.some((a, i) =>
      i
        ? distanceToSegment(p, track[i - 1], a) <= radius
        : distance(p, a) <= radius,
    ),
  );
}
export function trackLength(points: TrackPoint[]) {
  return segments(points).reduce(
    (sum, line) =>
      sum + line.reduce((s, p, i) => s + (i ? distance(line[i - 1], p) : 0), 0),
    0,
  );
}

/** Local metric approximation for a building footprint intersecting a 20m trail buffer. */
export function exploredFootprint(
  ring: number[][],
  tracks: TrackPoint[][],
  radius = 20,
) {
  const vertices = ring.map(([lng, lat]) => ({ lng, lat }));
  if (vertices.some((p) => explored(p, tracks, radius))) return true;
  const inside = (p: { lng: number; lat: number }) => {
    let yes = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const a = vertices[i],
        b = vertices[j];
      if (
        a.lat > p.lat !== b.lat > p.lat &&
        p.lng < ((b.lng - a.lng) * (p.lat - a.lat)) / (b.lat - a.lat) + a.lng
      )
        yes = !yes;
    }
    return yes;
  };
  const cross = (
    a: { lng: number; lat: number },
    b: { lng: number; lat: number },
    p: { lng: number; lat: number },
  ) => (b.lng - a.lng) * (p.lat - a.lat) - (b.lat - a.lat) * (p.lng - a.lng);
  for (const line of tracks)
    for (let k = 0; k < line.length; k++) {
      const p = line[k];
      if (inside(p)) return true;
      for (let i = 1; i < vertices.length; i++) {
        const a = { ...p, ...vertices[i - 1] },
          b = { ...p, ...vertices[i] };
        if (distanceToSegment(p, a, b) <= radius) return true;
        if (k) {
          const prev = line[k - 1];
          if (
            cross(a, b, prev) * cross(a, b, p) < 0 &&
            cross(prev, p, a) * cross(prev, p, b) < 0
          )
            return true;
        }
      }
    }
  return false;
}
