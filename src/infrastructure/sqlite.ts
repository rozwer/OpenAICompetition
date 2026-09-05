import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { DiagnosisReport } from "../contracts/diagnosis";
import type { RouteProposal } from "../contracts/routes";
import type {
  MapRepository,
  Snapshot,
  Message,
  Memory,
  TrackPoint,
  FriendRequest,
} from "../contracts";
export class SqliteRepository implements MapRepository {
  private db: DatabaseSync;
  constructor(
    path = process.env.GROW_MAP_DB ||
      join(process.cwd(), ".local", "grow-map.sqlite"),
  ) {
    if (path !== ":memory:") mkdirSync(join(path, ".."), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL;
   CREATE TABLE IF NOT EXISTS records(actor TEXT NOT NULL,kind TEXT NOT NULL,id TEXT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(actor,kind,id));
   CREATE TABLE IF NOT EXISTS friend_requests(id TEXT PRIMARY KEY, sender TEXT NOT NULL,recipient TEXT NOT NULL,status TEXT NOT NULL,UNIQUE(sender,recipient));`);
  }
  private list<T>(actor: string, kind: string): T[] {
    return this.db
      .prepare(
        "SELECT payload FROM records WHERE actor=? AND kind=? ORDER BY rowid",
      )
      .all(actor, kind)
      .map((r) => JSON.parse(String(r.payload)));
  }
  private put<T extends { id: string }>(actor: string, kind: string, item: T) {
    this.db
      .prepare(
        "INSERT INTO records VALUES(?,?,?,?) ON CONFLICT(actor,kind,id) DO UPDATE SET payload=excluded.payload",
      )
      .run(actor, kind, item.id, JSON.stringify(item));
  }
  read(actor: string): Snapshot {
    this.db
      .prepare(
        `UPDATE records SET payload=json_set(payload,'$.status','waiting','$.error','処理が中断されました。再試行できます。') WHERE actor=? AND kind='message' AND json_extract(payload,'$.status')='running' AND COALESCE(json_extract(payload,'$.leaseUntil'),0) < ?`,
      )
      .run(actor, Date.now());
    const requests = this.db
      .prepare(
        'SELECT id,sender AS "from",recipient AS "to",status FROM friend_requests WHERE sender=? OR recipient=?',
      )
      .all(actor, actor) as unknown as FriendRequest[];
    return {
      actor,
      route: this.readRoute(actor),
      points: this.list(actor, "point"),
      messages: this.list(actor, "message"),
      memories: this.list(actor, "memory"),
      requests,
      friends: requests
        .filter((r) => r.status === "accepted")
        .map((r) => (r.from === actor ? r.to : r.from)),
    };
  }
  addPoints(actor: string, points: TrackPoint[]) {
    this.db.exec("BEGIN");
    try {
      for (const p of points)
        this.db
          .prepare("INSERT OR IGNORE INTO records VALUES(?,?,?,?)")
          .run(actor, "point", p.id, JSON.stringify(p));
      this.db.exec("COMMIT");
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  readDiagnosis(actor: string) {
    return this.list<{ fingerprint: string; report: DiagnosisReport }>(actor, "diagnosis")[0];
  }
  readRoute(actor: string) { return this.list<RouteProposal>(actor, "route")[0]; }
  saveRoute(actor: string, proposal: RouteProposal) { this.put(actor, "route", proposal); }
  saveDiagnosis(actor: string, fingerprint: string, report: DiagnosisReport) {
    this.put(actor, "diagnosis", { id: "current", fingerprint, report });
  }
  saveMessage(actor: string, m: Message) {
    this.db
      .prepare("INSERT OR IGNORE INTO records VALUES(?,?,?,?)")
      .run(actor, "message", m.id, JSON.stringify(m));
  }
  updateMessage(
    actor: string,
    id: string,
    status: Message["status"],
    error?: string,
  ) {
    const m = this.list<Message>(actor, "message").find((x) => x.id === id);
    if (m) this.put(actor, "message", { ...m, status, error });
  }
  claimMessage(actor: string, id: string) {
    return !!this.db
      .prepare(
        `UPDATE records SET payload=json_set(payload,'$.status','running','$.leaseUntil',?) WHERE actor=? AND kind='message' AND id=? AND json_extract(payload,'$.role')='user' AND json_extract(payload,'$.status') IN ('saved','waiting')`,
      )
      .run(Date.now() + 120000, actor, id).changes;
  }
  completeMessage(
    actor: string,
    id: string,
    answer: Message,
    memories: Memory[],
  ) {
    this.db.exec("BEGIN");
    try {
      this.saveMessage(actor, answer);
      for (const m of memories) this.put(actor, "memory", m);
      this.updateMessage(actor, id, "completed");
      this.db.exec("COMMIT");
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  reviseMemory(actor: string, id: string, text: string, revision: number) {
    const m = this.list<Memory>(actor, "memory").find((x) => x.id === id);
    if (!m || m.revision !== revision) return false;
    this.put(actor, "memory-history", { ...m, id: `${id}:${revision}` });
    this.put(actor, "memory", {
      ...m,
      text,
      source: "user",
      revision: revision + 1,
    });
    return true;
  }
  requestFriend(actor: string, target: string) {
    if (actor === target) throw Error("自分は追加できません");
    if (
      this.read(actor).requests.some((r) => r.from === target && r.to === actor)
    )
      throw Error("相手からの申請を確認してください");
    this.db
      .prepare("INSERT OR IGNORE INTO friend_requests VALUES(?,?,?,?)")
      .run(randomUUID(), actor, target, "pending");
  }
  acceptFriend(actor: string, id: string) {
    const r = this.db
      .prepare(
        "UPDATE friend_requests SET status='accepted' WHERE id=? AND recipient=? AND status='pending'",
      )
      .run(id, actor);
    if (!r.changes) throw Error("承認できる申請がありません");
  }
  close() {
    this.db.close();
  }
}
