# データ・自己理解・推薦・AIの機能仕様

具体的なAPI形式はAPI_CONTRACT、全保存fieldはDB_SCHEMAとOpenAPI。ここでは意味と処理を固定する。UIはAPIを呼び、API側がpure logicとDbPortを組み合わせる境界を守り、AIだけに計算・承認・危険判断をまとめない。

## 原文と解釈
Evidence.textは本人が記した原文、Experienceは現在採用中の用途/理由/条件、InterpretationはAI提案、Correctionは本人の変更履歴。原文をAI文で置換しない。本人訂正は既定でこのExperienceだけ。用途、理由、その時の成果、現在の希望、好み申告を異なるfieldとして扱う。

多く行ったから好き、長くいたから有意義、同じ場所へ行ったから同じ人格という規則は禁止。確定訪問数は成長装飾の入力。用途は本体形状。選好は明示申告と条件付き仮説の別入力。

## 観測と滞在
Observationは位置と受信時刻を別保持し、sourceRecordId/importHashで重複を除く。GPS/GPXの点だけで訪問成立にせず、候補Visit→本人確認→confirmedの順。欠損・粗い精度・乗物移動・階不明は不明のまま保持する。過去の手動記録は正規経路であり、センサがなければ価値が出ない設計にしない。閾値はサンプル上で調整可能な設定値とし地理的正しさの保証にしない。

## 自己理解
Hypothesisはcondition、claim、supportEvidenceIds、counterEvidenceIds、alternative、status、inputRevisionを持つ。支持と反例がないものはneeds_more_data。一貫した人格タイプを出すのではなく「雨で一人の時には、屋根と座席を重視していた」のように条件を明示する。別説明や本人の反証を同じ画面に置く。

LLMは原文の抽出と説明担当。証拠集合、集計、版検査、hard条件はコードで実行する。訂正後は参照されたEvidence/Experienceの範囲を再計算し、同じ候補集合で差を示す。現在のPreference変更は履歴の改竄ではない。未選択肢が観測できないデータから因果的な好みを断定しない。長期的な学習・比較評価・介入はFUT07/FUT20に残す。

## 候補と経路
取得候補と制約検証を分離する。hard条件はpass/fail/unknown、soft条件は順位への寄与。未知の屋内席・階段・料金をtrue/0として通過させない。実道路がないseedではsample graphを計算し、実徒歩案内と表示しない。直線だけを出して経路計算済みにしない。

共同経路は各人のhard条件を同時に満たすか、誰のどの条件が未解決かを出す。滞在＋移動＋時刻条件を計算し、入力を変えると結果が変わる。定期券は本人の入力、適用区間、期間、情報源を持ち、実交通providerが追加運賃を返せない場合はunknown。時刻や災害状況の架空生成は禁止。

## 体験の都市間移植
Recipeは場所カテゴリでなく、目的を満たす役割の順序と固定/可変要素を持つ。Transferはfaithful/personalの2軸で候補との対応理由、変えたもの、再現できない記憶を表示する。他人と過ごした記憶を複製できるとは言わない。移植先の候補が同カテゴリでも役割条件に合わなければ採用しない。

OpenUAS/Area2VecはFUT06の候補検索adapterへ入れる。属性ベースbaselineと実データ埋込みの候補/順位を比較し、研究資産を使ったこと自体で有効性を主張しない。性格推定や安全性の判定器に転用しない。使用都市、版、ライセンス、coverageを記録する。

## 共有
ShareGrantのfield単位投影をserverで作る。レンズは同placeに対する意味の違いであって相手の私生活の全複製ではない。Comparisonに棄却した対応を保持して同じ誤対応を復活させない。Feedbackは本人の実践Experienceとして所有し、元作者への返信は別の許可範囲。共有が取り消されても自分の新体験は残す。

## 発見と写真/日記
発見は対象→観察できる特徴→関連知識→次に見る問い。推薦店一覧の別名にしない。知っていた/気になる/保存/今回は閉じるを別eventとして持ち、clickから性格を断定しない。対象固有の事実と一般知識を分け、出典がない固有事実を付けない。

日記は原記録の参照から作る本人承認前の草案。撮影していない写真や感じていない感情を生成で事実化しない。探索の能動提案は本人のopt-inと現在の受入意思を尊重する。全停止は設定とAI applyに反映する。

## AI処理
AiPortをfakeにすればfeature自体を並列実装できるが、INT-003だけは実応答を確認する。送信は最小scope、Structured outputのschemaを照合し、source/entity IDは許可集合内に限定する。jobの七つのtaskと適用処理はAPI_CONTRACT第6節。SDK接続の失敗を別modelやreplayで隠さず、手動処理は手動と表示する。

## v2.1の実装入力

任意1問の保存・回答・後回し・スキップ・再抽出はdocs/spec/QUESTION_FLOW.md。AI-008がAPI/QuestionPort、AI-009がUI、INT-016が実接続を担当する。単なるquestion文字列の表示でSELF-008を完了にしない。

経路の階段/屋根/車種/交通区間はRouteLegへ渡し、docs/spec/ROUTE_CONSTRAINT_FLOW.mdに従って判定する。目的地だけのfactsを全行程の状態へ拡張しない。

## v2.2：健康文脈と画像生成

健康情報の保存・権限・AIへの投影はdocs/spec/HEALTH_INTEGRATION.mdで定める。AiInput/AiOutputにwellbeing枝を追加し、既存のtask枝を保持する。健康context付きjobの取得・適用にも許可guardを注入する。健康由来の記憶を一般の趣味・人格推定へ暗黙に混ぜない。

ペット制作はPetImageGenerationPortを使う。既存のテキストAI接続やCodexログインだけで画像生成が利用可能と扱わない。外部制作物のimportとアプリ内生成は同じPetPackageに合流する。
