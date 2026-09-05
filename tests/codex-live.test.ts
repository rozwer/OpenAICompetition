import { it, expect } from "vitest";
import { CodexAI } from "../src/infrastructure/codex";
it.skipIf(process.env.RUN_CODEX_LIVE !== "1")(
  "connects to Codex using ChatGPT with a synthetic conversation",
  async () => {
    const response = await new CodexAI().respond({
      question:
        "架空のデモ記録です。海のそばで静かに過ごすのが好き。気持ちを切り替えられるからです。",
      place: null,
      history: [],
      memories: [],
      recentPoints: 0,
    });
    expect(response.answer.length).toBeGreaterThan(0);
    expect(response.memories.some((m) => m.source === "user")).toBe(true);
    console.info("Live response:", response.answer);
  },
  110000,
);

it.skipIf(process.env.RUN_DIAGNOSIS_LIVE !== "1")("diagnoses six preference axes through real Codex",async()=>{
 const response=await new CodexAI().diagnose({evidence:[{id:"message:test",kind:"conversation",text:"知らない道を探すのが好き。公園や水辺が特に好きです。歴史や建築にも興味があります。食べ歩きはあまり興味がありません。友人と散歩するのが好きで、長距離を歩くのも楽しいです。"}]});
 expect(new Set(response.axes.map(a=>a.id)).size).toBe(6);
 expect(response.axes.every(a=>a.score!==null&&a.evidenceIds.includes("message:test"))).toBe(true);
 console.info("Diagnosis live:",JSON.stringify(response));
},110000);

it.skipIf(process.env.RUN_ROUTE_LIVE !== "1")("selects registered route stops from conversation",async()=>{
 const {places}=await import('../src/fixtures/yokohama');
 const result=await new CodexAI().planRoute({start:places[1],end:places[0],required:[places[2]],candidates:[places[2]],memories:[],history:[{id:'route-live',role:'user',text:'静かな水辺を通って散歩したいです。新山下の水辺には必ず寄ってください。',placeId:null,status:'completed',createdAt:new Date().toISOString()}]});
 expect(result.stops.map(s=>s.placeId)).toEqual(['harbor']);expect(result.stops[0].reason.length).toBeGreaterThan(0);
 console.info('Route selection live:',JSON.stringify(result));
},110000);
