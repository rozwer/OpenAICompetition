import { describe,it,expect } from "vitest";
import { randomUUID } from "node:crypto";
import { aggregateUserActivity,detectVisitCandidates,visitContext,userRelations,validatePersonalInsight } from "../src/domain/personal-activity";
import { osmPlaces } from "../src/domain/place-adapters";
import { PersonalStore } from "../src/infrastructure/personal-store";
import { SqliteRepository } from "../src/infrastructure/sqlite";
import { PersonalInsightService } from "../src/server/personal-insights";
import type { PersonalInsight,Visit } from "../src/contracts/personal-insights";
import type { TrackPoint } from "../src/contracts";
const places=osmPlaces({elements:[{type:"node",id:1,lat:35,lon:136,tags:{name:"試験用カフェ",amenity:"cafe"}}]});
const empty:PersonalInsight={summary:"",personaCards:[],patterns:[],changes:[],preferenceScores:[],placeRelationships:[]};
const input=()=>({id:randomUUID(),placeId:places[0].id,enteredAt:new Date(Date.now()-90*60000).toISOString(),durationMinutes:60,company:"solo" as const,weather:"unknown" as const});
describe("personal activity",()=>{
 it("counts per-user visits and unknown durations without sending GPS to AI",()=>{
  const time=new Date().toISOString(),v:Visit={id:"one",userId:"A",placeId:places[0].id,enteredAt:time,exitedAt:time,durationMinutes:null,context:visitContext(time),source:"manual"};
  const r=userRelations("A",[v],new Set([v.placeId]));expect(r[0]).toMatchObject({visitCount:1,totalStayMinutes:0,unknownDurationVisits:1,favorite:true});
  const a=aggregateUserActivity([v],places,r);expect(a.current.categories.cafe).toBe(1);expect(a.current.unknownDurationVisits).toBe(1);expect(JSON.stringify(a)).not.toContain('"lat"');expect(JSON.stringify(a)).not.toContain('"lng"');expect(JSON.stringify(a)).not.toContain('"enteredAt"');
 });
 it("GPS requires a stable, unambiguous five-minute stay and ignores synthetic traces",()=>{
  const now=Date.now(),points:TrackPoint[]=Array.from({length:7},(_,i)=>({id:`p${i}`,lat:35,lng:136,time:new Date(now-(6-i)*60000).toISOString(),origin:"device",accuracy:10}));
  expect(detectVisitCandidates(points,places,now)).toHaveLength(1);expect(detectVisitCandidates(points.map(p=>({...p,origin:"synthetic"})),places,now)).toHaveLength(0);expect(detectVisitCandidates(points,[...places,{...places[0],id:"another"}],now)).toHaveLength(0);expect(detectVisitCandidates(points.slice(0,4),places,now)).toHaveLength(0);
 });
 it("stores idempotent records, actor isolation, favorites and cached insight snapshots",async()=>{
  const store=new PersonalStore(":memory:"),repo=new SqliteRepository(":memory:");let calls=0;
  const service=new PersonalInsightService(store,repo,{async generatePersonalInsight(){calls++;return empty;}},places),v=input();
  service.record("A",v);service.record("A",v);expect(service.state("A").visits).toHaveLength(1);expect(service.state("B").visits).toHaveLength(0);
  expect(service.favorite("A",v.placeId,true).relations[0].favorite).toBe(true);expect(service.state("B").relations).toHaveLength(0);
  await service.generate("A");await service.generate("A");expect(calls).toBe(1);expect(service.state("A").snapshots).toHaveLength(1);expect(service.state("B").snapshots).toHaveLength(0);
 });
 it("leaves facts and old insight intact when AI output is invalid",async()=>{
  const store=new PersonalStore(":memory:"),repo=new SqliteRepository(":memory:");store.put("A","insight","old",{id:"old",generatedAt:"2026-01-01",result:empty});
  const service=new PersonalInsightService(store,repo,{async generatePersonalInsight(){return {...empty,patterns:[{id:"bad",title:"誤り",description:"",confidence:1,relatedPlaceIds:[],relatedCategories:[],evidenceIds:["invented"]}]};}},places);service.record("A",input());
  await expect(service.generate("A")).rejects.toThrow();expect(store.snapshots("A")).toHaveLength(1);expect(store.visits("A")).toHaveLength(1);
 });
 it("confirms a GPS candidate only once and keeps unconfirmed stays out of counts",()=>{
  const repo=new SqliteRepository(":memory:"),now=Date.now();repo.addPoints("A",Array.from({length:7},(_,i)=>({id:`pt${i}`,lat:35,lng:136,time:new Date(now-(6-i)*60000).toISOString(),origin:"device",accuracy:10})));
  const service=new PersonalInsightService(new PersonalStore(":memory:"),repo,{async generatePersonalInsight(){return empty;}},places);const first=service.state("A");expect(first.visits).toHaveLength(0);expect(first.candidates).toHaveLength(1);service.confirm("A",first.candidates[0].id,true);expect(service.confirm("A",first.candidates[0].id,true).visits).toHaveLength(1);
 });
 it("rejects unknown evidence and removes changes without previous-period data",()=>{
  const a=aggregateUserActivity([],places,[]);expect(validatePersonalInsight(empty,a).changes).toEqual([]);
  expect(()=>validatePersonalInsight({...empty,preferenceScores:[{axis:"quiet",score:80,confidence:1,reason:"",evidenceIds:[]}]},a)).toThrow();
 });
});
