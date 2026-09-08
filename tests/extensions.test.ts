import { markerAppearance } from "../src/domain/extensions";
import { describe, it, expect, vi } from "vitest";
import {
  validateDefinition,
  execute,
  assertCompatible,
} from "../src/domain/extensions";
import { ExtensionStore } from "../src/infrastructure/extension-store";
import { SqliteRepository } from "../src/infrastructure/sqlite";
import { ExtensionService } from "../src/server/extensions";
import type { Definition } from "../src/contracts/extensions";
import { places } from "../src/fixtures/nagoya";
export const note: Definition = {
  schemaVersion: 1,
  name: "場所のメモ",
  description: "場所にメモを保存",
  permissions: ["places"],
  fields: [{ key: "memo", label: "メモ", type: "string", initial: "" }],
  actions: [
    {
      id: "save",
      label: "メモを保存",
      event: "click",
      inputs: ["memo"],
      steps: [
        {
          when: [],
          op: "set",
          field: "memo",
          value: { ref: "input.memo", value: null },
        },
      ],
    },
  ],
  display: {
    title: "{place.name}",
    detail: "{record.memo}",
    marker: "pin",
    growthField: null,
    growthAt: 3,
  },
  external: null,
};
export const tree: Definition = {
  schemaVersion: 1,
  name: "お気に入りの木",
  description: "訪問で育つ",
  permissions: ["places", "visits"],
  fields: [{ key: "points", label: "ポイント", type: "number", initial: 0 }],
  actions: [
    {
      id: "visit",
      label: "木を育てる",
      event: "visit",
      inputs: [],
      steps: [
        {
          when: [],
          op: "add",
          field: "points",
          value: { ref: null, value: 1 },
        },
      ],
    },
  ],
  display: {
    title: "{place.name}の木",
    detail: "{record.points}ポイント",
    marker: "tree",
    growthField: "points",
    growthAt: 3,
  },
  external: null,
};
const env = {
  place: places[0],
  event: { day: "2026-09-08", type: "visit" },
  context: {},
  input: {},
};
it("executes generated arithmetic once per day and preserves state after a failed step", () => {
  const d = validateDefinition(tree);
  const first = execute(d, { records: [] }, "visit", env);
  expect(first.state.records[0].values.points).toBe(1);
  expect(
    execute(d, first.state, "visit", env).state.records[0].values.points,
  ).toBe(1);
  expect(
    execute(d, first.state, "visit", {
      ...env,
      event: { ...env.event, day: "2026-09-09" },
    }).state.records[0].values.points,
  ).toBe(2);
  const broken = structuredClone(d);
  broken.actions[0].steps.push({
    when: [],
    op: "set",
    field: "points",
    value: { ref: null, value: "bad" },
  });
  expect(() =>
    execute(broken, first.state, "visit", {
      ...env,
      event: { ...env.event, day: "2026-09-09" },
    }),
  ).toThrow();
  expect(first.state.records[0].values.points).toBe(1);
});
it("rejects arbitrary operations, undeclared private reads, prototype references and destructive migrations", () => {
  expect(() =>
    validateDefinition({
      ...note,
      actions: [
        {
          ...note.actions[0],
          steps: [
            {
              when: [],
              op: "fetch",
              field: null,
              value: { ref: null, value: "http://localhost" },
            },
          ],
        },
      ],
    }),
  ).toThrow();
  const bad = structuredClone(note);
  bad.actions[0].steps[0].value.ref = "context.messages";
  expect(() => validateDefinition(bad)).toThrow();
  bad.actions[0].steps[0].value.ref = "record.__proto__";
  expect(() => validateDefinition(bad)).toThrow();
  expect(() => assertCompatible(note, { ...note, fields: [] })).toThrow();
});
it("publishes only a definition, separates preview and other actors, retains installed data on disable/update", async () => {
  const service = new ExtensionService(
    new ExtensionStore(":memory:"),
    new SqliteRepository(":memory:"),
    {
      generateExtension: async () => ({
        explanation: "作成しました",
        definition: note,
      }),
    },
    places,
  );
  const draft = await service.generate("A", undefined, "メモを作成");
  expect(() => service.install("A", draft.id, 1, "draft")).toThrow();
  service.run(
    "A",
    draft.id,
    1,
    "save",
    places[0].id,
    { memo: "試用の秘密" },
    true,
  );
  service.install("A", draft.id, 1, "draft");
  expect(service.read("A").installed[0].state.records).toHaveLength(0);
  service.run("A", draft.id, 1, "save", places[0].id, { memo: "Aの秘密" });
  service.publish("A", draft.id, 1);
  expect(JSON.stringify(service.read("B"))).not.toContain("秘密");
  service.install("B", draft.id, 1, "public");
  expect(service.read("B").installed[0].state.records).toHaveLength(0);
  expect(() =>
    service.run("B", draft.id, 1, "save", places[0].id, { memo: "x" }, true),
  ).toThrow();
  service.toggle("A", draft.id, false);
  expect(() =>
    service.run("A", draft.id, 1, "save", places[0].id, { memo: "x" }),
  ).toThrow();
  service.toggle("A", draft.id, true);
  expect(service.read("A").installed[0].state.records[0].values.memo).toBe(
    "Aの秘密",
  );
  const updated = await service.generate("A", draft.id, "修正");
  service.run("A", draft.id, 2, "save", places[0].id, { memo: "test" }, true);
  service.publish("A", draft.id, 2);
  expect(service.read("B").installed[0].revision.version).toBe(1);
  service.install("A", draft.id, 2, "draft");
  expect(service.read("A").installed[0].state.records[0].values.memo).toBe(
    "Aの秘密",
  );
  expect(updated.revisions.length).toBe(2);
});
it("keeps a valid revision after generation failure and denies fabricated visits", async () => {
  let fail = false;
  const s = new ExtensionService(
    new ExtensionStore(":memory:"),
    new SqliteRepository(":memory:"),
    {
      generateExtension: async () => {
        if (fail) throw Error("AI unavailable");
        return { explanation: "木", definition: tree };
      },
    },
    places,
  );
  const d = await s.generate("A", undefined, "木");
  s.run("A", d.id, 1, "visit", places[0].id, {}, true);
  s.install("A", d.id, 1, "draft");
  expect(() => s.run("A", d.id, 1, "visit", places[0].id, {})).toThrow(
    "現在地",
  );
  fail = true;
  const next = await s.generate("A", d.id, "修正");
  expect(next.error).toBe("AI unavailable");
  expect(next.revisions.length).toBe(1);
  expect(s.read("A").installed[0].revision.version).toBe(1);
});

