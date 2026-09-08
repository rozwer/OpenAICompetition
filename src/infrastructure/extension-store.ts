import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
export class ExtensionStore {
  private db: DatabaseSync;
  constructor(path = process.env.GROW_MAP_DB || ".local/grow-map.sqlite") {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(
      "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS extensions_store(actor TEXT,kind TEXT,id TEXT,payload TEXT,PRIMARY KEY(actor,kind,id));",
    );
  }
  list<T>(actor: string, kind: string): T[] {
    return this.db
      .prepare(
        "SELECT payload FROM extensions_store WHERE actor=? AND kind=? ORDER BY rowid DESC",
      )
      .all(actor, kind)
      .map((r) => JSON.parse(String(r.payload)));
  }
  get<T>(actor: string, kind: string, id: string): T | undefined {
    const r = this.db
      .prepare(
        "SELECT payload FROM extensions_store WHERE actor=? AND kind=? AND id=?",
      )
      .get(actor, kind, id);
    return r ? JSON.parse(String(r.payload)) : undefined;
  }
  put(actor: string, kind: string, id: string, value: unknown) {
    this.db
      .prepare(
        "INSERT INTO extensions_store VALUES(?,?,?,?) ON CONFLICT(actor,kind,id) DO UPDATE SET payload=excluded.payload",
      )
      .run(actor, kind, id, JSON.stringify(value));
  }
  transaction<T>(work: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const r = work();
      this.db.exec("COMMIT");
      return r;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
}
