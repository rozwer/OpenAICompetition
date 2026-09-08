import {it,expect} from "vitest";
import {CodexAI} from "../src/infrastructure/codex";
import {monthlyInsightSchema,type MonthlyHistorySummary} from "../src/contracts/history";
it.skipIf(process.env.HISTORY_LIVE!=="1")("Codex returns a bounded monthly insight from aggregate test data",async()=>{
 const current:MonthlyHistorySummary={month:"2026-09",visitDays:2,totalVisits:3,uniquePlaces:2,newPlaces:1,totalStayMinutes:60,unknownDurationVisits:0,distanceMeters:null,topCategories:[{category:"カフェ",count:3}],topPlaces:[],newDiscoveries:[]};const result=monthlyInsightSchema.parse(await new CodexAI().generateMonthlyInsight({current,previousMonth:{...current,month:"2026-08",visitDays:1,totalVisits:1,uniquePlaces:1,newPlaces:1}}));expect(result.summary.length).toBeGreaterThan(0);
},120000);