it("requires external consent before network access and keeps permission scope explicit", async () => {
  const d = {
    ...note,
    external: { provider: "overpass", category: "park", radius: 500 },
  } as Definition;
  const s = new ExtensionService(
    new ExtensionStore(":memory:"),
    new SqliteRepository(":memory:"),
    {
      generateExtension: async () => ({
        explanation: "周辺施設",
        definition: d,
      }),
    },
    places,
  );
  const draft = await s.generate("A", undefined, "公園");
  s.run("A", draft.id, 1, "save", places[0].id, { memo: "test" }, true);
  s.install("A", draft.id, 1, "draft");
  expect((await s.geography("A", draft.id, 1, false)).approvalRequired).toBe(
    true,
  );
  await expect(s.geography("B", draft.id, 1, false)).rejects.toThrow();
  await expect(s.geography("A", draft.id, 1, true)).rejects.toThrow("現在地");
  expect(s.read("A").installed[0].consent).toBeNull();
});

it("runs against the real shared database without locking the existing repository",async()=>{
 const {mkdtempSync}=await import("node:fs");const {tmpdir}=await import("node:os");const {join}=await import("node:path");
 const path=join(mkdtempSync(join(tmpdir(),"grow-ext-test-")),"test.sqlite");
 const s=new ExtensionService(new ExtensionStore(path),new SqliteRepository(path),{generateExtension:async()=>({explanation:"メモ",definition:note})},places);
 const d=await s.generate("A",undefined,"メモ");expect(s.run("A",d.id,1,"save",places[0].id,{memo:"保存"},true).state.records[0].values.memo).toBe("保存");
});


