import { createHash, randomUUID } from "node:crypto";
import type { MapRepository } from "../contracts";
import type { SemanticPlace } from "../contracts/places";
import type {
  PersonalInsightAI,
  PersonalState,
  Visit,
} from "../contracts/personal-insights";
import { visitInputSchema } from "../contracts/personal-insights";
import {
  aggregateUserActivity,
  detectVisitCandidates,
  userRelations,
  validatePersonalInsight,
  visitContext,
} from "../domain/personal-activity";
import { PersonalStore } from "../infrastructure/personal-store";
export class PersonalInsightService {
  private pending = new Map<string, Promise<PersonalState>>();
  private nextAttempt = new Map<string, number>();
  constructor(
    private store: PersonalStore,
    private repo: MapRepository,
    private ai: PersonalInsightAI,
    private bundled: SemanticPlace[],
  ) {}
  state(actor: string, sync = true): PersonalState {
    const places = this.store.catalog(actor, this.bundled),
      visits = this.store.visits(actor);
    if (sync) {
      const detected = detectVisitCandidates(
          this.repo.read(actor).points,
          places,
        ),
        dismissed = new Set(
          this.store.list<{ id: string }>(actor, "dismissed").map((x) => x.id),
        );
      this.store.transaction(() => {
        for (const c of detected)
          if (
            !dismissed.has(c.id) &&
            !visits.some((v) => v.candidateId === c.id)
          )
            this.store.put(actor, "candidate", c.id, c);
      });
    }
    const favorite = new Set(
        this.store
          .list<{ placeId: string; favorite: boolean }>(actor, "favorite")
          .filter((x) => x.favorite)
          .map((x) => x.placeId),
      ),
      relations = userRelations(actor, visits, favorite);
    this.store.transaction(() => {
      this.store.clearRelations(actor);
      for (const r of relations)
        this.store.put(actor, "relation", r.placeId, r);
    });
    const dismissed = new Set(
        this.store.list<{ id: string }>(actor, "dismissed").map((x) => x.id),
      ),
      candidates = this.store
        .candidates(actor)
        .filter(
          (c) =>
            !dismissed.has(c.id) &&
            !visits.some((v) => v.candidateId === c.id) &&
            Date.parse(c.enteredAt) >= Date.now() - 30 * 86400000,
        ),
      ids = new Set([
        ...relations.map((r) => r.placeId),
        ...candidates.map((c) => c.placeId),
      ]);
    return {
      userId: actor,
      places: places.filter((p) => ids.has(p.id)),
      visits,
      relations,
      candidates,
      snapshots: this.store.snapshots(actor),
      activity: aggregateUserActivity(visits, places, relations),
    };
  }
  record(actor: string, raw: unknown) {
    const input = visitInputSchema.parse(raw),
      start = Date.parse(input.enteredAt),
      end = start + (input.durationMinutes ?? 0) * 60000;
    if (end > Date.now() + 60000 || start < Date.now() - 5 * 366 * 86400000)
      throw Error("訪問時刻を確認してください");
    const place = this.store
      .catalog(actor, this.bundled)
      .find((p) => p.id === input.placeId);
    if (!place) throw Error("場所が見つかりません");
    const visit: Visit = {
      id: input.id,
      userId: actor,
      placeId: place.id,
      enteredAt: input.enteredAt,
      exitedAt: new Date(end).toISOString(),
      durationMinutes: input.durationMinutes,
      context: {
        ...visitContext(input.enteredAt),
        company: input.company,
        weather: input.weather,
      },
      source: "manual",
    };
    this.store.transaction(() => {
      const existing = this.store.visits(actor);
      const same = existing.find((v) => v.id === visit.id);
      if (same) {
        if (JSON.stringify(same) !== JSON.stringify(visit))
          throw Error("記録IDが重複しています");
        return;
      }
      if (
        existing.some(
          (v) => v.placeId === visit.placeId && v.enteredAt === visit.enteredAt,
        )
      )
        throw Error("この訪問は既に記録されています");
      this.store.put(actor, "place", place.id, place);
      this.store.put(actor, "visit", visit.id, visit);
    });
    return this.state(actor, false);
  }
  favorite(actor: string, placeId: string, favorite: boolean) {
    const p = this.store
      .catalog(actor, this.bundled)
      .find((p) => p.id === placeId);
    if (!p) throw Error("場所が見つかりません");
    this.store.transaction(() => {
      this.store.put(actor, "place", p.id, p);
      this.store.put(actor, "favorite", p.id, { placeId, favorite });
    });
    return this.state(actor, false);
  }
  confirm(actor: string, id: string, accept: boolean) {
    this.state(actor);
    const candidate = this.store.candidates(actor).find((c) => c.id === id);
    if (!candidate) throw Error("訪問候補が見つかりません");
    if (accept) {
      const p = this.store
        .catalog(actor, this.bundled)
        .find((p) => p.id === candidate.placeId);
      if (!p) throw Error("場所が見つかりません");
      this.store.transaction(() => {
        if (this.store.visits(actor).some((v) => v.candidateId === id)) return;
        const v: Visit = {
          id: `confirmed:${id}`,
          candidateId: id,
          userId: actor,
          placeId: p.id,
          enteredAt: candidate.enteredAt,
          exitedAt: candidate.exitedAt,
          durationMinutes: candidate.durationMinutes,
          context: visitContext(candidate.enteredAt),
          source: "gps_confirmed",
        };
        this.store.put(actor, "place", p.id, p);
        this.store.put(actor, "visit", v.id, v);
      });
    } else this.store.put(actor, "dismissed", id, { id });
    return this.state(actor, false);
  }
  async generate(actor: string): Promise<PersonalState> {
    const pending = this.pending.get(actor);
    if (pending) return pending;
    const before = this.state(actor),
      input = before.activity;
    if (!input.current.visits) return before;
    const fingerprint = createHash("sha256")
      .update("personal-v1" + JSON.stringify(input))
      .digest("hex");
    if (before.snapshots.some((s) => s.fingerprint === fingerprint))
      return before;
    if (
      this.pending.size >= 2 ||
      Date.now() < (this.nextAttempt.get(actor) || 0)
    )
      throw Error("少し待ってから再試行してください");
    this.nextAttempt.set(actor, Date.now() + 30000);
    const work = (async () => {
      const result = validatePersonalInsight(
        await this.ai.generatePersonalInsight(input),
        input,
      );
      if (
        JSON.stringify(this.state(actor, false).activity) !==
        JSON.stringify(input)
      )
        throw Error("解析中に記録が変わりました。もう一度更新してください");
      const id = randomUUID();
      this.store.put(actor, "insight", id, {
        id,
        userId: actor,
        generatedAt: new Date().toISOString(),
        periodStart: input.current.start,
        periodEnd: input.current.end,
        fingerprint,
        result,
      });
      return this.state(actor, false);
    })();
    this.pending.set(actor, work);
    try {
      return await work;
    } finally {
      this.pending.delete(actor);
    }
  }
}
