"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl, { type GeoJSONSource } from "maplibre-gl";
import type { LensPlace } from "../../contracts/everyone";
export function LensMap({ places, onSelect }: { places: LensPlace[]; onSelect: (id:string)=>void }) {
 const root=useRef<HTMLDivElement>(null), instance=useRef<maplibregl.Map|null>(null), [ready,setReady]=useState(false), [failed,setFailed]=useState(false), selection=useRef(onSelect);
 selection.current=onSelect;
 useEffect(()=>{
  if(!root.current)return;
  const map=new maplibregl.Map({container:root.current,center:[136.94,35.16],zoom:12,pitch:30,style:{version:8,sources:{roads:{type:"geojson",data:"/data/roads.geojson"},water:{type:"geojson",data:"/data/water.geojson"}},layers:[{id:"background",type:"background",paint:{"background-color":"#e7efdf"}},{id:"water",type:"fill",source:"water",paint:{"fill-color":"#b7dfe0"}},{id:"roads",type:"line",source:"roads",paint:{"line-color":"#fffdf4","line-width":3}}]},attributionControl:false});
  instance.current=map;
  map.addControl(new maplibregl.AttributionControl({compact:true,customAttribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'}));
  map.on("load",()=>{map.addSource("lens",{type:"geojson",data:{type:"FeatureCollection",features:[]}});map.addLayer({id:"lens",type:"circle",source:"lens",paint:{"circle-radius":12,"circle-color":"#397e6d","circle-stroke-color":"#fff","circle-stroke-width":4}});map.on("click","lens",e=>{const id=e.features?.[0]?.properties?.id;if(id)selection.current(id)});map.on("mouseenter","lens",()=>{map.getCanvas().style.cursor="pointer"});map.on("mouseleave","lens",()=>{map.getCanvas().style.cursor=""});setReady(true)});
  map.on("error",()=>setFailed(true));const observer=new ResizeObserver(()=>map.resize());observer.observe(root.current);
  return()=>{observer.disconnect();map.remove();instance.current=null};
 },[]);
 useEffect(()=>{const map=instance.current;if(!ready||!map)return;(map.getSource("lens") as GeoJSONSource).setData({type:"FeatureCollection",features:places.map(p=>({type:"Feature",properties:{id:p.id},geometry:{type:"Point",coordinates:[p.lng,p.lat]}}))});if(places.length){const bounds=new maplibregl.LngLatBounds();places.forEach(p=>bounds.extend([p.lng,p.lat]));map.fitBounds(bounds,{padding:50,maxZoom:15,duration:350})}},[ready,places]);
 return <div className="lens-map-wrap"><div className="lens-map" ref={root} aria-label="選択した人の場所を表示する地図" data-pin-count={places.length}/><span className="lens-map-caption">サンプルの場所 · 位置は目安</span>{failed&&<small className="lens-map-error">地図の一部を読み込めません。下の一覧から場所を選べます。</small>}</div>;
}
