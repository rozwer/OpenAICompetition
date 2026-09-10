# 地図の成長・人物・発見・OpenUAS

[もやもやした候補から街が広がる](MIST_EXPLORATION.md)を中核の追加仕様とする。未形成の探索候補と既存の成長形を分け、本人の訪問と体験によって形が育つ。受領UIは[対応表](../ui/README.md)を参照。

## 1. 地図は背景ではなく意味の表示面

現実の位置/建物/階と、自分がそこで得た意味を同じID参照で重ねる。全画面を3Dゲームにしない。地図の操作性、2Dへの復帰、相手レンズの比較、根拠へのアクセスを保つ。

**別の軸**：dimension=2D/3D、lens=現実/自分/相手、time=現在/履歴、position=現在地/Replay。相手の視点へ切り替えても次元を変えず、Replayは現在地を上書きせず、原形へ戻しても体験は削除しない。

## 2. 造形を独立moduleとして魅力にする

MAP-001は地図host、MAP-002は用途の本体変化を、Meaning契約からそれぞれ独立実装する。INT-001で保存と結合する。独立したGLB制作担当は置かず、Three primitiveを小さく組み合わせる。書籍建物は左右に開いた板＋紙束、会話建物は丸い吹出し2つと尾、休息建物は段差と中庭。これらは建物全体のシルエットであり屋上バッジではない。

| 入力 | 処理 | 表示 | 変えてはいけないもの |
|---|---|---|---|
| 未訪問 | confirmed数0 | 2Dの輪郭/背景 | 近接だけで成長させない |
| confirmed訪問 | building/place別に集計 | 1つの建物が短く立ち上がる | 同じ建物の全階訪問にしない |
| purpose変更 | 有効用途→shape mapping | 本/吹出し/庭へ本体変更 | 原文/実建物shape |
| reasonだけ変更 | 意味説明/Profileを再計算 | 根拠cardと理由labelを更新 | 必ずshape変更する演出 |
| 再訪 | unique confirmed count→tier | 縁/植栽/灯り/装飾が5段階 | 「好き度」への変換 |
| explicit like | 本人申告として表示 | お気に入りmark | 回数と混同しない |
| 削除/場所訂正 | 有効visitsを再集計 | 元のcount/shapeへ | 飾りだけ古いまま残す |

複数用途は当日「今選択している用途」か最近本人が確認した用途を表示し、内訳をSheetへ。他の用途を消去しない。理想版は用途比率を複合体形状へ反映するが、記録件数の比率を嗜好比率と表現しない。

「最近本人が確認した用途」の時点はExperience.createdAtだけでは決めない。reasonだけの後日訂正は用途の選択時刻を進めず、purposeを本人が訂正した場合はその訂正時点を用途確認として扱う。原文やcreatedAtを書き換えて順序を合わせない。詳細はLRN-meaning-purpose-confirmed-at（リハーサルの履歴資料）を参照する。

## 3. 3D座標・depth・原形

MapLibreのcustom layerにThreeのcamera/scene/rendererを一つ作る。shared WebGL context、`renderingMode:'3d'`、`autoClear=false`、render前のstate resetという公式例の境界を使う。[S06] 採用版の`args.defaultProjectionData.mainMatrix`を利用する版では、古いmatrix引数形式と混ぜない。projectionはDayではMercator固定。

緯度経度をMercatorCoordinateへ変換し、`meterInMercatorCoordinateUnits()`でモデルのメートルを換算。地面基準、Y反転、rotationの順をfixture1棟で確認してから増やす。人物と建物は同じworldにあり、pan/zoom/rotationでスクリーンに張り付かない。吹出しの文章はDOM overlayでもよいが、建物本体と人物をDOMの擬似3Dにしない。

建物rootはgeometryに由来する位置、symbolicModelは別groupとして交換する。現実レンズでは実データのheightだけを使い、height unknownならflat footprintかpinへ戻す。仮定した10mを「実高さ」と表示しない。sample街区の物理形状もsampleと表示。

背景styleの既存fill-extrusionと自作モデルが二重になる場合は、対象layerを識別してsymbolic modeでは非表示にし、元のvisibility/filterをrestoreする。初期実装は淡色2D背景＋選択/成長対象だけの独自建物でよい。全市の複雑なmeshを生成しない。

concave polygonの単純centroidが外に出る場合があるため、内部anchor（polylabel等）または本人が選んだpointを使う。タイル分割geometryの安易なhashを世界で永続的なbuildingIdにしない。安定ID不明の対象はPlaceとsnapshot形状を明確に結ぶ。

## 4. 人物と移動・カメラ

人物モデルは灰白のhead/body/limbs。地理的高さが分からなければ地面基準とし階まで推測しない。headingが不明ならneutral headingで不明状態を保持。実際に動いた点または明示サンプル歩行の進行時だけ歩行animationを使う。

初期2Dはpitch0、3Dはpitch約50度、zoomは選択棟が分かる範囲。これはデザイン初期値で、測位精度の表現ではない。ユーザーがパンすると追従を止め、「現在地へ戻る」で再開する。2D/3D切替で選択場所・レンズ・採用ルートを保持し、個別camera状態へ戻れる。

ルート選択のためのpreview cameraと案内追従cameraを別にする。履歴Replayを停止しても現在地recordへ擬似点を書き込まない。軌跡gapは線を途切れさせ、記録のない道を実際に歩いたように補完しない。

## 5. 3Dの理想経路

FUT04ではPLATEAU等の外殻、入口、階段/EV/階別Placeを別sourceとして統合する。高度付き位置はfloorの真値とは限らないため、候補高度帯と本人確認を分ける。地下街/地上/上層の役割を別に記録し、俯瞰では縦方向の意味の違いを表示できる。

