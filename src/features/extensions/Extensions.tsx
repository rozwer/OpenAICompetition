"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Camera, Check, ChevronRight, Coffee, Compass, Grid2X2, MapPin, Mountain, Plus, Radar, Route, Search, Sparkles, Sun, Trees, Utensils, X } from "lucide-react";

const categories = ["すべて", "カフェ", "観光", "グルメ", "写真", "自然"];
const icons = [Grid2X2, Coffee, Compass, Utensils, Camera, Trees];
const catalog = [
  { name: "カフェコンシェルジュ", category: "カフェ", description: "気分にぴったりのカフェを見つける。お気に入りの一杯を、街の中で。", icon: Coffee, tone: "cafe" },
  { name: "夕日スポットマップ", category: "自然", description: "散歩の終わりに、特別な景色を。夕日を楽しむ場所を地図に。", icon: Mountain, tone: "sunset" },
  { name: "写真スポットレコメンド", category: "写真", description: "いつもの街の、新しい表情。撮りたい風景を集めよう。", icon: Camera, tone: "photo" },
  { name: "AIおでかけルート", category: "観光", description: "気分に合わせた散歩ルート。時間やテーマから、寄り道を楽しもう。", icon: Route, tone: "route" },
  { name: "おでかけ天気アシスタント", category: "自然", description: "散歩の前に、空の様子をチェック。服装や持ち物のヒントも。", icon: Sun, tone: "weather" },
  { name: "街のグルメ手帖", category: "グルメ", description: "食べたいものと出会ったお店を、自分だけの地図に集めよう。", icon: Utensils, tone: "cafe" },
];

export function Extensions({ onDiagnosis, onBack }: { onDiagnosis: () => void; onBack: () => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("すべて");
  const [panel, setPanel] = useState<string | null>(null);
  const [idea, setIdea] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const filtered = catalog.filter(item => (category === "すべて" || item.category === category) && `${item.name}${item.description}`.includes(query.trim()));
  const selected = catalog.find(item => item.name === panel);
  function openCreator() {
    try { setIdea(localStorage.getItem("grow-map-extension-idea") ?? ""); } catch { /* Storage may be unavailable. */ }
    setSaved(false); setError(""); setPanel("create");
  }
  return <section className="grow-market" aria-label="アプリを育てる">
    <div className="grow-toolbar"><button onClick={onBack}><ArrowLeft size={19} />戻る</button><button onClick={() => setPanel("help")}><BookOpen size={18} />はじめての方へ</button></div>
    <header className="grow-hero">
      <div className="grow-hero-copy"><div className="grow-kicker">GROW WITH CODEX</div><h1>アプリを育てる。</h1><p>あなたの「やりたい」を、<br />みんなのアイデアとAIの力で。<br />地図は、使うほど育っていく。</p><button className="grow-create" onClick={openCreator}><Plus size={22} />自分で機能を作ってみる<ArrowRight size={20} /></button></div>
      <div className="grow-art" aria-hidden="true"><div className="grow-tile tile-back"><Route /></div><div className="grow-tile tile-map"><MapPin /></div><div className="grow-tile tile-camera"><Camera /></div><div className="grow-tile tile-spark"><Sparkles /></div><span>つくる。<br />見つける。<br />広がっていく。</span></div>
    </header>
    <label className="grow-search"><Search /><input aria-label="機能を検索" placeholder="機能を検索（例：カフェ、写真、ルート…）" value={query} onChange={event => setQuery(event.target.value)} /></label>
    <div className="grow-categories" aria-label="機能のカテゴリ">{categories.map((name, index) => { const Icon = icons[index]; return <button key={name} aria-pressed={category === name} onClick={() => setCategory(name)}><Icon size={20} />{name}</button>; })}</div>
    <div className="grow-section-title"><h2>注目のアイデア</h2><span>機能のサンプル</span></div>
    <div className="grow-featured">{filtered.slice(0, 3).map(item => <button key={item.name} className="grow-feature-card" onClick={() => setPanel(item.name)}><div className={`grow-cover ${item.tone}`}><item.icon size={42} /><span>{item.category}</span></div><div className="grow-card-copy"><h3>{item.name}</h3><p>{item.description}</p><span>アイデアを見る<ChevronRight size={17} /></span></div></button>)}</div>
    {!filtered.length && <p className="grow-empty">該当するアイデアがありません。別の言葉で探してみてください。</p>}
    <div className="grow-section-title"><h2>こんな機能を育てよう</h2><span>{filtered.length} 件</span></div>
    <div className="grow-list">{filtered.map(item => <button key={item.name} className="grow-list-item" onClick={() => setPanel(item.name)}><span className={`grow-list-icon ${item.tone}`}><item.icon /></span><span className="grow-list-copy"><strong>{item.name}</strong><small>{item.description}</small></span><ChevronRight size={18} /></button>)}</div>
    <button className="grow-diagnosis" aria-label="タイプ診断" onClick={onDiagnosis}><Radar /><span><strong>自分を知る、タイプ診断</strong><small>滞在データとAIとの会話から、好みを見つける</small></span><ChevronRight /></button>
    {panel && <div className="grow-modal-backdrop" onClick={() => setPanel(null)}><section className="grow-dialog" role="dialog" aria-modal="true" aria-label={panel === "create" ? "機能のアイデアを作る" : panel === "help" ? "はじめての方へ" : panel} onClick={event => event.stopPropagation()} onKeyDown={event => { if (event.key === "Escape") setPanel(null); }}><button autoFocus className="grow-close" aria-label="閉じる" onClick={() => setPanel(null)}><X /></button><Sparkles className="grow-dialog-icon" />
      {panel === "create" ? <><h2>どんな機能を作ろう？</h2><p>便利にしたいことも、ちょっと面白いアイデアも。あなたの言葉で教えてください。</p><textarea aria-label="作りたい機能" placeholder="例：歩いた場所を自分の領地にする陣取りゲームを作りたい" value={idea} onChange={event => { setIdea(event.target.value); setSaved(false); }} /><p className="grow-note">今はアイデアの下書きを保存できます。AIによる機能生成は準備中です。下書きはこのブラウザに保存されます。</p><button className="grow-create" disabled={!idea.trim()} onClick={() => { try { localStorage.setItem("grow-map-extension-idea", idea); setSaved(true); setError(""); } catch { setError("保存できませんでした。ブラウザの保存設定をご確認ください。"); } }}>{saved ? <Check size={18} /> : <Plus size={18} />}{saved ? "下書きを保存しました" : "アイデアを下書き保存"}</button><span role="status">{error || (saved ? "このブラウザに保存しました" : "")}</span></> : panel === "help" ? <><h2>あなたのアイデアで、地図を育てる。</h2><p>欲しい機能を言葉にして、自分だけの地図を作る場所です。</p><ol><li>作りたい機能を考える</li><li>AIと一緒に作って、試す</li><li>使いながら、もっと育てる</li></ol><p className="grow-note">現在は画面と下書き保存をお試しいただけます。一覧はサンプルで、機能の生成・追加・共有は準備中です。</p><button className="grow-create" onClick={openCreator}>アイデアを書いてみる<ArrowRight size={18} /></button></> : <><h2>{selected?.name}</h2><p>{selected?.description}</p><p className="grow-note">これは機能のアイデアサンプルです。追加できる機能としての提供は準備中です。</p><button className="grow-create" onClick={() => { setIdea(`${selected?.name}のような機能を作りたい。`); setSaved(false); setPanel("create"); }}>このアイデアから考える<ArrowRight size={18} /></button></>}
    </section></div>}
  </section>;
}