it("sends only the approved geography fields and reuses consent until revoked",async()=>{
 const repo=new SqliteRepository(":memory:");repo.addPoints("A",[{id:"gps",lng:136.9088,lat:35.1674,time:new Date().toISOString(),accuracy:10,origin:"device"}]);
 const d={...note,external:{provider:"overpass",category:"museum",radius:500}} as Definition;
 const s=new ExtensionService(new ExtensionStore(":memory:"),repo,{generateExtension:async()=>({explanation:"地理情報",definition:d})},places);
 const draft=await s.generate("A",undefined,"施設");s.run("A",draft.id,1,"save",places[0].id,{memo:"送らない秘密"},true);s.install("A",draft.id,1,"draft");
 const fetcher=vi.spyOn(globalThis,"fetch").mockResolvedValue(new Response(JSON.stringify({elements:[{type:"node",id:1,lat:35.1674,lon:136.9088,tags:{name:"博物館"}}]})));
 try {
 expect((await s.geography("A",draft.id,1,false)).approvalRequired).toBe(true);expect(fetcher).not.toHaveBeenCalled();
 expect((await s.geography("A",draft.id,1,true)).places[0].name).toBe("博物館");
 expect((await s.geography("A",draft.id,1,false)).approvalRequired).toBe(false);
 expect(fetcher).toHaveBeenCalledTimes(1);expect(String(fetcher.mock.calls[0][1]?.body)).not.toContain("秘密");expect(fetcher.mock.calls[0][0]).toBe("https://overpass-api.de/api/interpreter");
 s.revoke("A",draft.id);expect((await s.geography("A",draft.id,1,false)).approvalRequired).toBe(true);
 }finally{fetcher.mockRestore();}
});

it("allows distinct arrival actions while deduplicating each action",()=>{
 const d=structuredClone(tree);d.actions.push({...structuredClone(d.actions[0]),id:"bonus"});
 const first=execute(d,{records:[]},"visit",env);const second=execute(d,first.state,"bonus",env);
 expect(second.state.records[0].values.points).toBe(2);expect(execute(d,second.state,"bonus",env).state.records[0].values.points).toBe(2);
});

it("resolves map colors with legacy defaults, typed conditions and first-match precedence",()=>{
 const record=execute(tree,{records:[]},"visit",env).state.records[0];
 expect(markerAppearance(tree,record).color).toBe("#388565");
 const d=structuredClone(tree);d.display.appearance={color:"blue",rules:[{field:"points",op:"gte",value:3,color:"green",label:"達成"},{field:"points",op:"gte",value:1,color:"amber",label:"成長中"}]};
 validateDefinition(d);expect(markerAppearance(d,record).label).toBe("成長中");record.values.points=3;expect(markerAppearance(d,record).label).toBe("達成");record.values.points=0;expect(markerAppearance(d,record).color).toBe("#326EC4");
 const bad=structuredClone(d);bad.display.appearance!.rules[0].field="missing";expect(()=>validateDefinition(bad)).toThrow();
 bad.display.appearance!.rules[0].field="points";bad.display.appearance!.rules[0].value="3";expect(()=>validateDefinition(bad)).toThrow();
 expect(()=>validateDefinition({...d,display:{...d.display,appearance:{color:"url(https://example.com)",rules:[]}}})).toThrow();
});

it("keeps all generated output fields required while accepting stored legacy definitions",async()=>{
 const {z}=await import("zod");const {codexGenerationSchema,definitionSchema}=await import("../src/contracts/extensions");
 function check(schema:any){if(!schema||typeof schema!=="object")return;if(schema.type==="object")expect(new Set(schema.required)).toEqual(new Set(Object.keys(schema.properties||{})));for(const value of Object.values(schema))if(Array.isArray(value))value.forEach(check);else if(value&&typeof value==="object")check(value);}
 check(z.toJSONSchema(codexGenerationSchema));expect(definitionSchema.parse(tree).display.appearance).toBeUndefined();
});
