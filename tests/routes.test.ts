import { test, expect } from "vitest";
import { OpenRouteService } from "../src/infrastructure/openrouteservice";
import { RouteService } from "../src/server/routes";
import { SqliteRepository } from "../src/infrastructure/sqlite";
import { places } from "../src/fixtures/yokohama";
const request={start:"motomachi",end:"park",via:["harbor"],placeId:null};
const choice={stops:[{placeId:"harbor",reason:"水辺が好きという会話から"}],explanation:"水辺を通る散歩"};
function repo(){const r=new SqliteRepository(":memory:");r.saveMessage("A",{id:"m",placeId:null,role:"user",text:"水辺が好き",status:"completed",createdAt:new Date().toISOString()});return r;}
test("AI stops persist without a key; retry reuses AI selection and orders all waypoints",async()=>{
 const r=repo();let calls=0,configured=false;const routed:string[][]=[];
 const service=new RouteService(r,{planRoute:async()=>{calls++;return choice;}},{configured:()=>configured,route:async points=>{routed.push(points.map(p=>p.id));return {geometry:{type:"LineString",coordinates:points.map(p=>[p.lng,p.lat])},distance:1234,duration:900};}},places);
 expect((await service.create("A",request)).status).toBe("needs-key");expect(r.readRoute("B")).toBeUndefined();expect(routed).toHaveLength(0);
 configured=true;expect((await service.create("A",request)).status).toBe("ready");expect(calls).toBe(1);expect(routed[0]).toEqual(["motomachi","harbor","park"]);
 await service.create("A",request);expect(routed).toHaveLength(1);expect(r.read("A").points).toHaveLength(0);
});
test("missing mandatory stops, fabricated IDs and stale GPS are rejected",async()=>{
 for(const stops of [[],[{placeId:"invented",reason:"x"}]]) {
 const s=new RouteService(repo(),{planRoute:async()=>({...choice,stops})},{configured:()=>false,route:async()=>{throw Error("must not call");}},places);
 await expect(s.create("A",request)).rejects.toThrow();
 await expect(s.create("A",{...request,start:"gps"})).rejects.toThrow(/GPS/);
 }
});
test("ORS receives walking coordinates, validates snapped waypoints and never substitutes a straight line on failure",async()=>{
 const points=[places[1],places[2],places[0]];
 let sent:any;
 const fetcher:typeof fetch=async(url,init)=>{sent={url,body:JSON.parse(String(init?.body))};return Response.json({features:[{geometry:{type:"LineString",coordinates:points.map(p=>[p.lng,p.lat])},properties:{summary:{distance:1000,duration:700},way_points:[0,1,2]}}]});};
 const result=await new OpenRouteService("test-key",fetcher).route(points);expect(result.distance).toBe(1000);expect(sent.url).toContain("foot-walking/geojson");expect(sent.body.coordinates).toEqual(points.map(p=>[p.lng,p.lat]));
 await expect(new OpenRouteService("test",async()=>new Response('',{status:429})).route(points)).rejects.toThrow(/利用上限/);
 const bad:typeof fetch=async()=>Response.json({features:[{geometry:{type:"LineString",coordinates:[[0,0],[0,1],[0,2]]},properties:{summary:{distance:1,duration:1},way_points:[0,1,2]}}]});
 await expect(new OpenRouteService("test",bad).route(points)).rejects.toThrow(/指定地点/);
 const r=repo(),s=new RouteService(r,{planRoute:async()=>choice},{configured:()=>true,route:async()=>{throw Error("接続失敗");}},places);
 const failed=await s.create("A",request);expect(failed.status).toBe("failed");expect(failed.route).toBeNull();
});
