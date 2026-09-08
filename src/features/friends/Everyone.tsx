"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, ArrowUpRight, Search, Layers, Sparkles, ChevronRight, Coffee, Users, MapPin, BookOpen } from "lucide-react";
import type { FriendLens, LensPlace, ComparisonInsight } from "../../contracts/everyone";
import { compareVisits } from "../../domain/everyone";
const LensMap=dynamic(()=>import("./LensMap").then(m=>m.LensMap),{ssr:false});
const asset=(path:string)=>`/images/everyone/${path}`;
type View="home"|"friend"|"compare"|"place";
export function Everyone({ friends, mine, places, invitations }: { friends:FriendLens[]; mine:FriendLens; places:LensPlace[]; invitations:React.ReactNode }) {
 const [view,setView]=useState<View>("home"),[friendId,setFriendId]=useState(friends[0]?.id),[search,setSearch]=useState(""),[filter,setFilter]=useState("common"),[area,setArea]=useState("すべて"),[lens,setLens]=useState(true),[placeId,setPlaceId]=useState(""),[backView,setBackView]=useState<View>("compare"),[insights,setInsights]=useState<Record<string,ComparisonInsight>>({}),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const friend=friends.find(f=>f.id===friendId)||friends[0];
 const comparison=compareVisits(mine.visits,friend.visits);
 const allAreas=["すべて",...new Set(places.map(p=>p.area))];
 const localMine=mine.visits.filter(v=>area==="すべて"||places.find(p=>p.id===v.placeId)?.area===area), localFriend=friend.visits.filter(v=>area==="すべて"||places.find(p=>p.id===v.placeId)?.area===area), localCompare=compareVisits(localMine,localFriend);
 const ids=view==="friend"?(lens?friend.visits:mine.visits).map(v=>v.placeId):filter==="common"?localCompare.common:filter==="mine"?localCompare.mine:localCompare.theirs;
 const shown=useMemo(()=>places.filter(p=>ids.includes(p.id)),[places,ids.join(",")]);
 const place=places.find(p=>p.id===placeId), own=mine.visits.find(v=>v.placeId===placeId), other=friend.visits.find(v=>v.placeId===placeId);
 function go(next:View){setView(next);setError("");document.querySelector(".app:has(.everyone-page) .side-panel")?.scrollTo({top:0});}
 function openPlace(id:string){setPlaceId(id);setBackView(view);go("place")}
 async function analyze(){const id=friend.id;setBusy(true);setError("");try{const response=await fetch("/api/everyone",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({friendId:id})});const result=await response.json();if(!response.ok)throw Error(result.error);setInsights(old=>({...old,[id]:result}));}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 const nameOf=(id:string)=>places.find(p=>p.id===id)?.name||id;
 const cards=(entries:typeof friend.visits)=>entries.map(v=>{const p=places.find(p=>p.id===v.placeId);return p&&<button key={p.id} className="lens-place-row" onClick={()=>openPlace(p.id)}><img src={asset(`photos/${p.photo}`)} alt=""/><span><strong>{p.name}</strong><small>{v.count} 回訪問 · {p.category}</small><span className="lens-meaning">「{v.meaning}」</span></span><ChevronRight size={18}/></button>});
 return <section className="everyone-page" aria-label="みんなの地図">
  <div className="everyone-top"><button onClick={()=>go(view==="place"?backView:view==="compare"?"friend":"home")} disabled={view==="home"} aria-label="みんなの地図で戻る"><ArrowLeft size={21}/></button><h1>{view==="home"?"みんなの地図":view==="friend"?`${friend.name}の地図`:view==="compare"?`あなた × ${friend.name}`:"同じ場所、違う意味"}</h1><Layers size={22}/></div>
  <p className="everyone-demo">体験デモ · 人物・訪問・意味づけ・写真はサンプルです</p>
  {view==="home"?<>
   <div className="everyone-lead"><span>ANOTHER PAIR OF EYES</span><h2>誰かの好きで、<br/>街が少し広くなる。</h2><p>友達の目を借りて、いつもの街を歩こう。</p></div>
   <label className="everyone-search"><Search size={19}/><input aria-label="友人の地図を検索" placeholder="名前・街・好きなもので探す" value={search} onChange={e=>setSearch(e.target.value)}/></label>
   <h2 className="everyone-section-title">友達の育てる地図</h2>
   <div className="everyone-friends">{friends.filter(f=>`${f.name}${f.areas}${f.subtitle}`.toLowerCase().includes(search.toLowerCase())).map(f=><article className="lens-friend-card" key={f.id}><div className="lens-person"><img src={asset(`avatars/${f.avatar}`)} alt=""/><div><h3>{f.name}</h3><p>{f.subtitle}</p><small><MapPin size={12}/>{f.areas}</small></div></div><img className="lens-preview" src={asset(`maps/${f.preview}`)} alt={`${f.name}の地図のイメージ`}/><div className="lens-card-bottom"><span>{f.visits.length}か所の好きが育っています</span><p>最近「{f.recent}」</p><button onClick={()=>{setFriendId(f.id);setLens(true);setArea("すべて");setFilter("common");go("friend")}}>地図を訪れる <ArrowUpRight size={17}/></button></div></article>)}</div>
   {!friends.some(f=>`${f.name}${f.areas}${f.subtitle}`.toLowerCase().includes(search.toLowerCase()))&&<p role="status">該当する友達の地図はありません。</p>}
   <details className="everyone-invitations"><summary>実際の友人を追加する</summary><p>現在の比較はサンプル限定です。招待だけでは個人の訪問記録を共有しません。</p>{invitations}</details>
  </>:view==="friend"?<>
   <div className="lens-person lens-profile"><img src={asset(`avatars/${friend.avatar}`)} alt=""/><div><h2>{friend.name}’s Map</h2><p>{friend.subtitle}</p><small>{friend.areas}</small></div></div>
   <button className="lens-toggle" aria-pressed={lens} onClick={()=>setLens(!lens)}><Layers size={18}/>{lens?`${friend.name} Lens ON`:"あなたのレンズ"}<span>{lens?"ON":"OFF"}</span></button>
   <LensMap places={shown} onSelect={openPlace}/>
   <div className="lens-note">{lens?`${friend.name}にとっての街。場所ごとの意味を、下の一覧からのぞいてみましょう。`:"同じ街を、あなたのサンプル記録で表示しています。"}</div>
   <button className="everyone-primary" onClick={()=>{setFilter("common");go("compare")}}><Users size={19}/> 自分の地図と比べる <ChevronRight size={18}/></button>
   <h2 className="everyone-section-title">{lens?friend.name:"あなた"}の場所</h2>{cards(lens?friend.visits:mine.visits)}
  </>:view==="compare"?<>
   <div className="lens-overlap"><div className="lens-ring" style={{background:`conic-gradient(#438774 ${localCompare.overlap}%,#e7eeea 0)`}}><b>{localCompare.overlap}<small>%</small></b></div><div><strong>訪問先の重なり度</strong><p>{area} · 共通 {localCompare.common.length}か所</p><small>共通の場所 ÷ どちらかが訪れた場所</small></div></div>
   <div className="lens-areas" aria-label="比較するエリア">{allAreas.map(a=><button key={a} aria-pressed={area===a} onClick={()=>setArea(a)}>{a}</button>)}</div>
   <div className="lens-tabs" role="tablist" aria-label="地図の比較">{[["common","共通"],["mine","あなたのみ"],["theirs",`${friend.name}のみ`]].map(([id,label])=><button role="tab" aria-selected={filter===id} key={id} onClick={()=>setFilter(id)}>{label}</button>)}</div>
   <LensMap places={shown} onSelect={openPlace}/>
   {!shown.length&&<p className="lens-note">この条件に該当する場所はありません。</p>}
   <div className="lens-selected-places">{shown.map(p=><button key={p.id} onClick={()=>openPlace(p.id)}>{p.name}<ChevronRight size={15}/></button>)}</div>
   <div className="lens-insights"><h2>ふたりの街から見えること</h2><article><Coffee/><div><h3>共通点</h3><p>{comparison.common.length?`${comparison.common.map(nameOf).join("、")}を二人とも訪れています。`:"まだ共通の訪問先はありません。"}</p></div></article><article><ArrowUpRight/><div><h3>違うところ</h3><p>あなただけの訪問先は{comparison.mine.length}か所、{friend.name}だけの訪問先は{comparison.theirs.length}か所。違う寄り道に、新しい発見がありそうです。</p></div></article><button className="everyone-primary" disabled={busy} onClick={()=>void analyze()}><Sparkles size={18}/>{busy?"AIが読み解いています…":"AIで共通点と違いを読み解く"}</button><small>ローカルCodexへサンプルの集計だけを送信します。</small>{error&&<p role="alert">{error}</p>}{insights[friend.id]&&<div className="lens-ai-result"><h3>AIの解釈</h3><p>{insights[friend.id].common}</p><p>{insights[friend.id].difference}</p><p>{insights[friend.id].discovery}</p></div>}</div>
   <h2 className="everyone-section-title">同じ場所、違う使い方</h2>{cards(friend.visits.filter(v=>comparison.common.includes(v.placeId)))}
  </>:place?<>
   <img className="lens-place-hero" src={asset(`photos/${place.photo}`)} alt="場所のイメージ（サンプル）"/><div className="lens-place-title"><small>{place.area} · {place.category}</small><h2>{place.name}</h2><p>{own&&other?"二人とも訪れる場所":own?"あなたが訪れる場所":`${friend.name}が訪れる場所`}</p></div>
   <div className="lens-meaning-columns">{[{person:mine,visit:own},{person:friend,visit:other}].map(({person,visit})=><article key={person.id}><img src={asset(`avatars/${person.avatar}`)} alt=""/><h3>{person.name}</h3>{visit?<><b>{visit.count}<small> 回訪問</small></b><span className="lens-average">平均 {visit.minutes}分</span><p>{visit.context}</p><blockquote>「{visit.meaning}」</blockquote></>:<p>訪問記録はありません。</p>}</article>)}</div>
   <div className="lens-note"><BookOpen size={22}/>{own&&other?`同じ場所でも、過ごし方はそれぞれ。平均滞在時間には${Math.abs(own.minutes-other.minutes)}分の違いがあります。`:"まだ知らない場所が、相手の地図にはあるかもしれません。"}</div><button className="everyone-primary" onClick={()=>go("compare")}>ふたりの地図へ <ChevronRight size={18}/></button>
  </>:null}
 </section>;
}
