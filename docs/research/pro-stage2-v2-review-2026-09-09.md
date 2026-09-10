# Stage2 v2 受領・精査

2026-09-09。結論は、**全体方針は採用候補にできるが、このまま106タスクを配布する前に、並列実装の接続契約を補う必要がある**。機能を減らす、担当を固定する、時間割を戻す、という修正は不要。主な不足は、別々に完成した実装をつなぐための入力と登録形式である。

原本は [Stage2 v2](../archive/gpt-pro-stage2-v2-2026-09-09/sodateru-map-stage2-v2-20260909/SPEC_INDEX.md)、配布ZIPは [受領ZIP](../../deliverables/sodateru-map-stage2-v2-20260909.zip)。原本を変更せず保存した。本書はレビューであり、現行アプリへの仕様採用・実装・Issue登録は行っていない。

2026-09-09追記：ユーザーの修正指示に基づき、R1〜R6を[改訂版v2.1](../../deliverables/sodateru-map-stage2-v2.1-20260909/REVISION_NOTES.md)へ反映した。以下は修正前v2に対する指摘として残す。修正後の型・参考処理・依存関係の結果は[改訂版の検証レポート](../../deliverables/sodateru-map-stage2-v2.1-20260909/VALIDATION_REPORT.md)を参照。アプリ本体は未適用。

## 受領と検査で確認できたこと

- ZIP 255ファイル、CRC正常。253件のマニフェスト対象ハッシュが一致。
- 現行要件145件のID・名称・受入本文を照合し、欠落なし。SELF-009は受入本文に加えて「すべての訂正で順位を強制変更しない」という補足も保持。
- 追加12件を含む157要件、106タスク、86 API操作、291スキーマ、42テーブル、481業務列を確認。
- 同梱検査を別コピーで再実行。135リクエスト／レスポンス例の型検証、依存循環なし、全APIの実装タスク割当、DDL・seed・外部キー確認が成功。
- ロック補助17ケース、保存参考実装10ケースが成功。保存処理は指定のNode v22.22.1で再確認した。

[検査結果](pro-stage2-v2-review-evidence-2026-09-09.json)に記録。これらは仕様の形式と補助実装の確認であり、全要件の実現やアプリの動作を証明するものではない。今回アプリコードは変更しておらず、現行アプリのcheck/build/E2Eは再実行していない。

## 配布前に直す項目

### R1 / P1：機能を自動収集するための登録形式が未確定

[FND-001](../archive/gpt-pro-stage2-v2-2026-09-09/sodateru-map-stage2-v2-20260909/issues/FND-001.md)は `src/features/*/entry.tsx` と `server/features/*/entry.ts` を収集する。しかし [ports.ts](../archive/gpt-pro-stage2-v2-2026-09-09/sodateru-map-stage2-v2-20260909/contracts/ports.ts) のUIManifest/ServerManifestはメタデータだけで、export名、コンポーネントのprops、handler登録関数、注入する依存、capabilityの提供宣言がない。地図部品と `src/integrations/`・`server/integrations/` の読み込み経路もこの収集規則には含まれていない。

FND-001と各機能が同時着手すると、全員が仕様に従っていても異なるentry形式を作れる。統合側が大量の追加ロックを取り、完成済み機能を直す事態になる。

**修正**：最初にFeatureEntry、ServerEntry、IntegrationEntryの型と最小の動作例を提供する。登録名・呼出し方・依存注入・capabilityの提供と要求・統合モジュールの収集対象を固定する。人の担当を固定する必要はない。現行リポジトリへ適用する場合は、組立てをsrc/app・src/serverに置く既存境界に合わせた対応表も必要。

### R2 / P1：経路の制約判定に必要な道中の情報が渡らない

[ports.ts](../archive/gpt-pro-stage2-v2-2026-09-09/sodateru-map-stage2-v2-20260909/contracts/ports.ts) のGraphEdgeにはstairs・covered・vehicleClassesがある。一方、ConstraintPort.evaluateに渡るのはRouteInput、RouteLeg[]、Place[]、Pass[]だけ。[RouteLeg](../archive/gpt-pro-stage2-v2-2026-09-09/sodateru-map-stage2-v2-20260909/contracts/domain.ts)には使用edgeのID、階段・屋根・車種制限、その確認根拠がない。定期券を判定する路線・乗降区間もない。

例えば、目的地に屋根があっても、途中が屋根なしなら「全行程で屋根が必要」を満たさない。現契約では、その違いを制約判定器が受け取れない。事前filterで解決しようとしても、情報不明と確認済み適合を示す根拠の受渡しが必要になる。

**修正**：RouteComputation/RouteLegに使用edgeと制約用facts・provenanceを持たせるか、ConstraintPortへ選択済みedgeを明示的に渡す。交通区間は事業者・路線・乗降地点・適用時刻を持つ型にする。既知の適合／不適合／不明それぞれについて、経路計算から制約表示まで同じ例を用意する。

### R3 / P1：AIが質問した後の回答・保留を保存する経路がない