ランドマークが不足する場所だけBlender等でGLBを補完し、source/licenseと原形を保持。全都市の現実的な建築再現を当日の前提にしない。理想版では近傍の詳細、遠景の簡略、instancing、texture budgetを計測して最適化する。初期実装は対象を最大50棟程度に制限する目安だけ置き、省電力評価を必須にしない。

## 6. セレンディピティ：推薦と別の経路

普通の推薦は「今の目的に合う候補へ」。発見は「対象を別の知識から見て、知らなかった関心へ」。店舗を3件出しただけの推薦を発見と呼ばない。

`Anchor → Verified/confirmed feature → Bridge concept → New knowledge → Observation/learning action`

例は**架空の建築模型についての説明用知識**として扱う。雨よけの端の形を入口に「流れの逃げ道」に注目し、模型の面を傾けるとどこへ流れるかを考え、街の高低差を見る関心へつなぐ。このカードは対象の形という特徴が説明に働く。一方「この建物は○○だから相対性理論を学ぼう」のように入口を替えても説明が変わらない飛躍はreject。

固有場所の排水設計を図面なしに断言しない。Dayの知識カードは一般的な観察/幾何の推論としてreviewし、出典が要る事実は出典を伴う登録cardだけにする。実写真の特性は本人確認を挟む。AIの一般知識、写真からの推定、その場所の確認済み事実は違うbadge。

## 7. 発見の入力と判定

| field | 入力 | 判定 |
|---|---|---|
| anchor | place/building/photo/本人が選んだ物 | 場所名だけで個別構造を決めない |
| features | 本人確認済み特徴、登録知識、写真推定 | 推定は推定のまま |
| mode | curiosity / familiar / challenge | challengeは苦手分野も候補可 |
| receptive | 本人の今の受け入れ意思 | falseなら自発通知しない |
| available | 本人が指定した余裕、任意時間 | 単独で提案許可にはならない |
| banned/stopped | 禁止topic/全停止 | challengeより優先 |
| known | 本人が既知としたconceptIds | 原則再提示しない |
| seen/read | 表示/読了event | 既知や好きと同一視しない |

採択条件は①anchor featureがbridgeに必要、②着地knowledgeがそのbridgeを説明、③新しい概念が本人既知でない、④禁止に抵触しない、⑤短い観察/学習行動を提案できる、⑥固有事実の根拠が足りる、のチェック。研究由来の固定0.40/0.35/0.25重み、41問アンケート、80生成、常に認知的不一致を起こす条件は製品へ固定しない。

## 8. 発見の保存・表示・後続

初期実装は`generated/shown/read`を別timestampとし、`known/saved/interesting/not_now`を独立eventで保存。shownはカードが実際にviewportに入った時、readは詳細を開くか本人操作がある時の指標で、理解を保証する値ではない。新関心は「興味ありと回答した概念」として自分へ戻す。clickで「あなたは建築好き」としない。

任意共有は対象/一般知識/自分の感想をpreviewし、元の非公開写真や細かい位置はデフォルトで共有しない。発見カードを機能ストアの入力に使い「この対象の別の見方を出すカード」を作れる。

FUT08では画像理解、source retrieval、概念graph、多様性制御、明示opt-inの提案を追加。後日実際に調べた/観察した/関心が続いたかを任意feedbackで測る。即時クリック率、未知概念到達、興味変化、次の自主行動は別指標。効果未測定の「好奇心が何%上がる」とは言わない。

## 9. Area2Vec/OpenUASの自然な位置

**人の性格を推定するためではなく、別都市で似た役割を持つ地域を探す候補生成器として用いる。** 属性検索がDayのbaseline。FUT06で地域埋め込みを追加し、候補取得だけを置換する。制約・理由・最終行程の検証は共通のまま。

OpenUAS公開レコードは東京/名古屋を含む8都市の地域埋め込み、mesh_size、is_complemented等を説明している。50mセルに250mの情報を補完したflagを消して、精密な50m実測と扱わない。商用利用には問い合わせ条件の記載があるため、利用権の確認を別途残す。[S09]

導入の最短経路：対象都市の必要領域だけ正規化→`city/mesh/modelVersion/anchorVersion/timeRange/meshSize/isComplemented/vector`を保持→比較可能な共通空間を確認→cosine候補top-k→周辺の実POIまたはsample placeと紐付け→役割・営業時間・移動・階段などを検証→baselineとの差を記録する。都市ごとに独立学習したベクトルを、次元数が等しいだけで直接cosine比較しない。

Dayに数値vectorがなければ「OpenUAS未使用」と明示し、役割属性による移植を実演する。ダミーvectorを実研究データと称さない。横浜/箱根のcoverageを名古屋/東京と同じと仮定しない。過去の滞在パターンから現在の静かさ、営業、混雑、安全、個人の好みを直接決めない。

ユーザー研究の立体表現はFUT04後に、建物×高度帯の候補探索へ拡張できる。ただしfloor/屋内POIとの真値対応・coverage・少数データの不確実性を保持し、5時間に全研究モデルを移植する依存は作らない。


## v2.1契約との対応
表の説明語ではなくcontracts/domain.tsのMeaning/DiscoveryCard/DiscoveryEvent/AppContextDataを使用する。履歴・次元・レンズ・位置の独立性を維持する。形状materialはPOOL-001、知識カードはPOOL-003へ切り出し、造形担当の完了を待たず取得できる。

## 追加：人物とAI相棒の関係

現在地/Replayを示す人物は既存仕様を維持する。docs/spec/PET_COMPANION.mdのAI相棒は別のscreen overlayであり、地図上の人や建物をDOMの擬似3Dで代用するものではない。健康由来の距離案を本人が選んだときだけRouteInputへ適用し、健康記録から訪問・滞在・場所の意味を捏造しない。
