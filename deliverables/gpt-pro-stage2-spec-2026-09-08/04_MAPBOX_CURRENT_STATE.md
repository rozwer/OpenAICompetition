# Mapbox GL JS試作の現在地

採取日：2026-09-08。根拠は同梱ソースの静的読解、依存定義、限定したビルド/画面確認です。現在の設定を示すもので、推奨最終値や性能測定結果ではありません。機械可読値は`MAPBOX_SETTINGS.json`。以下の行番号は同梱`project/prototypes/mapbox-character/`を基準とします。

## 依存と起動

| 項目 | 現在の値 |
|---|---|
| 地図 | mapbox-gl 3.30.0、Mapbox Standard |
| 人物 | three 0.180.0、GLTFLoader、GLB |
| 開発/ビルド | Vite 7.3.6、vanilla JavaScriptとCSS、bun.lockあり |
| 確認環境 | Node.js v22.22.1、Bun 1.3.14 |
| トークン | `VITE_MAPBOX_ACCESS_TOKEN`を環境変数から取得。値なし/`pk.`で始まらない場合は案内を表示し地図を開始しない |
| 初期地域 | index.htmlの選択値nagoya（名古屋・栄） |

再実行は試作ディレクトリで`bun install --frozen-lockfile`、`.env.example`を`.env.local`へコピーして自身のMapbox公開トークンを設定し、`bun run dev`。WebブラウザでローカルURLを開きます。地図にはネット接続と有効なMapbox設定が必要です。GLBは同梱済みで、表示にBlenderの再出力は不要です。公開トークンはクライアント配信を前提とするため、対象URL・権限・利用量の設定は利用する環境で決めます。キーの値はこのZIPに含みません。

## Mapコンストラクターと地図表示

根拠：`src/main.js:69`、`:93`、`:98`。

| 項目 | 値 |
|---|---|
| style | `mapbox://styles/mapbox/standard` |
| theme / lightPreset | default / day |
| center [経度,緯度] | [136.9085,35.1707] |
| zoom / pitch / bearing | 17.5 / 64 / -24 |
| minZoom / maxZoom / maxPitch | 14.5 / 20 / 68 |
| maxBounds | 選択地域中心の経度±0.014、緯度±0.01 |
| projection / world copies | mercator / false |
| workerCount | 1 |
| antialias / fadeDuration | false / 0 |
| refreshExpiredTiles / maxTileCacheSize | false / 12 |
| respectPrefersReducedMotion | true |
| 選択色 / 強調色 | #6fa98e / #a9d4c2 |
| 3D objects/buildings/landmarks | 初期値true |
| 3D facades/trees | false |
| Landmark icons | 初期値true |
| POI/place/road/transit labels | false |
| Pedestrian roads | false |

`src/style.css:7`は地図要素を幅/高さ80%にして1.25倍へ拡大します。JS側も`MAP_RENDER_SCALE=0.8`で人物マーカー寸法を調整します。ピクセル密度や配置への影響は対象端末で要確認です。

地域は東京駅、新宿、山下公園、みなとみらい、名古屋、箱根、道頓堀の7箇所。全座標、bearing、zoom、過去のcoverage説明はJSONに収録しています。coverageはソース内の説明文字列で、今回の全地域再検証や提供元の網羅率ではありません。

## ズームによるLOD

根拠：`src/main.js:222`、`:341`、`:498`。

| ズーム | モード | pitch目標 | 3D建物 | 3Dランドマーク | 人物 | 配置アイコン |
|---|---|---:|---|---|---|---|
| 17以上 | 詳細3D | 64 | 表示 | 表示 | 表示 | 表示 |
| 15.2以上17未満 | 広域3D | 48 | 表示 | 表示 | 16.8以上 | 16.2以上 |
| 15.2未満 | 俯瞰 | 0 | 表示設定のまま | 非表示 | 非表示 | 非表示 |

`applyLod`が更新するMapbox設定は建物とランドマークで、人物/配置アイコンはDOM表示を変えます。LOD戻り値にあるobjects/facades/trees等がすべて動的適用されるわけではありません。表の配置アイコンは独自DOM Markerで、Mapboxの`showLandmarkIcons`とは別です。俯瞰はpitch=0であり、標準建物を全て無効にするモードではありません。

pitchはzoomendで差が0.5以上なら320msのeaseToで追従。地域変更はpitch64・900msのflyTo、現在地ボタンはpitch64・600msのeaseToのため、遷移中や操作によって表の目標と一時的に異なり得ます。現在地ボタンの実体は定義済み地域中心への復帰で、端末位置取得ではありません。

## 光と人物

根拠：`src/main.js:137`、`:312`、`:377`、`:410`。

Mapboxの環境光は白・強度0.72、方向光は白・強度0.38、方向[200,45]、影なしです。人物側は別のThree.jsシーンで、半球光2.2、方向光3.2。透明背景、antialias=false、powerPreference=low-power、DPR=1、64×112pxのcanvasをDOM Markerへ載せます。地図の3D custom layerではありません。人物カメラは透視投影FOV30、near0.01/far100。マーカーはviewport向き、足元アンカー。ズームでマーカー倍率を0.78〜1.18に制限します。

人物材質は橙#ff6b35、emissive #4b1000・強度0.55、roughness0.72、metalness0。足元リングは#ffcf56です。モデルはGeorge BlackwellのSuper Basic Human Model w/ Animations由来。Idle/Run/Walkを含むGLBと編集用.blend、出典/CC BY 4.0表記、出力と検証スクリプトを同梱しています。詳細はモデルのATTRIBUTION.mdを参照してください。

歩行はWalkアニメーションをその場で再生し、位置は地域中心に固定。目標上限12fps、地図移動中や非表示時は描画を抑え、停止/再生ボタンがあります。これは省電力や実測12fpsの達成を示しません。UIのfps表示も人物canvas用で、地図全体のfpsと同義ではありません。

## 屋根上アイコンとデモデータ

根拠：`src/main.js:166`、`:195`、`:257`、`:431`。

Mapbox Standardのbuildings featuresetへのinteractionで建物を選び、正のheight属性がある場合にMarker.setAltitude(height)で配置します。位置は座標群の外接矩形中心（polygonの面積重心ではない）、取得できない場合はクリック位置です。思い出♡、AIおすすめ✦、気になる◇の3種をCSSで表現し、接続線と標的リングを描きます。最大3個、超えると最古を削除、occludedOpacity=0.34。地域変更で消去し、永続保存はありません。種類名にAIとありますが、AI推薦による自動生成ではありません。

描かれる軌跡は地域中心から固定オフセットで作る5点の線、記憶は固定3点。GPS履歴・ユーザー保存・経路APIの結果ではありません。

## 操作できる範囲と追加が必要な範囲

動くものはMapboxの操作、地域切替、LOD、人物の歩行/停止、建物への手動アイコン配置、固定線/記憶点の表示です。AI入力風の表示はspanでAIリクエストはなく、気分や下部ナビには機能の接続がありません。DB、サーバーAPI、認証、実GPS、成長判定、対話、推薦、共有、乗換/定期券、ストア、3プラグインは未実装です。

画面画像は`screenshots/current-nagoya.png`です。1280×720のデスクトップ上で名古屋を表示した1枚で、全地域・スマホ・シミュレーターの合格証跡ではありません。

`src/style.css:8`はMapboxの左右下部controlを非表示にします。READMEの出典表示説明と矛盾するため、仕様化では出典表示を含めて利用条件を一次情報で確認し、修正対象としてください。原文を保つため今回の梱包ではソースを変更していません。
