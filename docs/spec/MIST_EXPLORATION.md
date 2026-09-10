# もやもやした候補から、自分の街が広がる

2026-09-09。ユーザーが合意した「候補をもやもやしたモデルで表示し、興味が向き、体験によって街が広がっていく」を実装する仕様。
画面・状態・保存・接続の正本であり、製品の実装完了を示すものではない。

## 1. 体験の核

地図上に、本人との関係がまだ定まっていない場所が、もやもやしたモデルとして現れる。
気になった人が場所と候補理由を確かめ、訪れ、体験を自分の言葉で残すと、その意味に沿った形へ育つ。
その体験が次の候補の起点になり、自分が意味を持って見られる街が広がっていく。

**もやもやは、本人にとっての意味が未確定であることを表す。**
地理の不明、通信中、立入禁止、未踏破率、AIの確信度を表さない。
既知の実在場所を使い、名称・住所・入口・出典・確認できる制約は最初のタップで読める。
情報を隠して訪問を強制したり、近づくほど正解の建物が開封される仕組みにはしない。

既存のVisit.status=candidateは、位置記録から得た「訪問した可能性」である。
今回のExplorationCandidateは「これから関係を持つかもしれない探索候補」であり、互いに変換しない。
見た、押した、近づいた、経路を選んだという操作だけではVisit、Experience、Meaningを作らない。

## 2. 画面と操作

配置は既存の「地図を育てる」の自分レンズ。2D/3Dの両方で同じ候補を扱う。
新しいタブを増やさない。「AIと街を探す」と「散歩を記録」の両モードから到達できる。
初回は短い凡例「まだ自分の意味がない、気になる場所」を表示する。

| 画面ID | 操作 | 保存結果・次の画面 |
|---|---|---|
| S-EXP-01 候補のある地図 | 自分レンズで探索候補を表示。モデルを押す、一覧から選ぶ | 選択は画面内だけ。S-EXP-02へ。閲覧を好き・訪問と保存しない |
| S-EXP-02 候補の中身 | 名称、実際の場所情報、候補理由、元の体験/意図、出典を読む | 「気になる」でdisposition=interested。「表示しない」でdismissed。「戻す」でunmarked |
| S-EXP-03 歩く前の確認 | 「ここまで歩く」で既存経路UIを開き、時間・距離・制約を確認 | placeIdを既存planRouteへ渡す。経路の選択は既存APIで保存 |
| S-EXP-04 体験から形になる | 既存記録UIで訪問を本人確認し、用途・体験を記録 | 正本のVisit/Experience/Meaningから造形を再計算。候補理由で用途を埋めない |
| S-EXP-05 次の街を見る | 保存した体験から「この体験の続きを見る」を押す | 元Experienceの版と候補集合を用いrefresh。新しい候補を同じ地図へ表示 |

起点となる体験がなくても、本人が明示した今の目的（Preference.currentIntent / preferredPurposes）から開始できる。
入力も有効な候補もなければ、候補ゼロのまま「気になることから探す」を示す。
人格や嗜好を創作して空の地図を埋めない。
新しい候補の生成は本人の探索操作で行う。地図の再描画やカメラ移動ごとにAIを起動しない。

## 3. モデルの表示規則

自分レンズでは、半透明の柔らかな塊・途切れた輪郭・内側の淡い形を使う。
本、会話、庭という完成形や予想用途を、候補の時点で正解として見せない。基本形は中立的な雲状モデルとする。
色・大きさ・明るさを推薦順位、好き度、AIの確信度に連動させない。
候補理由はタップ後の文章で伝え、雰囲気だけから根拠を読み取らせない。

| 状態 | 地図での表現 | 意味 |
|---|---|---|
| currentかつunmarked | 中立のもやもやモデル | 表示できる探索候補 |
| currentかつinterested | 同じモデルに輪郭の印 | 本人が「気になる」と明示した |
| 訪問確認済み・体験の用途未記録 | 既存の低い成長形、記録への入口 | 訪問は確認したが意味の記録はまだ少ない |
| 有効な本人確認訪問と用途を持つ体験あり | 既存FormsPortの確定Meaningによる本体形 | 本人が残した意味。予測の答え合わせではない |
| dismissed / stale / withdrawn | 通常の地図上には出さない | 非表示、入力版の変更、出典・許可の失効 |

既に本人の意味を持つ場所には、別の候補理由があっても、もやで本体を覆わない。
同一placeの候補は一つのモデルにまとめ、詳細で複数の理由を切り替えられる。
一つの建物に複数placeがあるときは入口/階別の一覧を開き、建物全体の訪問を推定しない。

