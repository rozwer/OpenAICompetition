import { test, expect } from "vitest";
import { diagnosisInput, emptyDiagnosis, validateDiagnosis } from "../src/domain/diagnosis";
import { SqliteRepository } from "../src/infrastructure/sqlite";
import { DiagnosisService } from "../src/server/diagnosis";
import { places } from "../src/fixtures/yokohama";
import type { TrackPoint } from "../src/contracts";
const now = Date.parse("2026-09-05T12:00:00Z");
const track = (origin: TrackPoint["origin"] = "device") => Array.from({length: 7}, (_, i) => ({ id: `${origin}-${i}`, lng: places[0].lng, lat: places[0].lat, time: new Date(now - (10-i)*60000).toISOString(), accuracy: 5, origin }));
test("stay needs sustained recent real observations; gaps, unknown accuracy and synthetic data do not prove a stay", () => {
 const repo = new SqliteRepository(":memory:");
 const state = repo.read("A");
 expect(diagnosisInput({...state, points: track()}, places, now).evidence).toHaveLength(1);
 for(const points of [track("synthetic"), track().map(p=>({...p,accuracy:null})), track().slice(0,4), track().filter((_,i)=>i===0||i===6)])
   expect(diagnosisInput({...state,points},places,now).evidence).toHaveLength(0);
 expect(diagnosisInput({...state,points:track()},places,now+31*86400000).evidence).toHaveLength(0);
});
test("unknown remains null; fabricated evidence and duplicated axes are rejected", () => {
 const input = {evidence:[{id:"message:1",kind:"conversation" as const,text:"自然が好き"}]};
 const result = emptyDiagnosis();
 result.axes[1] = {...result.axes[1], score:80,evidenceIds:["message:1"]};
 expect(validateDiagnosis(result,input).axes[0].score).toBeNull();
 expect(()=>validateDiagnosis({...result,axes:result.axes.map(a=>({...a,id:"nature"}))},input)).toThrow();
 result.axes[1].evidenceIds=["invented"];
 expect(()=>validateDiagnosis(result,input)).toThrow();
});
test("diagnosis cache is per actor and changes with evidence; empty state never calls AI",async()=>{
 const repo = new SqliteRepository(":memory:");let calls=0;
 const service=new DiagnosisService(repo,{diagnose:async()=>{calls++;return emptyDiagnosis();}},places);
 await service.diagnose("A");expect(calls).toBe(0);
 repo.saveMessage("A",{id:"one",role:"user",text:"緑のある公園が好き",createdAt:new Date().toISOString(),placeId:null,status:"saved"});
 await Promise.all([service.diagnose("A"),service.diagnose("A")]);expect(calls).toBe(1);
 await service.diagnose("A");expect(calls).toBe(1);
 expect((await service.diagnose("B")).evidence).toHaveLength(0);
 repo.saveMessage("A",{id:"two",role:"user",text:"食べ歩きも好き",createdAt:new Date().toISOString(),placeId:null,status:"saved"});
 await service.diagnose("A");expect(calls).toBe(2);
});
