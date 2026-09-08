import { DatabaseSync, backup } from "node:sqlite";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

// Explicit, local-only demo seeding. Never run as part of application startup.
const path = resolve(process.argv[2] || ".local/grow-map-nagoya.sqlite");
if (!existsSync(path)) throw new Error("Start the app first; the target database must already exist.");
const db = new DatabaseSync(path);
db.exec("PRAGMA busy_timeout=5000");
const backupPath = `${path}.before-history-demo-${Date.now()}.bak`;
await backup(db, backupPath);
const now = Date.now();
const today = new Date(now + 9 * 3600000).toISOString().slice(0, 10);
const [year, month] = today.split("-").map(Number);
const locations = [
  ["名古屋大学周辺", "大学", 35.1545, 136.9702, "graduation-cap"],
  ["本山のカフェ", "カフェ", 35.1636, 136.9635, "coffee"],
  ["栄の書店", "書店", 35.1690, 136.9085, "book-open"],
  ["大須の雑貨店", "ショッピング", 35.1598, 136.9038, "shopping-bag"],
  ["鶴舞の公園", "公園", 35.1554, 136.9206, "trees"],
  ["栄のランチ店", "レストラン", 35.1684, 136.9100, "utensils"],
  ["東山の散歩スポット", "公園", 35.1585, 136.9730, "trees"],
  ["大須の喫茶店", "カフェ", 35.1606, 136.9067, "coffee"],
  ["久屋大通の写真スポット", "観光", 35.1741, 136.9084, "camera"],
  ["名古屋大学の図書館周辺", "書店", 35.1549, 136.9668, "book-open"],
];
const put = db.prepare("INSERT OR IGNORE INTO personal_records(actor,kind,id,payload) VALUES(?,?,?,?)");
let added = 0;
db.exec("BEGIN IMMEDIATE");
try {
  for (const actor of ["A", "B"]) {
    const places = locations.map(([name, category, lat, lng, icon], index) => ({
      id: `history-demo-place-${index}`, name: `${name}（サンプル）`, category, lat, lng,
      description: "履歴を体験するための架空の場所・訪問データです。位置はエリアの目安です。",
      categoryL1: category, categoryL2: category, categoryPath: [category], icon,
      source: "user", sourceId: `history-demo-place-${index}`,
      rawTags: { demo: true }, normalizedAt: new Date(now).toISOString(), normalizationVersion: 1,
    }));
    for (const place of places) put.run(actor, "place", place.id, JSON.stringify(place));
    for (let offset = 2; offset >= 0; offset--) {
      const ym = new Date(Date.UTC(year, month - 1 - offset, 1)).toISOString().slice(0, 7);
      const days = offset === 0 ? Array.from({ length: Number(today.slice(8)) }, (_, i) => i + 1) : offset === 1 ? [2, 4, 6, 8, 11, 13, 16, 18, 21, 24, 27, 30] : [3, 7, 12, 17, 22, 28];
      for (const day of days) {
        const date = `${ym}-${String(day).padStart(2, "0")}`;
        const indices = date === today ? [0, 1, 2, 3] : [0, (day + (actor === "B" ? 2 : 0)) % (offset === 2 ? 4 : offset === 1 ? 7 : 10), offset === 2 ? 1 : 5, offset === 2 ? 2 : offset === 1 ? 4 : 8];
        for (const [order, index] of indices.entries()) {
          const enteredAt = new Date(`${date}T${["09:12", "10:44", "12:38", "14:20"][order]}:00+09:00`).toISOString();
          const minutes = [72, 78, 52, 76][order];
          const exitedAt = new Date(Date.parse(enteredAt) + minutes * 60000).toISOString();
          if (Date.parse(exitedAt) > now) continue;
          const id = `history-demo-${date}-${order}`;
          const visit = { id, userId: actor, placeId: places[index].id, enteredAt, exitedAt,
            durationMinutes: minutes, source: "manual",
            context: { weekday: ![0, 6].includes(new Date(`${date}T12:00:00+09:00`).getUTCDay()), timeOfDay: order < 2 ? "morning" : "afternoon", weather: "unknown", company: "unknown", timezone: "Asia/Tokyo" } };
          added += Number(put.run(actor, "visit", id, JSON.stringify(visit)).changes);
        }
      }
    }
  }
  db.exec("COMMIT");
} catch (error) { db.exec("ROLLBACK"); throw error; }
console.log(JSON.stringify({ backupPath, today, addedVisits: added, actors: ["A", "B"], gpsPointsAdded: 0 }));
db.close();
