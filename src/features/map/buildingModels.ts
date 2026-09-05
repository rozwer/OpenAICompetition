import type { Feature, Polygon, FeatureCollection } from "geojson";
export const buildingTypes = ["house", "apartment", "shop", "office", "warehouse", "civic"] as const;
export type BuildingType = typeof buildingTypes[number];
type Preset = { name: string; roof: "gable" | "terrace" | "tower" | "sawtooth" | "flat"; floors: number; wall: string; cap: string; glass: string; setback: number };
const colors = ["#ecd9bd", "#efe7d7", "#c1d3cb", "#d5bca6", "#e1c5be", "#c4ced6", "#d6d8b8", "#e7d5bc", "#b8cbc6", "#e3e0d4"];
const caps = ["#997668", "#536d75", "#6e8a7c", "#b5765b", "#747989"];
const forms: Record<BuildingType, Preset["roof"][]> = {
 house: ["gable","gable","terrace","gable","flat","tower","gable","terrace","gable","flat"],
 apartment: ["terrace","tower","flat","terrace","tower","terrace","flat","tower","terrace","flat"],
 shop: ["flat","gable","terrace","flat","tower","gable","flat","terrace","gable","terrace"],
 office: ["tower","terrace","tower","flat","terrace","tower","flat","tower","terrace","tower"],
 warehouse: ["sawtooth","gable","flat","sawtooth","flat","gable","sawtooth","flat","gable","sawtooth"],
 civic: ["tower","terrace","gable","flat","tower","terrace","gable","tower","flat","terrace"],
};
const floorCounts: Record<BuildingType, number[]> = { house:[2,2,3,1,2,3,2,3,1,2], apartment:[4,6,3,5,7,4,5,8,6,3], shop:[2,1,3,2,4,2,1,3,2,3], office:[6,8,10,5,7,9,6,10,8,7], warehouse:[1,2,1,2,1,2,1,1,2,2], civic:[3,4,2,3,5,4,3,6,2,4] };
export const buildingCatalog = Object.fromEntries(buildingTypes.map(type => [type, Array.from({length:10},(_,i):Preset=>({ name:`${type}-${i+1}`, roof:forms[type][i], floors:floorCounts[type][i], wall:colors[i], cap:caps[i%5], glass:i%3===0?"#608e9d":i%3===1?"#83afb7":"#486b79", setback:0.5+(i%5)*0.08 }))])) as Record<BuildingType, Preset[]>;
export function hashBuilding(value: string) { let h=2166136261;for(const c of value) h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0; }
function localFrame(f: Feature<Polygon>) {
 const ring=f.geometry.coordinates[0].slice(0,-1);
 const center=ring.reduce((a,p)=>[a[0]+p[0]/ring.length,a[1]+p[1]/ring.length],[0,0]);
 const sx=111320*Math.cos(center[1]*Math.PI/180),sy=111320;
 const xy=ring.map(p=>[(p[0]-center[0])*sx,(p[1]-center[1])*sy]);
 const signed=xy.reduce((a,p,i)=>{const q=xy[(i+1)%xy.length];return a+p[0]*q[1]-q[0]*p[1];},0)/2;
 return {xy,area:Math.abs(signed),center,sx,sy};
}
export function buildingDesign(f: Feature<Polygon>) {
 const {area}=localFrame(f),p=f.properties??{},tag=String(p.building??"yes");
 let type:BuildingType;
 if (/^(house|detached|bungalow|terrace)$/.test(tag)) type="house";
 else if (/apartments|residential|hotel|dormitory/.test(tag)) type="apartment";
 else if (/retail|commercial|kiosk/.test(tag)||p.shop) type="shop";
 else if (/office/.test(tag)) type="office";
 else if (/warehouse|industrial|hangar|roof/.test(tag)) type="warehouse";
 else if (/public|school|historic|church|hospital|civic/.test(tag)||p.amenity) type="civic";
 else type=area<140?"house":area<380?"shop":area<900?"apartment":area>2400?"warehouse":"office";
 const variant=hashBuilding(String(f.id))%10,preset=buildingCatalog[type][variant];
 const nominal=preset.floors*(type==="warehouse"?5:3.2);
 const height=Math.max(4,Math.min(type==="house"?12:type==="warehouse"?16:38,Number(p.height)||nominal));
 return {type,variant,preset,height};
}
export function buildingParts(f: Feature<Polygon>): FeatureCollection<Polygon> {
 const {xy,center,sx,sy}=localFrame(f),{type,preset,height}=buildingDesign(f);
 const features:Feature<Polygon>[]=[];
 const add=(ring:number[][],base:number,top:number,color:string)=>{
  const coordinates=ring.map(p=>[center[0]+p[0]/sx,center[1]+p[1]/sy]);coordinates.push(coordinates[0]);
  features.push({type:"Feature",id:`${f.id}:${features.length}`,properties:{parent:f.id,base,top,color},geometry:{type:"Polygon",coordinates:[coordinates]}});
 };
 const scaled=(s:number)=>xy.map(p=>[p[0]*s,p[1]*s]);
 const box=(x:number,y:number,w:number,d:number)=>[[x-w/2,y-d/2],[x+w/2,y-d/2],[x+w/2,y+d/2],[x-w/2,y+d/2]];
 // Base and cornice give even flat-roof variants a readable silhouette.
 add(scaled(1),0,0.5,"#b8b5a4");
 add(scaled(1.015),height-0.35,height+0.15,preset.cap);
 const floors=Math.max(1,Math.min(8,Math.round(height/3.2)));
 // Longest walls only: cap geometry cost for mobile GPUs and irregular footprints.
 const edges=xy.map((a,i)=>({a,b:xy[(i+1)%xy.length],length:Math.hypot(a[0]-xy[(i+1)%xy.length][0],a[1]-xy[(i+1)%xy.length][1])})).sort((a,b)=>b.length-a.length).slice(0,4);
 for(let floor=0;floor<floors;floor++) {
  const bottom=floor*height/floors+0.9,top=Math.min(height-0.5,bottom+1.55);
  if(top<=bottom)continue;
  for(const {a,b,length} of edges) {
   if(length<3)continue;
   const count=Math.min(type==="house"?3:5,Math.max(1,Math.floor(length/3)));
   for(let j=0;j<count;j++) {
    const t=(j+0.5)/count,half=Math.min(0.8/length,0.32/count);
    const p=[a[0]+(b[0]-a[0])*(t-half),a[1]+(b[1]-a[1])*(t-half)];
    const q=[a[0]+(b[0]-a[0])*(t+half),a[1]+(b[1]-a[1])*(t+half)];
    const dx=-(b[1]-a[1])/length*0.10,dy=(b[0]-a[0])/length*0.10;
    add([[p[0]-dx,p[1]-dy],[q[0]-dx,q[1]-dy],[q[0]+dx,q[1]+dy],[p[0]+dx,p[1]+dy]],bottom,top,preset.glass);
   }
  }
  if(type==="apartment"||type==="office")add(scaled(1.008),(floor+1)*height/floors-0.18,(floor+1)*height/floors,"#e7e6d8");
 }
 if(preset.roof==="gable") {
  const edge=edges[0],ux=(edge.b[0]-edge.a[0])/edge.length,uy=(edge.b[1]-edge.a[1])/edge.length;
  for(let i=0;i<6;i++) {
   const scale=1-i/6;
   const ring=xy.map(p=>{const along=p[0]*ux+p[1]*uy,cross=(-p[0]*uy+p[1]*ux)*scale;return [along*ux-cross*uy,along*uy+cross*ux];});
   add(ring,height+i*0.42,height+(i+1)*0.42,preset.cap);
  }
 } else if(preset.roof==="tower") {
  add(scaled(preset.setback),height,height+height*0.25,preset.wall);
  add(scaled(preset.setback+0.02),height+height*0.25,height+height*0.25+0.3,preset.cap);
 } else if(preset.roof==="terrace") {
  add(scaled(0.72),height,height+2.5,preset.wall);add(scaled(0.74),height+2.5,height+2.8,preset.cap);
  add(scaled(0.4),height+2.8,height+3.3,"#91a694");
 } else if(preset.roof==="sawtooth") {
  for(let i=0;i<3;i++) add(box((i-1)*3,0,2,5),height,height+1.5+i*0.2,preset.glass);
 } else { add(scaled(0.25),height,height+1.4,"#a1ada9"); }
 if(type==="shop") {const e=edges[0];add([e.a,e.b,[e.b[0]*1.10,e.b[1]*1.10],[e.a[0]*1.10,e.a[1]*1.10]],2.6,2.95,preset.cap);}
 return {type:"FeatureCollection",features};
}

