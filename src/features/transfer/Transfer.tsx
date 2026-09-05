"use client";
import { useState } from "react";
import type { FeatureContext } from "../../contracts";
import type { RouteProposal } from "../../contracts/routes";
import { api } from "../../client/api";
export function Transfer({ snapshot, places, selected, refresh, onShowMap }: FeatureContext & {onShowMap:()=>void}) {
 const [start,setStart]=useState("motomachi"),[end,setEnd]=useState("park"),[via,setVia]=useState<string[]>([]);
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const [result,setResult]=useState<RouteProposal | undefined>(snapshot.route);
 async function generate() {
  setBusy(true);setError("");
  try { const route=await api<RouteProposal>("route",{start,end,via,placeId:selected?.id??null});setResult(route);await refresh(); }
  catch(e){setError((e as Error).message);} finally{setBusy(false);}
 }
 return <section className="feature-panel route-panel">
  <div className="eyebrow">A WALK INSPIRED BY YOU</div><h2>会話から、次の散歩へ。</h2>
  <p className="muted">AIが会話に合う立ち寄り先を選び、その場所を通る徒歩ルートを作ります。</p>
  <p className="route-context">参考にする会話：{selected?.name??"自分の地図全体"}</p>
  <label>出発地<select aria-label="出発地" value={start} onChange={e=>{setStart(e.target.value);setVia(v=>v.filter(id=>id!==e.target.value));}} disabled={busy}><option value="gps">最後に取得したGPS位置（5分以内）</option>{places.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
  <label>目的地<select aria-label="目的地" value={end} onChange={e=>{setEnd(e.target.value);setVia(v=>v.filter(id=>id!==e.target.value));}} disabled={busy}>{places.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
  <fieldset disabled={busy}><legend>必ず通りたい場所（任意・選んだ順）</legend>{places.filter(p=>p.id!==start&&p.id!==end).map(p=><label className="route-via" key={p.id}><input type="checkbox" checked={via.includes(p.id)} onChange={e=>setVia(v=>e.target.checked?[...v,p.id]:v.filter(id=>id!==p.id))}/>{p.name}{via.includes(p.id)&&` (${via.indexOf(p.id)+1})`}</label>)}</fieldset>
  <button className="primary" disabled={busy} onClick={()=>void generate()}>{busy?"AIの提案・徒歩経路を作成中…":"会話から徒歩ルートを作る"}</button>
  <p className="diagnosis-note">現在の候補は横浜の登録済み{places.length}地点です。営業時間・入口の通行可否は未確認です。</p>
  {error&&<p role="alert" className="error">{error}</p>}
  {result&&<article className="route-result">
   <h3>{result.status==="ready"?"おすすめの徒歩ルート":"立ち寄り先の提案"}</h3>
   <p>{result.explanation}</p>
   <ol><li>{result.start.name}（出発）</li>{result.stops.map(s=><li key={s.place.id}><b>{s.place.name}</b><p>{s.reason}</p></li>)}<li>{result.end.name}（到着）</li></ol>
   {result.route&&result.status==="ready"?<><strong>{(result.route.distance/1000).toFixed(1)} km · 徒歩 約{Math.ceil(result.route.duration/60)}分</strong><p className="muted">立ち寄り時間は含みません。指定地点の近くの歩道へ接続します。</p><button onClick={onShowMap}>地図でルートを見る</button><small>経路：openrouteservice / © OpenStreetMap contributors</small></>:<p role="status" className="inline-note">{result.status==="needs-key"?"経由地の提案はできました。徒歩経路の取得にはサーバーのORS_API_KEY設定が必要です。":result.error} 道順はまだ作成されていません。</p>}
  </article>}
 </section>;
}
