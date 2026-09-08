import { createHash } from "node:crypto";
import { HistoryStore } from "../infrastructure/history-store";
import {
  aggregateHistory,
  getMonthlyHistorySummary,
  periodBounds,
  previousMonth,
} from "../domain/history";
import {
  monthlyInsightSchema,
  type HistoryData,
  type HistoryMode,
  type MonthlyHistoryAI,
} from "../contracts/history";
import type { SemanticPlace } from "../contracts/places";
export class HistoryService {
  private cache = new Map<string, HistoryData>();
  private pending = new Map<string, Promise<HistoryData>>();
  private nextAttempt = new Map<string, number>();
  constructor(
    private store: HistoryStore,
    private ai: MonthlyHistoryAI,
    private places: SemanticPlace[],
  ) {}
  get(actor: string, mode: HistoryMode, period: string) {
    const key = `${actor}:${this.store.revision(actor)}:${mode}:${period}`;
    const existing = this.cache.get(key);
    if (existing) return structuredClone(existing);
    const bounds = periodBounds(period.slice(0, 7)),
      source = this.store.source(
        actor,
        mode === "replay"
          ? 0
          : periodBounds(previousMonth(period.slice(0, 7))).start,
        bounds.end,
        this.places,
      ),
      result = aggregateHistory(source, mode, period);
    const input = {
      current: result.summary,
      previousMonth: getMonthlyHistorySummary(
        source,
        previousMonth(period.slice(0, 7)),
      ),
    };
    Object.assign(
      result.summary,
      this.store.insight(actor, result.summary.month, this.fingerprint(input)),
    );
    this.cache.set(key, structuredClone(result));
    if (this.cache.size > 64)
      this.cache.delete(this.cache.keys().next().value!);
    return result;
  }
  private fingerprint(input: unknown) {
    return createHash("sha256")
      .update("history-v1" + JSON.stringify(input))
      .digest("hex");
  }
  async generateMonthlyInsight(
    actor: string,
    month: string,
  ): Promise<HistoryData> {
    const key = `${actor}:${month}`,
      pending = this.pending.get(key);
    if (pending) return pending;
    const result = this.get(actor, "month", month);
    if (!result.summary.totalVisits || result.summary.aiInsight) return result;
    if (
      this.pending.size >= 2 ||
      Date.now() < (this.nextAttempt.get(actor) || 0)
    )
      return { ...result, warning: "少し待ってからAIを更新してください。" };
    this.nextAttempt.set(actor, Date.now() + 30000);
    const revision = this.store.revision(actor),
      source = this.store.source(
        actor,
        periodBounds(previousMonth(month)).start,
        periodBounds(month).end,
        this.places,
      ),
      input = {
        current: getMonthlyHistorySummary(source, month),
        previousMonth: getMonthlyHistorySummary(source, previousMonth(month)),
      };
    const work = (async () => {
      try {
        const insight = monthlyInsightSchema.parse(
          await this.ai.generateMonthlyInsight(input),
        );
        if (this.store.revision(actor) !== revision)
          return {
            ...result,
            warning: "解析中に記録が更新されました。再試行してください。",
          };
        this.store.saveInsight(actor, month, this.fingerprint(input), insight);
        this.cache.clear();
        return this.get(actor, "month", month);
      } catch {
        return {
          ...result,
          warning:
            "AIのひとことを更新できませんでした。記録の集計は引き続き確認できます。",
        };
      }
    })();
    this.pending.set(key, work);
    try {
      return await work;
    } finally {
      this.pending.delete(key);
    }
  }
}