元要件の [自己理解](../requirements/know-yourself.md) は、会話の引継ぎ、回答による質問の変化、回答・後回し・スキップの保存を求めている。v2のAiExtractOutputにはquestionがあるが、AiExtractInputはexperienceIdのみ。七つのAI taskと86 API操作には、質問への回答を追加し、元の質問と根拠へ結ぶ専用契約がない。Interpretationにも質問状態はない。SELF-008の対応表には「skipを保存する」とあるが、その保存先が具体化されていない。

Correctionの自由文に回答を入れる独自実装では、本人の回答原文と解釈の訂正を区別しづらく、同じ質問を繰り返さない判定も担当ごとに変わる。

**修正**：最小のQuestion/AnswerまたはConversationTurnを定義し、対象体験・質問の根拠版・本人の回答原文・answered/deferred/skippedを保存する。回答を追加して再抽出するAPIと、再入場で状態を復元する例を作る。大規模なチャット基盤は不要。

### R4 / P1：統合Issueにもfakeで完了できる指示が残っている

[TASK_EXECUTION.md](../archive/gpt-pro-stage2-v2-2026-09-09/sodateru-map-stage2-v2-20260909/TASK_EXECUTION.md) は、module完了と実接続完了を分けている。一方、[INT-008](../archive/gpt-pro-stage2-v2-2026-09-09/sodateru-map-stage2-v2-20260909/issues/INT-008.md)等の「失敗・引継ぎ」には、依存未完成ならPortをfakeに置き換えて「本Issueの範囲を完了させる」と書かれている。各Issueだけを読む運用では、統合もfakeで完了できると解釈される。

**修正**：module向けテンプレートとintegration/gate向けテンプレートを分ける。INT/GATEでは対象の実保存・実接続がなければ完了にせず、進捗と阻害要因を残す。サンプル地理データの使用可否と、APIやAI接続をfakeに置き換えることも分けて記載する。

### R5 / P2：部品は細分化したが、統合は大きな束のまま

[INT-005](../archive/gpt-pro-stage2-v2-2026-09-09/sodateru-map-stage2-v2-20260909/issues/INT-005.md)は、友人比較・レシピ・都市間移植・感想返信の全体をまとめて待つ。INT-008も三つの拡張テーマをすべて待つ。そのため「比較だけ使える」「生成した一つの拡張を導入できる」という完成部分が、他の機能待ちになりやすい。これは部品単体の並列化だけでは解消しない。

**修正**：比較の実接続、移植の実接続、返信の実接続を分け、最後の一連の体験確認は別に残す。拡張は生成→導入の共通接続と、各テーマの接続を分ける。さらにINT-002が要求する説明差分をどのUIで表示するかを明記する。現graphにはSELF-001/RTE-004が必須依存に入っておらず、REC-003側で差分画面まで提供するのか不明。

### R6 / P2：「型付きAPI」のPortが操作名と入出力を結び付けていない

[ApiPort](../archive/gpt-pro-stage2-v2-2026-09-09/sodateru-map-stage2-v2-20260909/contracts/ports.ts)はoperationId:stringに対し、呼出側がTRequest/TResponseを任意に指定できる。存在しない操作名・無関係なリクエスト・number型のレスポンスを組み合わせた呼出しが、実際にstrict TypeScriptでコンパイル成功した。291のDTOがあっても、これでは別の操作のDTOを取り違えたコードを型で止められない。

**修正**：OpenAPIからOperationMapを生成し、`invoke<K extends keyof OperationMap>`で操作名とpath/query/body/responseを対応させる。GETのpath/queryとmutation bodyの包み方もこの型で固定する。検査ケースは「正しい呼出しは通り、操作名・body・responseの取り違えは落ちる」とする。

## 製品として採用を決める点

原要件を残したことと、当日の機能が満たすことは別である。Proは当日の相手をサンプル人物、移植先を架空店舗、経路をサンプルgraphとし、実友人通信・実交通・実防災を後続へ移している。これは本文と対応表で開示されており、黙った削除ではない。ただし「たくさんの機能が実際に使える」を優先するなら、完成する機能とサンプルに限る機能を画面ごとに確認する必要がある。

MapLibreへの変更、人物の灰白モデル、初期2D、タブ名の短縮もProの提案。技術変更は許可済みだが、人物の見た目や具体的なUXまで自動的に採用済みとは扱わない。現行Next版を活用する場合、Vite前提の自動収集・ファイルロックをそのまま持ち込まず、対応する構造へ直す。

## 推奨する次の改訂

機能数を削る前にR1〜R4を直し、R5〜R6で手戻りを減らす。改訂物には、(1) 完全なentry型と最小接続例、(2) 制約判定まで情報が通る経路例、(3) 質問→回答→再抽出→再入場の例、(4) 実接続ごとに分けた依存グラフを追加する。これらが揃えば、未割当タスクを手が空いた人が取得する方針を維持したまま、実装へ渡しやすくなる。
