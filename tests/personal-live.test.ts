import {it,expect} from "vitest";
import {CodexAI} from "../src/infrastructure/codex";
import {aggregateUserActivity,visitContext,userRelations,validatePersonalInsight} from "../src/domain/personal-activity";
import {osmPlaces} from "../src/domain/place-adapters";
import type {Visit} from "../src/contracts/personal-insights";
it.skipIf(process.env.PERSONAL_LIVE!=="1")("local Codex returns strict, evidence-linked personal insight from aggregate test data",async()=>{
 const places=osmPlaces({elements:[{type:"node",id:1,lat:35,lon:136,tags:{name:"検証用カフェ（架空）",amenity:"cafe"}}]});
 const visits:Visit[]=Array.from({length:5},(_,i)=>{const time=new Date(Date.now()-i*86400000-3600000).toISOString();return {id:`test:${i}`,userId:"TEST",placeId:places[0].id,enteredAt:time,exitedAt:new Date(Date.parse(time)+45*60000).toISOString(),durationMinutes:45,context:visitContext(time),source:"manual"};});
 const input=aggregateUserActivity(visits,places,userRelations("TEST",visits,new Set()));const result=validatePersonalInsight(await new CodexAI().generatePersonalInsight(input),input);expect(result.summary.length).toBeGreaterThan(0);expect(result.personaCards.length+result.patterns.length).toBeGreaterThan(0);
},120000);
