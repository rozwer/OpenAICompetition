import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { HistorySource, MonthlyInsight } from "../contracts/history";
import type { Visit } from "../contracts/personal-insights";
import type { SemanticPlace } from "../contracts/places";
import type { TrackPoint } from "../contracts";
export class HistoryStore {
  private db: DatabaseSync;
  constructor(path = process.env.GROW_MAP_DB || ".local/grow-map.sqlite") {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=3000;
   CREATE TABLE IF NOT EXISTS records(actor TEXT,kind TEXT,id TEXT,payload TEXT,PRIMARY KEY(actor,kind,id));
   CREATE TABLE IF NOT EXISTS personal_records(actor TEXT,kind TEXT,id TEXT,payload TEXT,PRIMARY KEY(actor,kind,id));
   CREATE TABLE IF NOT EXISTS history_revisions(actor TEXT PRIMARY KEY,revision INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS history_insights(actor TEXT,month TEXT,fingerprint TEXT,payload TEXT,generated_at TEXT,PRIMARY KEY(actor,month));
   CREATE INDEX IF NOT EXISTS history_visits_time ON personal_records(actor,kind,json_extract(payload,'$.enteredAt'));
   CREATE INDEX IF NOT EXISTS history_points_time ON records(actor,kind,json_extract(payload,'$.time'));`);
    for (const table of ["records", "personal_records"])
      for (const op of ["INSERT", "UPDATE", "DELETE"]) {
        const ref = op === "DELETE" ? "OLD" : "NEW";
        this.db.exec(
          `CREATE TRIGGER IF NOT EXISTS history_${table}_${op} AFTER ${op} ON ${table} WHEN ${ref}.kind IN ('point','visit','place') BEGIN INSERT INTO history_revisions VALUES(${ref}.actor,1) ON CONFLICT(actor) DO UPDATE SET revision=revision+1; END;`,
        );
      }
  }
  revision(actor: string) {
    return Number(
      this.db
        .prepare("SELECT revision FROM history_revisions WHERE actor=?")
        .get(actor)?.revision || 0,
    );
  }
  source(
    actor: string,
    start: number,
    end: number,
    bundled: SemanticPlace[],
  ): HistorySource {
    const parse = <T>(rows: Record<string, unknown>[]) =>
      rows.map((r) => JSON.parse(String(r.payload)) as T);
    const visits = parse<Visit>(
      this.db
        .prepare(
          "SELECT payload FROM personal_records WHERE actor=? AND kind='visit' AND json_extract(payload,'$.enteredAt') < ? AND json_extract(payload,'$.exitedAt') >= ? ORDER BY json_extract(payload,'$.enteredAt') LIMIT 50001",
        )
        .all(actor, new Date(end).toISOString(), new Date(start).toISOString()),
    );
    const points = parse<TrackPoint>(
      this.db
        .prepare(
          "SELECT payload FROM records WHERE actor=? AND kind='point' AND json_extract(payload,'$.origin') IN ('device','imported') AND json_extract(payload,'$.time') >= ? AND json_extract(payload,'$.time') < ? ORDER BY json_extract(payload,'$.time') LIMIT 100001",
        )
        .all(actor, new Date(start).toISOString(), new Date(end).toISOString()),
    );
    const firstVisits = Object.fromEntries(
      this.db
        .prepare(
          "SELECT json_extract(payload,'$.placeId') AS placeId,MIN(json_extract(payload,'$.enteredAt')) AS first FROM personal_records WHERE actor=? AND kind='visit' GROUP BY placeId",
        )
        .all(actor)
        .map((r) => [String(r.placeId), String(r.first)]),
    );
    const days = this.db
      .prepare(
        `SELECT DISTINCT day FROM (SELECT date(json_extract(payload,'$.enteredAt'),'+9 hours') AS day FROM personal_records WHERE actor=? AND kind='visit' UNION SELECT date(json_extract(payload,'$.exitedAt'),'-1 second','+9 hours') FROM personal_records WHERE actor=? AND kind='visit' AND json_extract(payload,'$.exitedAt') > json_extract(payload,'$.enteredAt') UNION SELECT date(json_extract(payload,'$.time'),'+9 hours') FROM records WHERE actor=? AND kind='point' AND json_extract(payload,'$.origin') IN ('device','imported')) WHERE day IS NOT NULL ORDER BY day DESC`,
      )
      .all(actor, actor, actor)
      .map((r) => String(r.day));
    const saved = parse<SemanticPlace>(
        this.db
          .prepare(
            "SELECT payload FROM personal_records WHERE actor=? AND kind='place'",
          )
          .all(actor),
      ),
      ids = new Set(visits.map((v) => v.placeId));
    return {
      visits: visits.slice(0, 50000),
      points: points.slice(0, 100000),
      places: [
        ...new Map([...bundled, ...saved].map((p) => [p.id, p])).values(),
      ].filter((p) => ids.has(p.id)),
      firstVisits,
      months: [...new Set(days.map((d) => d.slice(0, 7)))].sort(),
      days,
      truncated: visits.length > 50000 || points.length > 100000,
    };
  }
  insight(actor: string, month: string, fingerprint: string) {
    const r = this.db
      .prepare(
        "SELECT payload,generated_at FROM history_insights WHERE actor=? AND month=? AND fingerprint=?",
      )
      .get(actor, month, fingerprint);
    return r
      ? {
          aiInsight: JSON.parse(String(r.payload)) as MonthlyInsight,
          insightGeneratedAt: String(r.generated_at),
        }
      : {};
  }
  saveInsight(
    actor: string,
    month: string,
    fingerprint: string,
    result: MonthlyInsight,
  ) {
    this.db
      .prepare(
        "INSERT INTO history_insights VALUES(?,?,?,?,?) ON CONFLICT(actor,month) DO UPDATE SET fingerprint=excluded.fingerprint,payload=excluded.payload,generated_at=excluded.generated_at",
      )
      .run(
        actor,
        month,
        fingerprint,
        JSON.stringify(result),
        new Date().toISOString(),
      );
  }
}
