import type {
  DayJourney,
  MonthlyHistorySummary,
} from "../../contracts/history";
import { Coffee, BookOpen, GraduationCap, ShoppingBag, Trees, MapPin, ChevronRight } from "lucide-react";
function categoryStyle(category: string) {
  if (/カフェ|喫茶|cafe/i.test(category)) return { Icon: Coffee, tone: "cafe" };
  if (/書|図書|book/i.test(category)) return { Icon: BookOpen, tone: "book" };
  if (/大学|学校|教育|university/i.test(category)) return { Icon: GraduationCap, tone: "school" };
  if (/ショッピング|買|店|shop/i.test(category)) return { Icon: ShoppingBag, tone: "shop" };
  if (/公園|自然|park/i.test(category)) return { Icon: Trees, tone: "park" };
  return { Icon: MapPin, tone: "place" };
}
function duration(value: number) {
  const minutes = Math.round(value);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}時間${minutes % 60 ? `${minutes % 60}分` : ""}` : `${minutes}分`;
}
const time = (value: string) =>
  new Date(value).toLocaleTimeString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
  });
export function DayJourneyTimeline({
  day,
  selected,
  onSelect,
}: {
  day: DayJourney;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="journey-timeline">
      {!day.visits.length && <p>この日の訪問記録はありません。</p>}
      {day.visits.map((v) => {
        const { Icon, tone } = categoryStyle(v.category);
        return (
        <button
          id={`visit-${v.id}`}
          className={`journey-stop ${selected === v.id ? "selected" : ""}`}
          key={v.id}
          onClick={() => onSelect(v.id)}
          aria-expanded={selected === v.id}
          data-tone={tone}
        >
          <span className="journey-time"><time>{time(v.enteredAt)}</time><Icon size={23} strokeWidth={1.6} /></span>
          <span className="stop-number">{v.order}</span>
          <span className="journey-stop-body">
            <strong>{v.placeName}</strong>
            <span className="journey-stop-summary"><span className="journey-category-art"><Icon size={29} strokeWidth={1.5} /></span><span><span className="journey-category-badge">{v.category}</span>
              <small>{v.periodMinutes === null ? "滞在時間は未記録" : `滞在 ${duration(v.periodMinutes)}`}</small>
            </span></span>
            {selected === v.id && <small className="journey-visit-details">
              到着 {time(v.enteredAt)} → 出発 {v.durationMinutes === null ? "未記録" : time(v.exitedAt)}
              {v.brand ? ` · ${v.brand}` : ""}
            </small>}
          </span>
          <ChevronRight className="journey-stop-chevron" size={19} />
        </button>
      ); })}
    </div>
  );
}
export function MonthlyRecap({
  summary,
  onDiscoveries,
  onAI,
  busy,
}: {
  summary: MonthlyHistorySummary;
  onDiscoveries: () => void;
  onAI: () => void;
  busy: boolean;
}) {
  return (
    <>
      <div className="history-stats">
        <span>
          <b>{summary.uniquePlaces}</b>訪れた場所
        </span>
        <button onClick={onDiscoveries}>
          <b>{summary.newPlaces}</b>新しく見つけた場所
        </button>
        <span>
          <b>{summary.visitDays}</b>訪問した日数
        </span>
      </div>
      <div className="history-secondary">
        <span>
          記録された移動距離
          <strong>
            {summary.distanceMeters === null
              ? "記録なし"
              : `${(summary.distanceMeters / 1000).toFixed(1)} km`}
          </strong>
        </span>
        <span>
          記録された滞在<strong>{summary.totalStayMinutes} 分</strong>
        </span>
      </div>
      {summary.unknownDurationVisits > 0 && (
        <small>
          滞在時間が未記録の訪問が{summary.unknownDurationVisits}件あります。
        </small>
      )}
      {!summary.totalVisits && <p>今月はまだ十分な記録がありません。</p>}
      <h3>よく訪れたカテゴリ</h3>
      <div className="history-categories">
        {summary.topCategories.slice(0, 8).map((c) => (
          <div key={c.category}>
            <span>{c.category}</span>
            <i
              style={{
                width: `${(c.count / Math.max(summary.topCategories[0]?.count || 1, 1)) * 100}%`,
              }}
            />
            <b>{c.count}</b>
          </div>
        ))}
      </div>
      <h3>よく訪れた場所</h3>
      {summary.topPlaces.map((p, i) => (
        <div className="history-ranking" key={p.placeId}>
          <span>{i + 1}</span>
          <strong>{p.name}</strong>
          <small>{p.count}回</small>
        </div>
      ))}
      <h3>新しく見つけた場所</h3>
      <div className="history-discoveries">
        {summary.newDiscoveries.map((p) => (
          <button key={p.placeId} onClick={onDiscoveries}>
            {p.name}
            <small>地図で見る →</small>
          </button>
        ))}
      </div>
      <div className="monthly-ai">
        <span className="eyebrow">MONTHLY INSIGHT</span>
        <h3>AIが見つけた今月の変化</h3>
        {summary.aiInsight ? (
          <>
            <strong>{summary.aiInsight.title}</strong>
            <p>{summary.aiInsight.summary}</p>
            <small>
              AIの解釈 · 確信度 {Math.round(summary.aiInsight.confidence * 100)}
              % · {summary.insightGeneratedAt?.slice(0, 10)}
            </small>
          </>
        ) : (
          <p>この月と前月の集計から、短いひとことを生成できます。</p>
        )}
        <button disabled={busy || !summary.totalVisits} onClick={onAI}>
          {busy ? "読み解いています…" : "AIのひとことを更新"}
        </button>
        <small>集計をCodexに送信します。生GPSは送りません。</small>
      </div>
    </>
  );
}
