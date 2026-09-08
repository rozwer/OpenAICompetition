import { it, expect } from "vitest";
import { LocalCodexDeveloper } from "../src/infrastructure/local-codex-developer";
import { ExtensionDevelopmentKit } from "../src/domain/extension-development";
import type { Definition } from "../src/contracts/extensions";
const definition: Definition = {schemaVersion:1,name:"検証機能",description:"保存",permissions:[],fields:[{key:"score",label:"得点",type:"number",initial:0}],actions:[{id:"add",label:"加算",event:"click",inputs:[],steps:[{when:[],op:"add",field:"score",value:{ref:null,value:1}}]}],display:{title:"検証",detail:"{record.score}",marker:"none",growthField:null,growthAt:3},external:null};
it("local developer receives common tools and repairs a failing candidate before submission", async()=>{
 const calls:any[]=[];const broken=structuredClone(definition);broken.actions[0].steps[0].op="set";broken.actions[0].steps[0].value.value="wrong type";
 const developer=new LocalCodexDeveloper({generateExtension:async input=>{calls.push(input);return {explanation:"作成しました",definition:calls.length===1?broken:definition};}},new ExtensionDevelopmentKit());
 const result=await developer.generateExtension({history:[{role:"user",text:"加算して"}],definition:null});
 expect(result.definition).toEqual(definition);expect(calls).toHaveLength(2);expect(calls[0].development.specification.operations).toContain("tryDefinition");expect(calls[1].development.feedback).toContain("保存値");
 expect(JSON.stringify(calls)).not.toContain("installed");
});
it("failed development is bounded and cannot replace an incompatible definition",async()=>{
 let calls=0;const changed={...definition,fields:[{key:"different",label:"変更",type:"number" as const,initial:0}]};
 const developer=new LocalCodexDeveloper({generateExtension:async()=>{calls++;return {explanation:"修正",definition:changed};}},new ExtensionDevelopmentKit());
 await expect(developer.generateExtension({history:[],definition})).rejects.toThrow("自動修正後");expect(calls).toBe(3);
});