3Dでは地理的anchorに置き、pan/zoom/rotationでスクリーンに張り付かない。
モデルの仮の高さは象徴表現の寸法であり、実建物heightに書き戻さない。
位置が分かり建物geometryがない場合は地面に置く。位置自体が不明な候補は空間モデルにせず一覧へ退避する。
physicalレンズではもやを隠して実地図に戻り、peerレンズでは自分の非公開候補を出さない。
2Dは同じplaceの輪郭と候補印で表す。2D/3D切替で選択・関心・経路を失わない。

一画面は初期上限5place、選択候補を優先し残りは一覧で読める。件数競争の数値を地図に出さない。
道路・入口・地名・現在地・操作UIを隠さない。重なる場合は移動線を描かず集約する。
動きを抑える設定では静止輪郭となり、非表示でも一覧から同じ操作ができる。
スクリーンリーダーの名称は「探索候補、場所名、気になる設定」で、色・アニメーションだけで状態を区別しない。

## 4. 候補の根拠と生成境界

初期方式は、本人の確定した用途または明示目的と、出典付きPlace.roleTagsを対応させるrules方式。
既存CandidateSetの範囲から選び、同じ入力とpolicyVersionで候補と順序を再現できるようにする。
未知の特徴は補完しない。「庭を眺めた」から近くの全カフェに庭があるとは言えない。
ルールのrole対応表と版をEXP-001で用意し、対応しない自由文は候補ゼロで返すか、既存の承認済み解釈を利用する。

理由は「本人側の起点 → 共通する特徴/関心 → 候補側で確認できる事実」を持つ。
候補側の事実にはPlaceの版とsourceIdsを付ける。originもExperienceまたはPreferenceのidとrevisionを持つ。
出典がsampleならモデルと詳細と受入証拠にsampleを示す。
初期候補の並びは、明示した対応role、直線距離、placeIdで安定化する。直線距離を徒歩距離と呼ばない。

既存DiscoveryCardの検証済みbridgeを利用する追加実装も同じ理由契約に接続できる。
そのcardの参照・許可・入力版を検査し、ExecutionModeを保持する。AIが場所や事実を自由生成する口は作らない。
初期rulesの実装完了にライブAIは不要であり、rules結果をAI生成と表示しない。

## 5. 保存と状態の導出

新規保存はExplorationCandidateとExplorationPreferencesの2entity。DTOはcontracts/domain.ts、HTTPはcontracts/openapi.yaml、DDLはdb/schema.sqlを使用する。
候補はnamespace/actor/place/originKind/originIdの組を一意にし、refreshでidとdispositionを保つ。
originのrevisionを一意キーへ含めて非表示を解除しない。
同じplaceを「表示しない」にした場合、その本人の既存候補を全てdismissedとし、新しい起点からの候補にも同じplaceの抑制を引き継ぐ。明示的なrestoreだけで解除する。
非表示の正本はExplorationPreferences.dismissedPlaceIdsに置く。dismiss-place/restore-placeで候補更新と同じtransaction内に追加/除去し、設定PUTはこの配列を上書きしない。設定未作成なら内部で初期行を作る。
候補データに訪問済みや完成形を保存して正本と二重管理しない。

GET結果のExplorationItemは候補・Place参照・最新Meaning・relationを組み立てた投影である。
ExplorationItem.detailsは、住所・入口をKnownText（known / unknown）で返し、表示に使ったSource行を含む。
knownの住所・入口は1件以上のsourceIdを必須とし、sourceIdだけや座標・levelLabelから表示文を作らない。
既存Placeとの互換性のためPlace.address / entranceは任意だが、探索投影では欠落をunknownとして明示する。
候補理由、Place provenance、住所・入口が参照するSourceを現在のnamespaceで全件解決できない場合はSTALE_INPUTとし、古い候補理由を返さない。
Sourceのname、provider、利用可能なurl/license、sourceModeをそのまま返し、sampleをliveへ読み替えない。
relationはunformed / visited-unrecorded / formed。formedは同じ本人・placeの有効なconfirmed Visitに結び付くactive Experienceに本人入力または承認済みpurposeがある場合だけ成立する。
入力した記録が訪問未確認なら、訪問を伴う成長形への遷移を保留する。
元から別の有効記録があれば、そのMeaningを保つ。候補をdismissしても既存の成長を消さない。

訂正・削除・訪問取消後は最新の正本からrelationとMeaningを再計算する。
別の有効記録が残るならformedのまま、訪問だけならvisited-unrecorded、訪問もなく有効候補があればunformedへ戻る。候補も無効なら非表示。
再表示は保存状態の復元であり「新発見」の演出を毎回再生しない。

## 6. APIと更新の整合性

