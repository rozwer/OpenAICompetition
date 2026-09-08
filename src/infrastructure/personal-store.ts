import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { SemanticPlace } from "../contracts/places";
import type {
  Visit,
  VisitCandidate,
  UserPlaceRelation,
  PersonalInsightSnapshot,
} from "../contracts/personal-insights";
export class PersonalStore {
  private db: DatabaseSync;
  constructor(path = process.env.GROW_MAP_DB || ".local/grow-map.sqlite") {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(
      "PRAGMA journal_mode=WAL; PRAGMA busy_timeout=3000; CREATE TABLE IF NOT EXISTS personal_records(actor TEXT,kind TEXT,id TEXT,payload TEXT,PRIMARY KEY(actor,kind,id));",
    );
  }
  list<T>(actor: string, kind: string): T[] {
    return this.db
      .prepare(
        "SELECT payload FROM personal_records WHERE actor=? AND kind=? ORDER BY rowid",
      )
      .all(actor, kind)
      .map((r) => JSON.parse(String(r.payload)) as T);
  }
  put(actor: string, kind: string, id: string, value: unknown) {
    this.db
      .prepare(
        "INSERT INTO personal_records VALUES(?,?,?,?) ON CONFLICT(actor,kind,id) DO UPDATE SET payload=excluded.payload",
      )
      .run(actor, kind, id, JSON.stringify(value));
  }
  transaction<T>(fn: () => T) {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const r = fn();
      this.db.exec("COMMIT");
      return r;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  visits(actor: string) {
    return this.list<Visit>(actor, "visit");
  }
  candidates(actor: string) {
    return this.list<VisitCandidate>(actor, "candidate");
  }
  snapshots(actor: string) {
    return this.list<PersonalInsightSnapshot>(actor, "insight").sort((a, b) =>
      b.generatedAt.localeCompare(a.generatedAt),
    );
  }
  relations(actor: string) {
    return this.list<UserPlaceRelation>(actor, "relation");
  }
  clearRelations(actor: string) {
    this.db.prepare("DELETE FROM personal_records WHERE actor=? AND kind='relation'").run(actor);
  }
  catalog(actor: string, bundled: SemanticPlace[]) {
    const cached = this.db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='poi_cache'",
      )
      .get()
      ? this.db
          .prepare("SELECT payload FROM poi_cache ORDER BY fetched_at")
          .all()
          .flatMap((r) => JSON.parse(String(r.payload)) as SemanticPlace[])
      : [];
    return [
      ...new Map(
        [
          ...bundled,
          ...this.list<SemanticPlace>(actor, "place"),
          ...cached,
        ].map((p) => [p.id, p]),
      ).values(),
    ];
  }
}
