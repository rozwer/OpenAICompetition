import { describe, it, expect } from "vitest";
import { segments, explored, exploredFootprint } from "../src/domain/tracks";
import { SqliteRepository } from "../src/infrastructure/sqlite";
import { ConversationService } from "../src/server/services";
import type { TrackPoint } from "../src/contracts";
const point = (id: string, seconds: number, lng = 139.65): TrackPoint => ({
  id,
  lng,
  lat: 35.44,
  time: new Date(Date.UTC(2026, 8, 5, 0, 0, seconds)).toISOString(),
  accuracy: 5,
  origin: "synthetic",
});
describe("track evidence", () => {
  it("unlocks near the middle of a long building edge, not only its vertices", () => {
    const ring = [
      [139.649, 35.4401],
      [139.651, 35.4401],
      [139.651, 35.441],
      [139.649, 35.441],
      [139.649, 35.4401],
    ];
    expect(exploredFootprint(ring, [[point("a", 0)]])).toBe(true);
    expect(exploredFootprint(ring, [[{ ...point("b", 0), lat: 35.439 }]])).toBe(
      false,
    );
  });
  it("breaks missing intervals and does not unlock the gap", () => {
    const lines = segments([point("a", 0), point("b", 150, 139.652)]);
    expect(lines).toHaveLength(2);
    expect(explored({ lng: 139.651, lat: 35.44 }, lines)).toBe(false);
  });
  it("rejects poor and unknown accuracy, and teleports", () => {
    expect(
      segments([
        { ...point("a", 0), accuracy: null },
        { ...point("b", 15), accuracy: 60 },
      ]),
    ).toEqual([]);
    expect(segments([point("a", 0), point("b", 1, 140)])).toHaveLength(2);
  });
  it("unlocks along a valid segment using the 20 metre radius", () => {
    const lines = segments([point("a", 0), point("b", 20, 139.651)]);
    expect(explored({ lng: 139.6505, lat: 35.4401 }, lines)).toBe(true);
    expect(explored({ lng: 139.6505, lat: 35.4403 }, lines)).toBe(false);
  });
});
describe("ownership and persistence", () => {
  it("deduplicates replay without leaking another actor data", () => {
    const db = new SqliteRepository(":memory:");
    db.addPoints("A", [point("a", 0), point("a", 0)]);
    expect(db.read("A").points).toHaveLength(1);
    expect(db.read("B").points).toHaveLength(0);
    db.close();
  });
  it("only the recipient can accept an invitation", () => {
    const db = new SqliteRepository(":memory:");
    db.requestFriend("A", "B");
    const id = db.read("B").requests[0].id;
    expect(() => db.acceptFriend("A", id)).toThrow();
    db.acceptFriend("B", id);
    expect(db.read("A").friends).toEqual(["B"]);
    db.close();
  });
  it("keeps the original message on AI failure and retries once", async () => {
    const db = new SqliteRepository(":memory:");
    const m = {
      id: "m",
      role: "user" as const,
      text: "海のそばが好き",
      placeId: "park",
      createdAt: new Date().toISOString(),
      status: "saved" as const,
    };
    db.saveMessage("A", m);
    const service = new ConversationService(db, {
      respond: async () => {
        throw Error("limit");
      },
    });
    await service.respond("A", "m");
    expect(db.read("A").messages[0].status).toBe("waiting");
    const working = new ConversationService(db, {
      respond: async () => ({
        answer: "海のそばのどんなところが好きですか？",
        memories: [{ text: "海のそばが好き", source: "user" }],
      }),
    });
    await working.respond("A", "m");
    await working.respond("A", "m");
    expect(db.read("A").messages).toHaveLength(2);
    expect(db.read("A").memories).toHaveLength(1);
    const memory = db.read("A").memories[0];
    expect(db.reviseMemory("A", memory.id, "夕方の海が好き", 1)).toBe(true);
    expect(db.reviseMemory("A", memory.id, "上書き", 1)).toBe(false);
    expect(db.read("A").memories[0].text).toBe("夕方の海が好き");
    db.close();
  });
});