| operationId | 用途 |
|---|---|
| refreshExplorationCandidates | 本人のCandidateSetと起点の版から候補をupsert。opIdで冪等 |
| listExplorationCandidates | 本人の指定範囲・非表示条件に沿う候補投影を取得。最大100、cursorあり |
| getExplorationCandidate | 詳細・候補理由・正本由来のrelationを取得 |
| respondExplorationCandidate | interested / dismiss-place / restore-place。expectedRevisionを検査 |
| getExplorationPreferences | 未作成はnull（文書の初期値を使う） |
| putExplorationPreferences | 表示on/offとmotionの保存。未作成時だけexpectedRevision=0 |

refreshはUIから任意の候補文・形・確信度を受け取らない。
同一namespaceでも他actorの候補集合・起点・候補にはアクセスできない。
各レスポンスで起点、Place、関連source、DiscoveryCard、設定、許可の有効性を再検査する。
無効な詳細は説明文を返さず404/409とし、キャッシュも失効する。古い理由をstaleラベルだけで読み続けられる状態にしない。
同時refreshでは版を読み直し、古い計算結果を新しい起点へ適用しない。expectedRevision競合は409。
冪等再送でも現在のアクセス権・入力の失効を先に検査し、保存済み応答から削除した原文を復活させない。

respondのitemsは変更後の有効候補を最大100件返す。残りはlistのcursorで取得し、変更/失効通知は全影響範囲を対象にする。
通常取得はread-only投影。入力の訂正/削除を処理する既存mutationとgetChangesから投影を失効し、次の読取りで古い説明を除外する。
旧mutation実装を改変できない期間も、読取り時検査を省かない。削除対象の原文引用は候補・dedup応答にも残さず除去する。
初期は非公開。既存export/共有bundleに候補理由や本人の起点を自動追加しない。
削除で理由を消す場合も、本人が設定した場所単位の非表示は残す。非表示の正本はExplorationPreferences.dismissedPlaceIdsとし、候補の派生行と別に保存する。

経路への引渡しはplaceIdだけ。既存planRouteで通行可能性・交通手段・hard制約を検査する。
ルート未確認は「経路未確認」と表示し、もやへ直線で歩行案内しない。
候補から記録と経路を開く接続は、同じExplorationItemのcandidate.placeIdとplace.idが一致することを検査し、その1値をrecord-createとroutes.planへ渡す。
記録後refreshは保存済みIDからgetExperienceとgetCandidateSetを再取得し、その応答のrevisionを使う。画面が保持していた旧revisionや候補理由をpurpose/reasonへ転記しない。

## 7. 実装の分担と接続

EXP-001：独立した候補選択と投影の純関数（ExplorationPort）。
EXP-002：保存、API、所有権、冪等・失効と設定。
EXP-003：2D/3Dの中立モデルと地図内選択（ExplorationLayerPort）。
EXP-004：候補詳細、関心/非表示、記録・経路への入口、設定UI。
INT-022：上記と既存地図・記録・訂正・経路を結合して通し受入。

4moduleは共有DTO/Portと明示fixtureから並行して着手できる。
INT-022の詳細依存はTASK_GRAPH.jsonで宣言する。非依存の健康・ペット生成・native・友人機能の完成を待たない。
MapDependencies.explorationは任意注入。未注入でも既存地図は起動し、追加capabilityはINT-022の実接続receipt後に公開する。
rendererとUIの選択連携は注入callbackで行い、feature間の具象importを禁止する。

## 8. 完了の判定

代表シナリオは、休息の体験から庭のある候補に興味を持ち、経路を確認し、実際には会話がよかったと記録して、会話の形へ育つ流れ。
庭の完成形へ誘導しない。保存後の体験を次の探索の起点にでき、再起動でも同じ正本から地図が戻る。

必須反例は、タップのみ、GPS近接のみ、訪問だけ、元の理由の訂正、体験削除、別の有効体験が残る削除、非表示後refresh、scope切替、経路なし、データなし、reduced motion、2D/3D切替。
詳細はexamples/mist-exploration-acceptance.json。製品の実行前はexecuted=falseのままにする。
moduleの型・fixture合格と、実際の操作・API・保存・再表示の合格を分けて記録する。

## 9. 参照したUIと採用範囲

受領画像は[UI対応表](../ui/README.md)と原本hashで管理する。
画像にはもやもやモデルがまだ描かれていないため、本仕様を差分として実装する。
画面の白い面、青緑の操作色、余白、柔らかな造形は受領見本を引き継ぐ。
参考記事の店舗数の方角集計、放射状チャート、配色・図版・計算結果は移植しない。
着想の経緯のみ[まちの計量舎の記事](https://note.com/machi_measure/n/n217c03d78aa4)として記録する。
