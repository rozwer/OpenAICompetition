import type {
  HistorySource,
  HistoryData,
  HistoryMode,
  HistoryRoute,
  MonthlyHistorySummary,
  DayJourney,
  HistoryPin,
} from "../contracts/history";
import type { Visit } from "../contracts/personal-insights";
import { segments, distance } from "./tracks";
export const japanDay = (time: string | number) =>
  new Date((typeof time === "number" ? time : Date.parse(time)) + 9 * 3600000)
    .toISOString()
    .slice(0, 10);
export function periodBounds(period: string) {
  const start = Date.parse(
    `${period.length === 7 ? period + "-01" : period}T00:00:00+09:00`,
  );
  const d = new Date(start + 9 * 3600000);
  if (period.length === 7) d.setUTCMonth(d.getUTCMonth() + 1);
  else d.setUTCDate(d.getUTCDate() + 1);
  return { start, end: d.getTime() - 9 * 3600000 };
}
export function previousMonth(month: string) {
  const d = new Date(month + "-01T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().slice(0, 7);
}
const overlaps = (v: Visit, start: number, end: number) =>
  Date.parse(v.enteredAt) < end &&
  Math.max(Date.parse(v.exitedAt), Date.parse(v.enteredAt) + 1) > start;
export function clippedMinutes(v: Visit, start: number, end: number) {
  if (v.durationMinutes === null) return null;
  return Math.max(
    0,
    Math.min(
      v.durationMinutes,
      (Math.min(Date.parse(v.exitedAt), end) -
        Math.max(Date.parse(v.enteredAt), start)) /
        60000,
    ),
  );
}
export function historyRoute(
  source: HistorySource,
  start: number,
  end: number,
): HistoryRoute {
  const points = source.points.filter(
      (p) =>
        p.origin !== "synthetic" &&
        Date.parse(p.time) >= start &&
        Date.parse(p.time) < end,
    ),
    lines = segments(points).filter((l) => l.length >= 2);
  let meters = 0;
  for (const l of lines)
    for (let i = 1; i < l.length; i++) meters += distance(l[i - 1], l[i]);
  const count = lines.reduce((s, l) => s + l.length, 0),
    limit = 2000;
  let remaining = limit;
  const simplified = lines.slice(0, 500).flatMap((l) => {
    if (remaining < 2) return [];
    const budget = Math.min(
        remaining,
        Math.max(2, Math.floor((limit * l.length) / Math.max(count, 1))),
      ),
      step = Math.max(1, Math.ceil((l.length - 1) / (budget - 1))),
      selected = l.filter((_, i) => i % step === 0);
    if (selected.at(-1) !== l.at(-1)) selected.push(l.at(-1)!);
    remaining -= selected.length;
    return [selected.map((p) => [p.lng, p.lat])];
  });
  return {
    lines: simplified,
    kind: lines.length ? "gps" : "none",
    distanceMeters: lines.length ? Math.round(meters) : null,
    simplified: count > limit || source.truncated,
  };
}
export function getMonthlyHistorySummary(
  source: HistorySource,
  month: string,
): MonthlyHistorySummary {
  const { start, end } = periodBounds(month),
    visits = source.visits.filter((v) => overlaps(v, start, end)),
    placeMap = new Map(source.places.map((p) => [p.id, p])),
    counts = new Map<string, number>(),
    categories = new Map<string, number>(),
    days = new Set<string>();
  let totalStayMinutes = 0;
  for (const v of visits) {
    counts.set(v.placeId, (counts.get(v.placeId) || 0) + 1);
    const category = placeMap.get(v.placeId)?.category || "種類不明";
    categories.set(category, (categories.get(category) || 0) + 1);
    totalStayMinutes += clippedMinutes(v, start, end) ?? 0;
    for (
      let t = periodBounds(
        japanDay(Math.max(start, Date.parse(v.enteredAt))),
      ).start;
      t <
      Math.min(
        end,
        Math.max(Date.parse(v.exitedAt), Date.parse(v.enteredAt) + 1),
      );
      t += 86400000
    )
      days.add(japanDay(t));
  }
  const newly = [...counts.keys()].filter((id) => {
    const time = Date.parse(source.firstVisits[id]);
    return time >= start && time < end;
  });
  return {
    month,
    visitDays: days.size,
    totalVisits: visits.length,
    uniquePlaces: counts.size,
    newPlaces: newly.length,
    totalStayMinutes: Math.round(totalStayMinutes),
    unknownDurationVisits: visits.filter((v) => v.durationMinutes === null)
      .length,
    distanceMeters: historyRoute(source, start, end).distanceMeters,
    topCategories: [...categories]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count),
    topPlaces: [...counts]
      .map(([placeId, count]) => ({
        placeId,
        name: placeMap.get(placeId)?.name || "名称不明",
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    newDiscoveries: newly
      .slice(0, 5)
      .map((placeId) => ({
        placeId,
        name: placeMap.get(placeId)?.name || "名称不明",
      })),
  };
}
function pins(
  source: HistorySource,
  visits: Visit[],
  month: string,
  day = false,
): HistoryPin[] {
  const { start, end } = periodBounds(month),
    map = new Map(source.places.map((p) => [p.id, p])),
    counts = new Map<string, number>();
  for (const v of visits)
    counts.set(v.placeId, (counts.get(v.placeId) || 0) + 1);
  const seen = new Set<string>();
  return visits
    .flatMap((v, i) => {
      const p = map.get(v.placeId);
      if (!p || (!day && seen.has(v.placeId))) return [];
      seen.add(v.placeId);
      const first = source.firstVisits[v.placeId] || v.enteredAt;
      return [
        {
          id: day ? v.id : p.id,
          placeId: p.id,
          name: p.name,
          category: p.category,
          brand: p.brand,
          lng: p.lng,
          lat: p.lat,
          order: day ? i + 1 : undefined,
          isNew: Date.parse(first) >= start && Date.parse(first) < end,
          count: counts.get(p.id) || 0,
          firstVisitedAt: first,
        },
      ];
    })
    .slice(0, 2000);
}
export function getDayJourney(source: HistorySource, date: string): DayJourney {
  const { start, end } = periodBounds(date),
    visits = source.visits
      .filter((v) => overlaps(v, start, end))
      .sort((a, b) => a.enteredAt.localeCompare(b.enteredAt)),
    map = new Map(source.places.map((p) => [p.id, p])),
    markers = pins(source, visits, date.slice(0, 7), true).slice(0,500),
    route = historyRoute(source, start, end);
  if (route.kind === "none" && markers.length > 1) {
    route.kind = "visit_order";
    route.lines = [markers.map((p) => [p.lng, p.lat])];
  }
  return {
    date,
    visits: visits.slice(0,500).map((v, i) => ({
      ...v,
      order: i + 1,
      placeName: map.get(v.placeId)?.name || "名称不明",
      category: map.get(v.placeId)?.category || "種類不明",
      brand: map.get(v.placeId)?.brand,
      periodMinutes: clippedMinutes(v, start, end),
    })),
    pins: markers.slice(0,500),
    route,
  };
}
export function aggregateHistory(
  source: HistorySource,
  mode: HistoryMode,
  period: string,
): HistoryData {
  const month = period.slice(0, 7),
    { end } = periodBounds(month),
    visits = source.visits
      .filter((v) => Date.parse(v.enteredAt) < end)
      .sort((a, b) => a.enteredAt.localeCompare(b.enteredAt));
  const markers = pins(
    source,
    mode === "replay"
      ? visits
      : visits.filter((v) => overlaps(v, periodBounds(month).start, end)),
    month,
  );
  return {
    mode,
    period,
    empty: !source.months.length,
    months: source.months,
    days: source.days,
    summary: getMonthlyHistorySummary(source, month),
    day: mode === "day" ? getDayJourney(source, period) : undefined,
    replay: {
      date: month,
      pins: markers,
      newPlaceIds: markers.filter((p) => p.isNew).map((p) => p.placeId),
      route: historyRoute(
        source,
        mode === "replay" ? 0 : periodBounds(month).start,
        end,
      ),
    },
    truncated: source.truncated || new Set(visits.map(v=>v.placeId)).size > 2000 || (mode === "day" && visits.filter(v=>overlaps(v,periodBounds(period).start,periodBounds(period).end)).length>500),
    warning: source.truncated
      ? "記録が多いため一部を表示しています。日表示で詳しく確認できます。"
      : undefined,
  };
}
