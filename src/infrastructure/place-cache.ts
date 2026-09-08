import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { PlaceCache, SemanticPlace } from "../contracts/places";
export class SqlitePlaceCache implements PlaceCache {
  private db: DatabaseSync;
  constructor(path = process.env.GROW_MAP_DB || ".local/grow-map.sqlite") {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(
      "PRAGMA journal_mode=WAL; PRAGMA busy_timeout=3000; CREATE TABLE IF NOT EXISTS poi_cache(key TEXT PRIMARY KEY,payload TEXT,fetched_at TEXT); CREATE TABLE IF NOT EXISTS poi_consent(actor TEXT PRIMARY KEY,approved_at TEXT);",
    );
  }
  get(key: string) {
    const r = this.db
      .prepare("SELECT payload,fetched_at FROM poi_cache WHERE key=?")
      .get(key);
    return r
      ? {
          places: JSON.parse(String(r.payload)) as SemanticPlace[],
          fetchedAt: String(r.fetched_at),
        }
      : undefined;
  }
  save(key: string, places: SemanticPlace[], fetchedAt: string) {
    this.db
      .prepare(
        "INSERT INTO poi_cache VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload,fetched_at=excluded.fetched_at",
      )
      .run(key, JSON.stringify(places), fetchedAt);
    this.db
      .prepare(
        "DELETE FROM poi_cache WHERE key IN (SELECT key FROM poi_cache ORDER BY fetched_at DESC LIMIT -1 OFFSET 200)",
      )
      .run();
  }
  approved(actor: string) {
    return Boolean(
      this.db.prepare("SELECT actor FROM poi_consent WHERE actor=?").get(actor),
    );
  }
  approve(actor: string) {
    this.db
      .prepare("INSERT OR REPLACE INTO poi_consent VALUES(?,?)")
      .run(actor, new Date().toISOString());
  }
}
