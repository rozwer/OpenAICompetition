# 育てる地図 Stage2 v2.1 — 統合仕様書

157要件、114タスク。6件の精査修正を反映。アプリ実装は未適用。

## 収録：SPEC_INDEX.md

# 育てる地図 — Stage2 v2.1：依存関係で進める実装仕様

2026-09-09 / 契約 v2.1.0。**時間割・固定担当・時間見積りを撤去し、全114タスクを未割当にした改訂版。** 全157要件（元145＋追加12）、旧55受入条件、低優先度の本体改造・デプロイ構想を保持する。旧v1のスケジュール、A/B/C/D所有、単一JSON保存、API型は本版に置換する。

## 開発する価値
場所の原文記録→用途による建物本体の変化→本人の訂正→根拠付き自己理解と次の候補→友人との違い→他都市へ役割と順序を移す→発見→必要な機能の生成・導入。この循環を同じID・原文・版でつなぐ。人格の占い、見せ場のために無関係な順位まで変える演出、生成していない結果の偽装はしない。

## 読む順序
1. [タスク取得・並列実装](TASK_EXECUTION.md) → `tools/taskctl.py ready` → 選んだ `issues/*.md`。
2. [共有契約](CONTRACTS_V2.md) → [API仕様](API_CONTRACT.md) / [DB仕様](DB_SCHEMA.md)。実装者は担当operationとDTOだけを追加で読む。
3. UIは [製品UX](PRODUCT_AND_UX.md)、造形は [地図と発見](MAP_GROWTH_AND_DISCOVERY.md)、拡張は [生成と本体改造](EXTENSIONS_AND_APP_MODIFICATION.md)。

通読版は [SPEC_COMPLETE.md](SPEC_COMPLETE.md)。一覧は [ISSUE_INDEX.md](ISSUE_INDEX.md)、CSVは [ISSUE_BACKLOG.csv](ISSUE_BACKLOG.csv)。`READY_TASKS.csv` は初期依存だけから得た参考値で、実行時は共有boardが正本。

## 今回固定した決定
- Node 22.22.1 / Bun 1.3.14 / mise / Vite・React・TypeScript / MapLibre・Three / Hono / ローカルCodexを出発点にする。**保存だけSQLiteへ変更**。起動済み既存Next/SQLiteを不必要に移植しない。
- `/api/v1` の **89 HTTP操作**、**304 DTO/union**、**44 SQLテーブル**を定義。APIはOpenAPI 3.1.1、DBはそのまま実行できるDDL。階層データも型付きJSONであり自由形式blobではない。
- 全114タスクを手が空いた人・agentが取得する。実装開始はhard依存＋編集pathの空きだけで判定。機能を担当者に永久所有させない。
- `connect_after` は実APIとの接続に必要な実装であり、UI・純関数・provider adapterの着手を止めない。共有契約とfixtureから実装できる。
- P0/P1/P2/P3は重要度・実装の順序。時刻で切替えない。高優先度の接続を解放する下流効果も優先判定に使う。名目5時間は外部の予算条件であり、タスクの時刻・期限へ変換しない。
- 77タスクは初期に着手依存なし。ただしpath競合・環境capability・同時実行の実資源を確認してclaimする。77個の同時起動を約束する数字ではない。8件は小さく独立した追加作業としてPOOLに明示する。

## 完了の意味
仕様・契約・補助コードを提供した状態であり、アプリは未実装。module単体の完了、live接続の完了、デモの完了を分ける。全P1を待たず、P0の通し体験をGATE-001で確認できる。各枝の完了は追加の体験として残し、機能削除の理由にしない。

今回の変更点は [REVISION_NOTES.md](REVISION_NOTES.md)、実行した文書/補助コード検査は [VALIDATION_REPORT.md](VALIDATION_REPORT.md)。GitHubへIssueは登録していない。

## v2.1で修正した接続境界

[改訂内容](REVISION_NOTES.md)に6項目をまとめた。配布前に全員が [登録契約](ENTRY_CONTRACT.md) と操作別の型を読む。経路は [経路制約](ROUTE_CONSTRAINT_FLOW.md)、自己理解は [質問と回答](QUESTION_FLOW.md) を対応moduleの共有入力にする。

INT-005は比較、INT-011は移植、INT-012は返信。INT-008は汎用生成・導入、INT-013〜015は各テーマの接続。AI-008/009とINT-016は質問の回答・保留・再抽出を担当する。全taskは未割当のまま。既存アプリへはまだ適用していない。


---

## 収録：REVISION_NOTES.md

# v2 → v2.1 の修正

2026-09-09。ユーザー承認に基づき、受領したPro原本の6件のレビュー指摘を修正した。Pro原本は別に保全。本版はアプリへの実装ではなく、実装へ渡す仕様・契約・参考コードの改訂。

| 指摘 | 修正 | 主な確認 |
|---|---|---|
| R1 登録形式が未確定 | entries.ts、map-ports.ts、ENTRY_CONTRACT.md、最小登録例 | 重複entry/operation、宣言と登録の不一致、fixtureの誤公開を拒否 |
| R2 道中の情報が不足 | RouteLegのedgeFacts/coverage/transit/passAssessments | 目的地の条件を固定し、道中の適合・不適合・不明を区別 |
| R3 質問の回答保存がない | FollowUpQuestion/QuestionResponse、3 API、QuestionPort、回答IDによる再抽出 | 原文保持、再送、skip/defer、再入場、別体験参照の拒否 |
| R4 統合もfakeで完了できる | INT/GATE専用の未完了・受入規則へ変更 | 全該当Issueの規則と分割依存を検査 |
| R5 統合が大きすぎる | 比較/移植/返信、汎用生成導入/各テーマを分割 | 他枝や三テーマ全完成を不要に。INT-002の表示UI依存を明記 |
| R6 APIの型が操作に結び付かない | OpenAPIからOperationMapを生成 | 正しい呼出しが通り、未知operation/誤body/誤responseが型エラー |

要件は157件のまま。タスク114件、API89操作、304 schema、44テーブル、506業務列。全タスク未割当・時間割なし・8件の独立POOLを維持。新たな外部サービス、課金、実コード実行機能は有効化していない。

この改訂にはv2とのwire非互換変更がある。新旧の型を混在させず一括配布する。既存DBへの再適用や現在のアプリの置換は行わない。既存Nextを使う場合はENTRY_CONTRACT.md第4節の構造対応を先に行う。


---

## 収録：TASK_EXECUTION.md

# 依存関係・編集ロックによるプル型実装

## 1. 4人を4本の直列レーンにしない
人は同時に複数Codexを監督してよい。**1 agent × 1 task × 1 branch/worktree**を基本単位とする。得意分野やMac/Windowsは助言であり、取得権ではない。既定assigneeは全件null。人が不在だからfeature全体が止まる状態を作らない。

着手条件は `status=backlog AND 全hard_dependenciesがdone AND 必要pathsと他claimが非重複`。提供済みv2.1契約が入力である。`connect_after` の実装は、型・fixture・Port fakeを使うmodule開発の着手条件ではない。local fixtureは画面で明示し、ライブ接続確認と混同しない。

取得順は effective_priority（下流のP0を開放するtaskもP0相当）→高優先度の依存を多く解放する→自分のcapability→小さく受入できる単位。P2/P3を取る前にP0/P1のREADYを確認する。全taskの完了待ちや全員の集合はしない。規模S/M/L/XLは分割の目安であり所要時間ではない。

## 2. 着手依存と接続依存の例

| Task | 単体で始めるために必要 | live接続で必要 | 待たずに進めるもの |
|---|---|---|---|
| MAP-002 建物本体 | v2 Meaning DTO | MAP-001・REC-005をINT-001で結合 | 形状、用途切替、再訪の装飾 |
| REC-003 訂正UI | CorrectExperienceRequest/Response | REC-004をINT-002で結合 | 元文、対象、入力、409の表示 |
| REC-004 訂正API | DbPortとDDL | FND-002をINT-002で使用 | validation、transaction callback、単体SQL |
| EXT-001 DSL | DslDefinition/DslPort | 経路/制約PortをINT-008で結合 | 参照検査、有限op、入力依存計算 |
| INT-001 記録と地図 | graphのhard依存がmainに存在 | 本物の保存を使用 | 依存完了と同時に任意の人が取得 |

統合タスクも無関係な地図造形の完成へ連鎖させない。例えばINT-003（AI実接続）とINT-010（日記/写真）は、共通基盤と対象moduleが揃えばINT-001の完了を待たず進める。

ソース生成の便宜だけで「まず全backend、その後全frontend」という依存を追加しない。反対に、統合・配備・実データ評価の実在する前提はhard依存にする。

## 3. 同時取得の競合を防ぐ正本
`TASK_GRAPH.json`は計画、`coord/task-board`のGit参照に保存したstateが実行中の正本。GitHubのassignee/labelは表示用のミラーにできるが、4人が同時にIssueを見て「空いている」と判断するだけでは排他にならない。

同梱 `tools/taskctl.py` はstateの旧commit OIDを指定した `--force-with-lease=<ref>:<expected>` によりcompare-and-swapする。[V2-S4] 取得対象は **coord/task-boardだけ**。mainをforce-pushしない。競合時は最新stateから再判定し、失敗を成功と見なさない。全pathsの取得は1更新で成功するか、何も取得しないかの二択。通信不能時は新規claimをしない。

ロックpathはrepo相対POSIX表記。末尾`/`のディレクトリは全子孫、末尾なしはそのファイルだけ。`src/map/`は`src/map/forms/book.ts`と競合するが、`src/map/forms/`と`src/map/avatar/`は競合しない。大きい親フォルダを気軽に取らない。Gitの別worktreeでも同じ将来merge対象のpathなら競合する。

`claimed`だけでなく`submitted`も編集ロックを保持する。PRがmainへ取り込まれ、そのcommitがmainから到達可能になったら`land`でdoneと解放を同時に更新する。提出した人は、別agent/worktreeで他の空きtaskを取れる。統合担当者を恒久固定しない。

## 4. 実行コマンド

最初に1人が共有repoに文書・契約・TASK_GRAPH・toolsを置き、通常のmain commitとして共有する。アプリ空repoでも契約はこの時点から読める。認証、既存資産利用許可は各チームの条件に従う。

```bash
# mainを同期した通常のcloneで一度だけ。既存boardは上書きしない。
python tools/taskctl.py init --manifest TASK_GRAPH.json
python tools/taskctl.py ready

# 4人の誰でも取得。出力のtokenとbase_commitを保存する。
python tools/taskctl.py claim REC-003 --actor person2-agentB
# 出力されたbase_commitから専用worktreeを作る（値は実際の出力で置換）。
git worktree add ../wt-rec003 -b task/REC-003 <base_commit>

# 必要な追加pathは書く前に原子的取得。失敗したら新pathに書かない。
python tools/taskctl.py add-lock REC-003 --token <token> --path src/integrations/rec-fix/
# task worktreeでcommit後。変更pathを検査して提出。
python tools/taskctl.py submit REC-003 --token <token> --commit HEAD --evidence '契約fixtureで訂正と409を確認'
# レビュアーが通常merge/fast-forwardしmainへpush後に実行。
python tools/taskctl.py land REC-003 --token <token> --main main
```

同梱helperの`land`はcommit到達性を検証するため、**通常mergeまたはfast-forwardを使い、squash mergeしない**。最初のclaim時baseから提出commitまでの変更pathを検査する。無関係なmainの更新をtask branchへmergeして差分を増やす前に、taskを提出し、統合側がmainでmergeする。追加修正が必要なら同じtokenで再submitできる。squash/rebaseした別commitを自動で同一視する機能は入れない。

## 5. lock解放・引継ぎ・停止

`release --token ... --note ...` は未完了で返す。branch/commit、動作したこと、残件をnoteに残す。hard依存は解放されない。`handoff --to ...` は同じtaskとpathを次のagentへ渡し、token世代を更新する。旧tokenでsubmit/land/releaseは失敗する。

止まったagentを時刻だけで自動解放しない。人が停止と未push作業を確認してから `recover TASK --confirm-stopped --note ...`。これもtoken世代を更新しbacklogへ戻す。ネットワーク分断で動いているagentがいる可能性を排除する前にロックを奪わない。helperは任意協調の仕組みであり、Git権限を持つ人の悪意あるpushを防ぐセキュリティ機構ではない。

追加pathが取れないまま互いに待つ場合は、同時に要求する全pathを洗い出し、片方がhandoff/releaseする。親pathを小分けにして担当を分離できるなら契約変更taskとして分割する。複数ロックを一つずつ待ち続ける方式を採らない。

## 6. 空きタスク
全taskが未割当poolだが、`POOL_TASKS.csv`の8件は特に独立して取得しやすい。建物material、空状態文言、根拠付き発見カード、移植例、拡張可変ケース、表示確認、Codex利用証拠、実演カード。単なる雑務ではなく受入と編集pathを持つ。POOL-006の画面確認に実画面がない場合は、fixture確認か別poolを選ぶ。実画面の修正は元ファイルのlockを追加取得する。

## 7. 統合と完了
moduleの受入は個別契約で成立するが、利用可能な製品機能として表示するのはINT taskでlive接続を確認してから。`capabilities`により未接続のボタンを操作可能にしない。P0のGATE-001は全P1を待たない。完成したP1枝は対応INTの証拠付きで追加する。UIの存在だけを機能数に算入しない。

コード排他、DBのtransaction、利用者の共有許可は別物。編集ロックを持っても本人データへの無制限アクセス権は得ない。SQLite transactionを短く保つことは開発timeboxではない。

共有Git参照が使えない場合は、1人の受付がclaim/releaseを直列に処理して台帳を返す手動運用へ明示切替する。複数人が独立にlabel更新する方式は代替にしない。GitHub Issue自体は同梱import scriptで作成可能だが、この納品では未登録。

## v2.1：統合と質問の分割

各moduleはENTRY_CONTRACT.mdに従う。収集可能なdescriptorを提供しただけでは利用可能にせず、対象buildの実接続receiptでintegration capabilityを解放する。INT-003/INT-008/INT-016はrequiresLiveAI=trueを宣言する。

INT-005/011/012は比較/移植/返信、INT-008/013/014/015は汎用生成導入/防災/バイク/聖地巡礼。それぞれが受入を満たせば使える。最後にT4/T5を通す確認は残すが、他の枝が未完成だから実接続済みの枝を一律に閉じない。

INT/GATEの未接続をfakeで完了にする指示は撤去した。使用データがsampleでもAPIとDBが本当に動いたならその範囲の実接続として記録できる。live AIを含む受入はreplayでは達成しない。


---

## 収録：ENTRY_CONTRACT.md

# 登録・接続契約 v2.1

本書と `contracts/entries.ts`、`contracts/map-ports.ts`、`contracts/operations.ts` を、起動基盤と機能の共通入力とする。FND-001の完成を待たなくても、全員が同じexport形式から実装できる。型の変更はCONTRACT_CHANGE.mdで調整する。

## 1. ファイルとexport

各entryは副作用のないdescriptorを**default export**する。importしただけでDBを開く、AIを実行する、イベントを登録する処理を置かない。

| 配置 | default export | 収集する側 |
|---|---|---|
| `src/features/*/entry.tsx` | `UIEntry<ReactNode>` | browserのshell |
| `server/features/*/entry.ts` | `ServerEntry` | serverの組立て |
| `server/db/entry.ts` | `ServiceEntry<'db'>` | serverの組立て |
| `shared/logic/*/entry.ts` | 対応する `ServiceEntry<K>` | serverの組立て。UIへは取り込まない |
| `server/ai/adapter/entry.ts` | `ServiceEntry<'ai'>` | serverの組立て |
| `server/features/questions/service.entry.ts` | `ServiceEntry<'questions'>` | serverの組立て |
| `src/integrations/*/entry.ts` | `IntegrationEntry` | browserの組立て |
| `server/integrations/*/entry.ts` | `IntegrationEntry` | serverの組立て |

FND-001は上表の各globを明示して収集する。ルートpackage.json、共通barrel、巨大routerへ全員が追記する方式を使わない。mapの純部品は次節の明示的注入を使い、featureの自動収集だけで読み込まれると仮定しない。

UIはReactの `createElement(entry.Component, props)` または同等のJSXでマウントする。`entry.Component(props)` として直接呼び出してHooksのコンポーネント境界を失わせない。UIPropsはAppContext、scope、ApiPort、NavigationPort、利用可能capabilityを渡す。featureはserverのentryや別featureをimportしない。

ServerEntry.registerはmanifestで宣言したoperationだけをHandlerRegistrarへ登録する。入力はOperationRequest<K>、出力はOperationResponse<K>で、HTTP成功statusは生成済みOPERATION_HTTPの定義を使う。path/query/bodyの検証、scopeヘッダーの解決、エラーのApiErrorへの変換はHTTP組立て側の責務。handlerは外部のHTTP RequestやHono Contextを受け取らない。

DbPort、QuestionPort等はServiceLookup.getで取得する。module間の具象importはしない。宣言したrequiresServicesを満たす順にServiceEntry.createを呼ぶ。循環・重複serviceは起動エラーとし、存在しない依存を空オブジェクトで埋めない。

ServiceMapのキーはdb、meaning、hypotheses、graph、constraints、transfer、sharing、ai、dsl、questions、comparison、joint、discovery、observations、sourceNormalize。各pure moduleのentryは対応キーをprovidesとして宣言する。PromptはAI adapterへ組立て側から明示注入し、UIや他featureが直接importしない。

## 2. 地図の部品

- MAP-001：`src/map/host/index.ts` のdefault exportは `MapHostFactory<ReactNode>`。
- MAP-002：`src/map/forms/index.ts` は `FormsPort`。Meaningからメートル単位のPrimitive配列を返す。
- MAP-003：`src/map/avatar/index.ts` は `AvatarPort`。未完成時はavatar=nullで人物表示を無効化する。
- MAP-004：`src/map/state/index.ts` は `MapStatePort`。次元・レンズ・実位置・Replayの状態を更新する。
- INT-001の `src/integrations/int-001/map.entry.tsx` が上記をimportし、host({forms,avatar:null,state})の結果をUIEntryとしてdefault exportする。browserは `src/integrations/*/*.entry.tsx` もUIとして収集する。INT-004は追加lock取得後にavatarを注入する。未完成avatarを実装済みの人物と表示しない。

Primitiveはsymbolic描画だけの契約である。physicalの輪郭・実高さはBuildingからhostが描画し、Primitiveの仮の寸法で観測高さを上書きしない。boxのsizeは各軸の幅、sphereは各軸の直径、cylinderはX/Zの直径とYの高さ、rotationはXYZラジアン、positionは建物anchorからのメートル。色はCSSの#RRGGBB。Three型を契約へ持ち込まない。

## 3. 収集から利用可能まで

1. browser/serverは自分のcatalogだけを読み込む。browserへserver・DB・Codexの実装をbundleしない。
2. descriptorのkind、ID、operationの重複、service依存を検査する。ServerEntryが実際に登録したoperation集合とmanifestの一致も検査する。
3. serviceを依存順に構成し、handlerを登録する。fixture handlerはfixture catalogに分離する。`api:<operationId>`を通常利用へ公開できるのはimplementationモードのhandlerだけ。
4. IntegrationEntry.wireは使うUI/server entry IDを列挙する。同じentryを複数integrationが参照しても一度だけ登録する。未知IDはエラー。wire自体は接続検証の成功ではない。
5. INTの受入が実行済みで、対象buildRevisionと一致するConnectionReceiptがある場合だけ `integration:INT-xxx` を有効化する。AIを含むINTではaiMode=live-codexの実応答証拠を要求する。receiptをコード生成だけで作らない。
6. UIのrequiresCapabilitiesを満たさない操作は非活性にし、明示fixture previewとして開く経路と分ける。通常のUI entryには必要なapiとintegrationを両方宣言する。

対向catalogの参照確認にはEntryIndexのID一覧だけをビルド時に出力して渡す。browserがserver descriptorをimportして確認しない。同じINTのbrowser/server descriptorは同じmanifest/配線IDを持たせ、metadataの一致をビルド時に確認する。実行関数はそれぞれの組立て側に残す。referenceのinspectEntriesは単一プロセスのfixtureとして両catalogを受け取るが、実アプリへ両方をbundleする指示ではない。

ConnectionReceiptのevidencePathsはローカル成果物への参照であり、秘密や回答原文を公開するための欄ではない。sourceMode=sampleは地理データがサンプルという意味。保存APIが実装済みであるか、AIを実接続したかとは独立する。

`examples/entry-wiring.ts` はexport・handler・wireの最小例、`tools/test_entries.ts` は収集時の拒否条件の実行例。これらは明示fixtureであり、アプリの接続完了receiptを発行しない。

## 4. 既存Nextアプリを使う場合

このZIPは空repoのVite/Hono構成を出発点にする。既存アプリを使う分岐では、収集・注入を `src/app` と `src/server` へ置く。`server/*`、`shared/logic/*`、ルートcontractsの書込pathを既存のserver/domain/contractsへ写す対応表を、着手前にTASK_GRAPHと一緒に変更する。Nextのsrc/app内に任意のVite構成をそのまま生成しない。feature間import禁止・domain/contractsの独立を維持する。


---

## 収録：CONTRACTS_V2.md

# 共有契約 v2.1.0

HTTP正本は [contracts/openapi.yaml](contracts/openapi.yaml)、同値JSONは [contracts/openapi.json](contracts/openapi.json)。JSON Schemaは [contracts/schemas.json](contracts/schemas.json)、生成済みTypeScriptは [contracts/domain.ts](contracts/domain.ts)。DB正本は [db/schema.sql](db/schema.sql)、DTOとの列対応は [DB_COLUMNS.csv](DB_COLUMNS.csv)。

純関数・UI・APIの間は [contracts/ports.ts](contracts/ports.ts)。DbPort、ApiPort、MeaningPort、HypothesisPort、GraphPort、ConstraintPort、TransferPort、SharingPort、AiPort、DslPortを固定する。自由な`any`で埋めず、戻り値のunknownやno-routeを扱う。

## 実装境界
UIはApiPortを呼び、DBを直接触らない。機能APIは自身のファイルでhandlerを実装し、共通DbPortの短いmutationを使う。pure logicは引数でDTOを受け取り、通信もSQLも行わない。provider/AIはDTOへ正規化して返す。意味の建物はMeaning DTOを描画するだけで人格推定をしない。

## 契約の共通事項
camelCaseのHTTPとsnake_caseのDBをdto-map通り変換する。省略可とnull可を区別する。unknownをfalse/0へ丸めない。原文Evidence、正本Experience、AI提案Interpretation、本人Correction、派生Meaningを別にする。共有は許可された投影をserverで作り、UIで隠すだけにしない。

`examples/http/`の例は全operationの形式例であり、存在するレコードIDや地理的正しさを保証する実データではない。`examples/record-flow.json`は作成と訂正のつながる例。`examples/seed-core.json`は最小DB seed用。

## 改訂ルール
新featureは独自endpointや列を勝手に追加しない。まず [CONTRACT_CHANGE.md](CONTRACT_CHANGE.md) に従う。共有ファイルを読めることと、同時編集できることは別。生成済み型を各moduleが別々に編集しない。

## v2.1追加

登録形式はENTRY_CONTRACT.mdとcontracts/entries.ts、地図の純部品はcontracts/map-ports.ts。ApiPortはcontracts/operations.tsのOperationMapを使い、操作名・path・query・body・responseを結び付ける。

RouteLegの道中情報、FollowUpQuestion/QuestionResponse、extractのquestionResponseIdsを追加した。QuestionProposalへの変更とRouteLegの必須field追加を含むため、v2クライアントとwire互換ではない。空repoへの一括配布用であり、稼働中DBにDDLを再実行しない。


---

## 収録：API_CONTRACT.md

# HTTP API仕様 v2.1.0

OpenAPI 3.1.1形式を採用する。[V2-S3] 全field、required、null、enum、配列要素、path/query/headerは `contracts/openapi.yaml` が機械可読の正本。下表の名称だけから推測して実装しない。89操作は構想全体の契約であり、全endpointを一斉に完成させる要求ではない。未実装operationはcapabilityから除外し、呼出時は501 `DEPENDENCY_UNAVAILABLE`を返す。

## 1. HTTP境界
既定local API `http://127.0.0.1:8787`、ブラウザはVite proxy越し同一originで `/api/v1` を使う。public公開しない。GET health以外は `X-Namespace-Id: ns_demo` と `X-Actor-Id: actor_self` を要求する。ヘッダはローカルで対象を選ぶ仕組みであり認証ではない。serverは少なくともactorがnamespace内に存在すること、対象の所有/ShareGrantを検査する。公開時の認証はFUT01/02/18。

JSONの未知fieldは拒否する。JSON mutationは `{opId,payload}`、既存対象更新は `{opId,expectedRevision,payload}`。GETにbodyはない。DELETEも本版ではopIdとexpectedRevisionをJSON bodyに置く。body非対応の中間基盤を導入するなら新契約へ移行し、密かに省略しない。multipart uploadだけ同名form fields＋file。

IDはnamespace内で一意な識別子。サーバーがentity IDを生成し、clientは操作の `opId` を生成する。時刻はUTCのRFC3339文字列、日付はYYYY-MM-DD、元のzoneはtimeZoneへ。位置は `{longitude,latitude}`、GeoJSON座標配列は `[lng,lat]`。金額はJPY、時間はfield名にSeconds/Minutesを明記する。

## 2. 成功・失敗

```json
{"data":{},"meta":{"requestId":"req_example","namespaceId":"ns_demo","canonicalRevision":8,"nextCursor":null},"changed":[{"type":"Experience","id":"exp_example","revision":2,"action":"updated"}],"invalidated":["meaning:actor_self:place_a","hypotheses:actor_self"]}
```

上のdataは共通形の説明用。実際にはoperationごとのResponse schemaのdata型が必要。GETも同じenvelopeでchanged/invalidatedは空。asset/contentだけバイナリ。作成201、更新/計算結果200、AI開始202はOpenAPIの各operationに固定する。

| Status | error.code | 意味 / 次の動作 |
|---|---|---|
| 400 | VALIDATION_ERROR | JSON/形式/必須項目を直す |
| 403 | UNAUTHORIZED_SCOPE | actor/namespace/共有範囲が合わない |
| 404 | NOT_FOUND | 対象が存在しないか非公開 |
| 409 | REVISION_CONFLICT | 最新を読み、保持した草稿を再確認 |
| 409 | IDEMPOTENCY_CONFLICT | 同じopIdで別操作を送った。新規操作なら新ID |
| 409 | STALE_INPUT | preview/AIの参照元や権限が変化。再計算 |
| 413 | UPLOAD_TOO_LARGE | サイズを減らす |
| 422 | VALIDATION_ERROR | fieldErrorsに従って内容を修正 |
| 501 | DEPENDENCY_UNAVAILABLE | 未実装機能。固定成功に置換しない |
| 503 | PROVIDER_UNAVAILABLE / DB_BUSY | 草稿保持、明示再試行 |

エラーbodyは `ApiError` の厳密な型を使用する。独自文字列だけのレスポンスを返さない。内部例外/secret/生SQLをUIへ流さない。

## 3. 二重送信・競合・並列保存
request_dedupのキーは(namespaceId,actorId,opId)。method・正規化path・bodyをキー順canonical JSONにしてSHA-256を取り、同一opId/同一hashなら保存済みstatus/bodyを返す。二度目のtransaction、changed、revision増加は発生しない。hashが異なる場合409。handlerはmutate呼出前に現在の所有/共有可視性を確認し、権限失効後の古い保存済みbodyも無条件には返さない。正常commitだけを保存する。requestIdも初回のものを再返却する。

expectedRevisionは**対象entityのrevision**であり、namespace全体ではない。別placeの更新で無関係な体験の編集を失敗させない。SQLは `UPDATE ... WHERE namespace_id=? AND id=? AND revision=?`、変更件数0なら409。同時更新の片方が上書き消失しない。複数対象のpreviewではtargetごとのversionRefを固定し、全部一致した時だけ全件適用する。

同期処理はvalidate→scope→BEGIN IMMEDIATE→dedup照合→版照合→正本と関連行更新→namespace canonical_revision増分→change_events→dedup保存→COMMIT。[V2-S2] AI/外部検索中はtransactionを開かない。`db/mutation-reference.mjs`は境界の実行可能な参考実装であり各feature handlerではない。

## 4. ページと変更通知
list系はOpenAPIに定義されたfilter、`limit`、`cursor`だけを受理する。基本は(created_at,id)のkeyset昇順、cursorはその最後の組とfilter fingerprintをbase64url JSONにしたもの。改ざん耐性が必要な公開用署名は後続。フィルタが変わったcursorは400。nextCursor=nullで終端、空配列は有効。

changesはnamespace内のsequence昇順、cursorは最後のsequence。canonicalRevisionは意味/候補の入力版を表す。`invalidated`は `<projection>:<actorId>[:<entityId>]` のkeyで、意味・仮説・候補・履歴等の再取得を促す。UIはresponseに含まれるchanged対象を反映し、他画面の草稿や別namespaceのstateを消さない。通信のpoll間隔は実装上の設定であり作業時間割には使わない。

## 5. 記録・訂正・派生の契約
createExperienceはoriginalTextをEvidenceとして先に正本化し、Visit指定があればconfirmed Visit、Experienceを同一transactionで作成する。purpose/reason/context/preferenceは別field。観測から作ったcandidate Visitを通過だけでconfirmedにしない。

correctExperienceはtarget ExperienceのexpectedRevisionを照合し、originalEvidenceを更新せずCorrectionのbefore/afterを保存してcurrent fieldを更新する。field=reasonだけの変更なら用途と訪問回数が同じ限り建物本体/成長段階を変えない。派生の再計算は同じcandidate IDs・同じhard条件で説明差分を見せ、変わらなければ「変化なし」と表示する。

`scopeKind=context/global`はpreview APIで固定対象を見せ、別apply APIで参照版を照合してから適用する。本人の一言から暗黙に全記録へ適用しない。この複数対象スコープはFUT07の低優先度。

## 6. AI非同期と承認
AiInput/AiOutputはtaskで識別した7種のunion。extract / compare / recipe / discover / extension / diary / repair以外を実行しない。createAiJobで参照entity/grant/settings版とinputHashを保存し202を返す。workerがqueued→running→succeeded/failedへ更新。cancelはcanceled、再起動でrunningはinterrupted。状態はDBへ残す。

`apply`は成功jobであっても、現在のactor・scope・source権限・AI設定と各版を再確認する。変更があればstaleとして適用を拒否する。対象画面が変わっても暗黙の現在地へ適用しない。取消後の遅着やreset後の旧workerは「存在しstatus=runningの同じjob」を条件UPDATEし、レコードをupsertで復活させない。

| AI task | applyが作るもの | 正本への確定 |
|---|---|---|
| extract | proposed Interpretation | reviewInterpretationのacceptで本人承認。rejectでは正本不変 |
| compare | 根拠付きComparison | 許可投影のみ、対応否定はrejectMapping |
| recipe | Recipe草案 | 本人が役割/固定/可変を編集して採用 |
| discover | sourceを確認したDiscoveryCard | 本人操作だけをDiscoveryEvent/Interestへ |
| extension | draft ExtensionVersion | preview→validated→install、勝手に導入しない |
| diary | 未承認Diary草案 | updateDiaryによる本人承認 |
| repair | RepairProposal | approveRepairで現snapshot版を照合 |

apply済みjobにはappliedEntityIdsを保持し、別opIdで再applyされても同じ生成物を返し重複作成しない。AIが返したIDは入力scopeに含まれるものだけ参照可能。provider変更や固定結果への無断fallbackをしない。executionModeでlive/rule/replay等を区別する。

## 7. 共有・削除・asset・reset
相手の非公開原文/写真はserverのSharingPortで落とし、許可されたfieldだけSharedExperienceへ。GET原文・asset/content・export・AI入力にも同じ可視範囲を適用する。revoke後はgrantを参照した派生とAIを再検査し、本人が書いた感想は別所有として残す。

deleteExperienceはstatus=deleted、公開/派生対象から除外し、本人の削除対象に従って原文と関連AI保存textを消去する。必要な参照IDはtombstoneにするが、原文を残して「削除済み」と表示するだけにしない。他人が独立に記録した体験は消さない。アプリ外の既出exportまで回収できるとは表示しない。

画像uploadはmultipart（opId, file）、初期上限5MB、PNG/JPEG/WebPだけ。hash/content type/sizeをAssetへ、相対private保存pathをasset_storageへ。pathはAPI DTOに返さない。data/assets配下で保存し公開staticに置かない。バイナリ保存失敗ならDB行を確定しない。孤児ファイル回収は後続。

demo cloneは新namespace＋新entity IDでseedを複製する。resetはdemo namespaceだけ、expectedRevisionは現在canonicalRevision。canonicalRevision/変更sequenceを巻き戻さない。reset時は対象jobを取消/削除し旧結果をapplyできなくする。本人user namespaceや別demoは触らない。Settings/Preference/AppContextのsingletonはactor作成transactionで作り、GET時の暗黙作成をしない。

## 8. 全endpoint一覧
| Method / URI | operationId | Request → Response | 成功 | 実装task |
|---|---|---|---|---|
| GET /api/v1/health | getHealth | path/query/header → GetHealthResponse | 200 | FND-001 |
| GET /api/v1/bootstrap | getBootstrap | path/query/header → GetBootstrapResponse | 200 | UI-002 |
| GET /api/v1/settings | getSettings | path/query/header → GetSettingsResponse | 200 | PREF-001 |
| PATCH /api/v1/settings | updateSettings | UpdateSettingsRequest → UpdateSettingsResponse | 200 | PREF-001 |
| PUT /api/v1/context | putContext | PutContextRequest → PutContextResponse | 200 | UI-002 |
| GET /api/v1/places | listPlaces | path/query/header → ListPlacesResponse | 200 | PLC-001 |
| GET /api/v1/places/{placeId} | getPlace | path/query/header → GetPlaceResponse | 200 | PLC-001 |
| GET /api/v1/buildings | listBuildings | path/query/header → ListBuildingsResponse | 200 | PLC-001 |
| GET /api/v1/places/{placeId}/meaning | getMeaning | path/query/header → GetMeaningResponse | 200 | REC-005 |
| POST /api/v1/experiences | createExperience | CreateExperienceRequest → CreateExperienceResponse | 201 | REC-002 |
| GET /api/v1/experiences | listExperiences | path/query/header → ListExperiencesResponse | 200 | REC-002 |
| GET /api/v1/experiences/{experienceId} | getExperience | path/query/header → GetExperienceResponse | 200 | REC-002 |
| GET /api/v1/evidence/{evidenceId} | getEvidence | path/query/header → GetEvidenceResponse | 200 | REC-002 |
| POST /api/v1/experiences/{experienceId}/corrections | correctExperience | CorrectExperienceRequest → CorrectExperienceResponse | 200 | REC-004 |
| DELETE /api/v1/experiences/{experienceId} | deleteExperience | DeleteExperienceRequest → DeleteExperienceResponse | 200 | REC-002 |
| POST /api/v1/correction-previews | previewCorrections | PreviewCorrectionsRequest → PreviewCorrectionsResponse | 201 | FUT07 |
| POST /api/v1/correction-previews/{previewId}/apply | applyCorrections | ApplyCorrectionsRequest → ApplyCorrectionsResponse | 200 | FUT07 |
| POST /api/v1/observations/import | importObservations | ImportObservationsRequest → ImportObservationsResponse | 201 | REC-007 |
| GET /api/v1/visits | listVisits | path/query/header → ListVisitsResponse | 200 | REC-007 |
| PATCH /api/v1/visits/{visitId} | updateVisit | UpdateVisitRequest → UpdateVisitResponse | 200 | REC-007 |
| GET /api/v1/history | getHistory | path/query/header → GetHistoryResponse | 200 | SELF-003 |
| GET /api/v1/hypotheses | listHypotheses | path/query/header → ListHypothesesResponse | 200 | SELF-003 |
| PUT /api/v1/preferences | putPreference | PutPreferenceRequest → PutPreferenceResponse | 200 | SELF-003 |
| PATCH /api/v1/hypotheses/{hypothesisId} | reviewHypothesis | ReviewHypothesisRequest → ReviewHypothesisResponse | 200 | SELF-003 |
| POST /api/v1/diaries | createDiary | CreateDiaryRequest → CreateDiaryResponse | 201 | MEDIA-002 |
| GET /api/v1/diaries | listDiaries | path/query/header → ListDiariesResponse | 200 | MEDIA-002 |
| PATCH /api/v1/diaries/{diaryId} | updateDiary | UpdateDiaryRequest → UpdateDiaryResponse | 200 | MEDIA-002 |
| POST /api/v1/assets | uploadAsset | multipart → UploadAssetResponse | 201 | MEDIA-001 |
| GET /api/v1/assets/{assetId} | getAsset | path/query/header → GetAssetResponse | 200 | MEDIA-001 |
| GET /api/v1/assets/{assetId}/content | getAssetContent | path/query/header → binary | 200 | MEDIA-001 |
| GET /api/v1/export | exportOwnData | path/query/header → ExportOwnDataResponse | 200 | PREF-001 |
| POST /api/v1/candidate-sets | createCandidateSet | CreateCandidateSetRequest → CreateCandidateSetResponse | 201 | RTE-003 |
| GET /api/v1/candidate-sets/{candidateSetId} | getCandidateSet | path/query/header → GetCandidateSetResponse | 200 | RTE-003 |
| POST /api/v1/routes | planRoute | PlanRouteRequest → PlanRouteResponse | 201 | RTE-003 |
| GET /api/v1/routes/{routeId} | getRoute | path/query/header → GetRouteResponse | 200 | RTE-003 |
| PATCH /api/v1/routes/{routeId} | setRouteState | SetRouteStateRequest → SetRouteStateResponse | 200 | RTE-003 |
| POST /api/v1/quests | createQuest | CreateQuestRequest → CreateQuestResponse | 201 | RTE-003 |
| PATCH /api/v1/quests/{questId} | updateQuest | UpdateQuestRequest → UpdateQuestResponse | 200 | RTE-003 |
| GET /api/v1/passes | listPasses | path/query/header → ListPassesResponse | 200 | RTE-005 |
| POST /api/v1/passes | createPass | CreatePassRequest → CreatePassResponse | 201 | RTE-005 |
| PATCH /api/v1/passes/{passId} | updatePass | UpdatePassRequest → UpdatePassResponse | 200 | RTE-005 |
| DELETE /api/v1/passes/{passId} | deletePass | DeletePassRequest → DeletePassResponse | 200 | RTE-005 |
| GET /api/v1/shared-experiences | listSharedExperiences | path/query/header → ListSharedExperiencesResponse | 200 | SOC-002 |
| POST /api/v1/share-grants | createShareGrant | CreateShareGrantRequest → CreateShareGrantResponse | 201 | SOC-002 |
| POST /api/v1/share-grants/{grantId}/revoke | revokeShareGrant | RevokeShareGrantRequest → RevokeShareGrantResponse | 200 | SOC-002 |
| POST /api/v1/comparisons | createComparison | CreateComparisonRequest → CreateComparisonResponse | 201 | SOC-005 |
| GET /api/v1/comparisons/{comparisonId} | getComparison | path/query/header → GetComparisonResponse | 200 | SOC-005 |
| PATCH /api/v1/comparisons/{comparisonId} | rejectMapping | RejectMappingRequest → RejectMappingResponse | 200 | SOC-005 |
| POST /api/v1/recipes | createRecipe | CreateRecipeRequest → CreateRecipeResponse | 201 | TRF-001 |
| GET /api/v1/recipes/{recipeId} | getRecipe | path/query/header → GetRecipeResponse | 200 | TRF-001 |
| PATCH /api/v1/recipes/{recipeId} | updateRecipe | UpdateRecipeRequest → UpdateRecipeResponse | 200 | TRF-001 |
| POST /api/v1/transfers | planTransfer | PlanTransferRequest → PlanTransferResponse | 201 | TRF-003 |
| GET /api/v1/transfers/{transferId} | getTransfer | path/query/header → GetTransferResponse | 200 | TRF-003 |
| POST /api/v1/joint-plans | createJointPlan | CreateJointPlanRequest → CreateJointPlanResponse | 201 | SOC-007 |
| GET /api/v1/joint-plans/{jointPlanId} | getJointPlan | path/query/header → GetJointPlanResponse | 200 | SOC-007 |
| POST /api/v1/feedback | createFeedback | CreateFeedbackRequest → CreateFeedbackResponse | 201 | SOC-008 |
| GET /api/v1/feedback | listFeedback | path/query/header → ListFeedbackResponse | 200 | SOC-008 |
| POST /api/v1/discoveries | openDiscovery | OpenDiscoveryRequest → OpenDiscoveryResponse | 201 | DISC-003 |
| GET /api/v1/discoveries/{cardId} | getDiscovery | path/query/header → GetDiscoveryResponse | 200 | DISC-003 |
| POST /api/v1/discoveries/{cardId}/events | recordDiscoveryEvent | RecordDiscoveryEventRequest → RecordDiscoveryEventResponse | 201 | DISC-003 |
| GET /api/v1/interests | listInterests | path/query/header → ListInterestsResponse | 200 | DISC-003 |
| GET /api/v1/extensions | listExtensions | path/query/header → ListExtensionsResponse | 200 | EXT-002 |
| POST /api/v1/extensions | createExtension | CreateExtensionRequest → CreateExtensionResponse | 201 | EXT-002 |
| POST /api/v1/extensions/{extensionId}/versions | createExtensionVersion | CreateExtensionVersionRequest → CreateExtensionVersionResponse | 201 | EXT-002 |
| GET /api/v1/extensions/{extensionId}/versions | listExtensionVersions | path/query/header → ListExtensionVersionsResponse | 200 | EXT-002 |
| POST /api/v1/extension-versions/{versionId}/preview | previewExtension | PreviewExtensionRequest → PreviewExtensionResponse | 201 | EXT-002 |
| POST /api/v1/extension-installs | installExtension | InstallExtensionRequest → InstallExtensionResponse | 201 | EXT-002 |
| GET /api/v1/extension-installs | listInstalls | path/query/header → ListInstallsResponse | 200 | EXT-002 |
| PATCH /api/v1/extension-installs/{installId} | updateInstall | UpdateInstallRequest → UpdateInstallResponse | 200 | EXT-002 |
| POST /api/v1/extension-installs/{installId}/rollback | rollbackInstall | RollbackInstallRequest → RollbackInstallResponse | 200 | EXT-002 |
| POST /api/v1/extension-installs/{installId}/run | runExtension | RunExtensionRequest → RunExtensionResponse | 201 | EXT-002 |
| POST /api/v1/sources | createSource | CreateSourceRequest → CreateSourceResponse | 201 | DATA-002 |
| POST /api/v1/sources/{sourceId}/snapshots | createSnapshot | CreateSnapshotRequest → CreateSnapshotResponse | 201 | DATA-002 |
| POST /api/v1/repairs | createRepair | CreateRepairRequest → CreateRepairResponse | 201 | DATA-002 |
| GET /api/v1/repairs/{repairId} | getRepair | path/query/header → GetRepairResponse | 200 | DATA-002 |
| POST /api/v1/repairs/{repairId}/approve | approveRepair | ApproveRepairRequest → ApproveRepairResponse | 200 | DATA-002 |
| POST /api/v1/ai/jobs | createAiJob | CreateAiJobRequest → CreateAiJobResponse | 202 | AI-002 |
| GET /api/v1/ai/jobs/{jobId} | getAiJob | path/query/header → GetAiJobResponse | 200 | AI-002 |
| POST /api/v1/ai/jobs/{jobId}/cancel | cancelAiJob | CancelAiJobRequest → CancelAiJobResponse | 200 | AI-002 |
| POST /api/v1/ai/jobs/{jobId}/apply | applyAiJob | ApplyAiJobRequest → ApplyAiJobResponse | 200 | AI-002 |
| POST /api/v1/interpretations/{interpretationId}/review | reviewInterpretation | ReviewInterpretationRequest → ReviewInterpretationResponse | 200 | AI-002 |
| GET /api/v1/experiences/{experienceId}/questions | listExperienceQuestions | path/query/header → ListExperienceQuestionsResponse | 200 | AI-008 |
| GET /api/v1/experiences/{experienceId}/question-responses | listQuestionResponses | path/query/header → ListQuestionResponsesResponse | 200 | AI-008 |
| POST /api/v1/questions/{questionId}/responses | respondToQuestion | RespondToQuestionRequest → RespondToQuestionResponse | 200 | AI-008 |
| POST /api/v1/development-requests | createDevelopmentRequest | CreateDevelopmentRequestRequest → CreateDevelopmentRequestResponse | 201 | DEV-001 |
| GET /api/v1/development-requests/{requestId} | getDevelopmentRequest | path/query/header → GetDevelopmentRequestResponse | 200 | DEV-001 |
| POST /api/v1/demo/namespaces | cloneDemo | CloneDemoRequest → CloneDemoResponse | 201 | DEMO-001 |
| POST /api/v1/demo/reset | resetDemo | ResetDemoRequest → ResetDemoResponse | 201 | DEMO-001 |
| GET /api/v1/changes | getChanges | path/query/header → GetChangesResponse | 200 | FND-002 |

具体的field例は `examples/http/*.json`、連続操作例は `examples/record-flow.json`。endpointの実装taskは担当者ではなく取得可能なタスクIDである。API契約を分割してもDB全体の新規設計を各人にやり直させない。

## 9. Exportの復元境界
ExportBundleはnamespace/contextと参照先Place/Building/Extension定義も含む。本人以外のprivate entityは投影で除外する。Assetはメタデータでありバイナリそのものではない。端末外で写真まで復元する完全backupはFUT02でバイナリを同梱した別archiveを作る。JSON単体を完全な写真backupとは表示しない。

## v2.1：経路と任意の質問

RouteLegにedgeCoverage/edgeFacts/transit/passAssessmentsを追加した。ConstraintPortへ道中の情報を渡す。判定規約はROUTE_CONSTRAINT_FLOW.md。

extract inputはexperienceIdとquestionResponseIds、output.questionはQuestionProposalまたはnull。applyはQuestionPortを同じtransactionで呼ぶ。listExperienceQuestions/listQuestionResponses/respondToQuestionの保存・再送・版照合・スキップの規約はQUESTION_FLOW.md。質問回答は正本原文を上書きせず新Evidenceとして保存する。

API clientはOperationMapに従いpath/query/bodyを分離。opIdは論理操作の開始で生成して再送では保持し、expectedRevisionは編集開始時の対象版を使う。再送時に最新revisionへ黙って差し替えない。


---

## 収録：DB_SCHEMA.md

# SQLite DB仕様 v2

## 1. 正本と実行環境
SQLiteを唯一の正本とし、JSONはexport/seed/HTTP輸送に使う。`db/schema.sql`を空DBへ1回適用する。40業務テーブル＋4制御テーブル＝44（SQLite内部sequence表は除く）。`DB_COLUMNS.csv`は業務テーブルの506列についてHTTP field、SQL型、null可否、nested schema、FKを示す。テーブルを全部UI化する前提ではなく、1回のDDLで空の領域を確保する。

Node 22.22.1組込み `node:sqlite` のDatabaseSyncを選ぶ。この版ではExperimentalであり、本番推奨の主張ではない。[V2-S1] 既存の外部ORMやnative addonを立上げずに短いtransactionとFKを利用するためのコンペ向け判断。Bunはinstall/script起動に使い、APIプロセスはNodeで動かす。複数Nodeが同じファイルを無秩序に書く構成は採らない。

接続ごとにforeign_keys=ON、busy_timeout=3000を設定し、ファイルDBはWAL。SQLiteは同時に1writerであり、DBが並列コード開発を直列化するわけではない。[V2-S2] AI待機をtransactionの外に出す。PRAGMA値はデータ競合対策であり、開発時間割ではない。

## 2. 共通列
全業務entityはnamespace_id,id,revision,created_at,updated_at,source_modeを持つ。PKは(namespace_id,id)。actor所属のentityは(namespace_id,actor_id)のFKで同namespaceを保証する。IDを全世界一意と仮定してnamespace条件を省略しない。

revisionはentityごとの楽観ロックで1から。timestampsはアプリがUTC RFC3339を生成する。SQL DEFAULTで架空の日時/情報源を埋めない。enum・数値範囲・bool・json_validはDDLで検査し、JSON内部のfield/ID/単位はschemaとサービスで検査する。

nested構造は `_json TEXT` に格納するが、自由な辞書ではない。例：places.facts_jsonはPlaceFacts、experiences.context_jsonはContext、ai_jobs.scope_jsonはScope。JSON内のID配列すべてにSQL FKがあるわけではないので、同namespace・所有・grant参照をアプリ境界で検証する。純関数へ渡す前にJSON Schemaで復号値を検査する。

## 3. 全業務テーブル
| table | API DTO | 列数 | 主な複合FK |
|---|---|---|---|
| actors | Actor | 8 | namespaceのみ |
| settings | Settings | 14 | actors(namespace_id,id) |
| app_contexts | AppContextEntity | 8 | actors(namespace_id,id) |
| sources | Source | 10 | namespaceのみ |
| buildings | Building | 11 | sources(namespace_id,id) |
| places | Place | 16 | buildings(namespace_id,id) |
| evidence | Evidence | 11 | actors(namespace_id,id), sources(namespace_id,id), assets(namespace_id,id) |
| observations | Observation | 15 | actors(namespace_id,id), sources(namespace_id,id) |
| visits | Visit | 12 | actors(namespace_id,id), places(namespace_id,id) |
| experiences | Experience | 17 | actors(namespace_id,id), places(namespace_id,id), visits(namespace_id,id), evidence(namespace_id,id) |
| corrections | Correction | 13 | actors(namespace_id,id), experiences(namespace_id,id), evidence(namespace_id,id) |
| correction_previews | CorrectionPreview | 12 | actors(namespace_id,id) |
| interpretations | Interpretation | 14 | actors(namespace_id,id), experiences(namespace_id,id), ai_jobs(namespace_id,id) |
| follow_up_questions | FollowUpQuestion | 14 | actors(namespace_id,id), experiences(namespace_id,id), ai_jobs(namespace_id,id) |
| question_responses | QuestionResponse | 11 | actors(namespace_id,id), follow_up_questions(namespace_id,id), experiences(namespace_id,id), evidence(namespace_id,id) |
| profile_hypotheses | Hypothesis | 14 | actors(namespace_id,id) |
| preferences | Preference | 11 | actors(namespace_id,id) |
| candidate_sets | CandidateSet | 11 | actors(namespace_id,id) |
| route_plans | RoutePlan | 16 | actors(namespace_id,id) |
| passes | Pass | 14 | actors(namespace_id,id) |
| quests | Quest | 10 | actors(namespace_id,id), route_plans(namespace_id,id) |
| share_grants | ShareGrant | 13 | actors(namespace_id,id) |
| comparisons | Comparison | 12 | actors(namespace_id,id) |
| recipes | Recipe | 12 | actors(namespace_id,id) |
| transfer_plans | TransferPlan | 16 | actors(namespace_id,id), recipes(namespace_id,id), candidate_sets(namespace_id,id), route_plans(namespace_id,id) |
| joint_plans | JointPlan | 11 | actors(namespace_id,id), route_plans(namespace_id,id) |
| feedback | Feedback | 15 | actors(namespace_id,id), experiences(namespace_id,id), transfer_plans(namespace_id,id) |
| discovery_cards | DiscoveryCard | 16 | actors(namespace_id,id) |
| discovery_events | DiscoveryEvent | 10 | actors(namespace_id,id), discovery_cards(namespace_id,id) |
| interests | Interest | 10 | actors(namespace_id,id), discovery_events(namespace_id,id) |
| diaries | Diary | 13 | actors(namespace_id,id), ai_jobs(namespace_id,id) |
| assets | Asset | 11 | actors(namespace_id,id) |
| extensions | Extension | 11 | actors(namespace_id,id) |
| extension_versions | ExtensionVersion | 13 | actors(namespace_id,id), extensions(namespace_id,id) |
| extension_installs | ExtensionInstall | 12 | actors(namespace_id,id), extensions(namespace_id,id), extension_versions(namespace_id,id) |
| extension_runs | ExtensionRun | 12 | actors(namespace_id,id), extension_versions(namespace_id,id) |
| source_snapshots | SourceSnapshot | 14 | sources(namespace_id,id) |
| repair_proposals | RepairProposal | 14 | actors(namespace_id,id), sources(namespace_id,id), source_snapshots(namespace_id,id) |
| ai_jobs | AiJob | 15 | actors(namespace_id,id) |
| development_requests | DevelopmentRequest | 14 | actors(namespace_id,id) |

## 4. 制御テーブル

| Table | 列 / 制約 | 用途 |
|---|---|---|
| namespaces | id TEXT PK, kind user/demo, canonical_revision INTEGER>=0, seed_version nullable | 本人とサンプルを分離、派生の入力版 |
| request_dedup | namespace_id,actor_id,op_idがPK; payload_hash TEXT,http_status INTEGER,response_json TEXT,created_at TEXT; actorへFK | 同じ操作の再送に初回結果を返す |
| change_events | sequence INTEGER PK AUTOINCREMENT,namespace_id,actor_id,canonical_revision,changed_json,invalidated_json,created_at | commit済み変更を順序付き通知 |
| asset_storage | namespace_id,asset_idがPK/FK; relative_path TEXT | 公開しない画像ファイル場所 |

schema.sql内で追加indexを固定済み。settings/app_contexts/preferencesは(namespace_id,actor_id)をunique。観測は(namespace,actor,source,source_record_id)をunique。関心は(namespace,actor,concept)、導入は(namespace,actor,extension)、拡張版は(namespace,extension,version_tag)をuniqueにする。

## 5. 記録transactionの具体例

1. scope・placeを確認。originalText→Evidence行を作り、Visit指定があればconfirmed Visitを作る。
2. Experienceにoriginal_evidence_idを持たせ、purpose/reason/contextを分けて保存する。
3. correction時はcurrent revisionを照合しbefore/afterをCorrectionへ、Experienceの対象fieldだけを更新する。
4. namespace canonical_revisionを1増加しchange_eventsとrequest_dedupを同一commitで保存する。
5. Meaningは正本のquery投影。仮説と候補の保存済み計算はinputRevision/参照版で古さを検出する。原文を派生結果で上書きしない。

```sql
BEGIN IMMEDIATE;
UPDATE experiences
SET reason = ?, revision = revision + 1, updated_at = ?
WHERE namespace_id = ? AND id = ? AND revision = ?;
-- changes()が0ならROLLBACKし409。続けてCorrection/changed/dedupを保存。
COMMIT;
```

上は楽観更新の部分例であり完全handlerではない。実行可能なtransaction/dedup参考は `db/mutation-reference.mjs`。FKとsingleton/uniqueはDDLに、意味的整合はfeature handlerに分担する。

## 6. 更新・削除・再計算
FKは同namespaceの参照を保つ。全削除へCASCADEを広く付けて他人の体験を消すことはしない。本文削除と参照tombstoneの規約はAPI_CONTRACTの削除節。job・preview・recipe・transferの参照版は明示保存して古いものの適用を拒否する。

seedは `examples/seed-core.json` の最小actor/settings/context/preferenceから始める。fixtureの2都市/他者/道路はFND-004/POOL taskが拡張する。ここに含まれる緯度経度や場所名はサンプルで現実案内のデータではない。resetでnamespaceのrevisionを0へ戻さない。

既存DBへの再実行はしない。FUT02のmigrationではschema_versionを管理してexport→新DB→検証→切替を行う。JSON snapshotを無理に経由して毎mutationで全DBを書き出す実装は廃止。将来DBのJSON配列を中間tableへ正規化する時もHTTP DTOを保持し、adapterのみ変更できる。

## v2.1の質問テーブル

follow_up_questionsはactor/experience/jobの参照とdedup_keyを持ち、(namespace_id,actor_id,dedup_key)がunique。question_responsesはquestion/experience/answer_evidenceを参照する。回答・後回し・スキップを別イベントとして保持する。回答原文はEvidenceに置き、更新ではなく追加する。参照版の照合とstatus遷移はQUESTION_FLOW.mdに従う。

RouteLegの追加factsはroute_plans.legs_jsonの型付き内容に入る。DB列を別々に追加する必要はないが、DTO復号時にv2.1 schemaを検証する。


---

## 収録：QUESTION_FLOW.md

# 任意の質問・回答・再抽出

v2のquestion文字列をQuestionProposal {topic,text}へ変更した。既存v2とはwire互換ではない。改訂版の型・API・生成器を一緒に配布する。現行アプリや既存DBへの自動移行は行わない。

## 保存対象と取得

FollowUpQuestionは質問本文、対象Experience、jobId（ルール質問ならnull）、topic、入力版、dedupKey、open/answered/deferred/skipped/staleを持つ。QuestionResponseは回答・後回し・スキップの不変イベントで、回答時だけanswerEvidenceIdを持つ。本人の回答は新しいEvidence.textへ保存し、Experience.originalEvidenceIdの原文を上書きしない。

`GET /experiences/{experienceId}/questions` と `GET /experiences/{experienceId}/question-responses`（いずれも/api/v1配下）で状態を復元する。回答本文は認可されたgetEvidenceで読む。質問とイベントも本人exportに含める。共有時は本人の回答を自動公開しない。Experience削除時の原文消去規約は回答Evidenceとjobの保存入力にも適用する。

## 質問を作る

AI-002のextract applyと同じtransaction内でQuestionPort.proposeを呼ぶ。入力はscope、現在のExperience、QuestionProposal、検証済みinputVersions、now、生成済みquestionId、実行元に対応するsourceMode。AIやHTTPはこのtransaction内で呼ばない。

dedupKeyはcanonical JSON `{namespaceId,actorId,experienceId,originalEvidenceId,topic}` のSHA-256。質問の言い回しや毎回増えるjobIdをキーにしない。同じキーがある場合、状態にかかわらず新しい質問を作らずnullを返す。既存openは一覧から開ける。answered/skippedを再入場でopenに戻さない。別の質問を本人が明示要求する高度な経路は後続で定義し、通常の再抽出で繰り返さない。

## 回答・後回し・スキップ

`POST /questions/{questionId}/responses` は `{opId,expectedRevision,payload}`。expectedRevisionは質問の版。payloadは `action=answered` と空白でないanswerText、または `action=deferred/skipped` とanswerText=null。JSON Schemaに加えtrim後空文字を422で拒否する。

scope確認→dedup→質問版と対象Experienceの参照版照合→必要なら新Evidence→QuestionResponse→質問のstatus/revision→回答EvidenceをExperience.evidenceIdsへ追加→changed/invalidated→commit。回答時のみExperienceのrevisionも増える。用途・理由・本人の好みはこの操作だけで変更しない。同opIdの再送は同じ結果、古い質問版は409、異なる体験の質問参照は拒否する。

open→answered/deferred/skipped、deferred→answered/skipped、skipped→answered（本人が一覧で明示的に答えた時だけ）を許す。answeredへの別opIdの再回答は409で拒否する。回答訂正を実装する場合は元Evidenceを更新せず新イベントを追加する別契約が必要。入力版が古い質問への新回答はSTALE_INPUTで草稿を保持する。既存の回答を消さない。

## 回答を使って再抽出

回答保存後、本人が「この回答で解釈を更新」を選ぶと、createAiJobのextract inputへexperienceIdとquestionResponseIdsを渡す。サーバーはIDが同じactor/namespace/Experienceに属しaction=answeredであることを確認し、元原文と回答Evidenceを解決する。clientの任意本文を保存済み原文として扱わない。

scope.entityVersionsには現在のExperience、QuestionResponse、回答Evidenceの版を含める。受信後の版照合と本人確認を経てInterpretationを提案する。回答保存や再抽出だけで用途・理由を自動確定しない。answered/deferred/skippedは再抽出の成否にかかわらず残る。

`examples/question-flow.json` が質問→回答保存→再抽出入力→再入場の同じIDを使った例。`tools/test_questions.mjs` はローカルDB参考実装の確認であり、INT-016のライブCodex確認を代替しない。


---

## 収録：ROUTE_CONSTRAINT_FLOW.md

# 経路から制約へ渡す情報

RouteLegにedgeCoverage、edgeFacts、transit、passAssessmentsを追加した。経路計算側は採用したedgeを確定し、そのedgeのfactsと出典をRouteLegへ投影する。ConstraintPortはこの投影を受け取るため、目的地のPlaceFactsだけで道中の条件を判断しない。

## 階段・屋根・車種

- edgeCoverage=completeは、そのlegの全区間がedgeFactsに対応している場合だけ。通常の非零距離legで空配列ならcompleteを拒否する。
- 各edgeはstairs、coveredをKnownBool、車種別通行条件をVehicleAccessFact[]で持つ。GraphEdgeのnullはunknown、vehicleClasses=nullもunknown。空の既知配列は許可車種なしでありunknownと区別する。
- 有効期限切れの事実は判定時点でunknownとして扱う。未知をfalseへ変換してfilterしない。
- avoidStairsでは一つでも既知stairs=trueならfail。既知違反がなく、欠落・unknownがあればunknown。全区間を確認でき、すべてfalseならpass。
- requireCoveredでは一つでも既知covered=falseならfail。欠落・unknownだけならunknown。全区間がknown trueならpass。
- vehicleClassは対応するVehicleAccessFactを使い、該当classの情報欠落はunknown。歩行者条件から大型二輪の通行可否を推測しない。

既知違反を含む候補は経路選択から除外する。未知を含む候補を診断用に残す場合はfeasibility=unknownとし、条件を満たす経路として採用させない。no-routeとunknownは別。各結果はsourceIdsを引き継ぐ。

## 交通と定期券

transit legにはoperatorCode、lineCode、乗降stationCode、viaStationCodes、出発・到着時刻とprovenanceを持つ。徒歩のlegではtransit=null。交通の情報が未取得ならtransit=nullとし、定期の適用はunknownにする。

PassAssessmentはpassId、適用可否KnownBool、控除後の追加運賃KnownMoney、根拠を持つ。経路provider/運賃adapterが実区間と有効期間を照合して作り、純粋なConstraintPortへ渡す。駅名の一致だけで無料としない。情報未取得を0円にしない。複数定期券を組み合わせる運賃を取得できない場合は、単一券の評価を単純加算せずunknownを返す。

RouteLeg.costは採用した適用条件を反映した追加費用。既知の運賃は出典を持ち、passAssessmentsと一致させる。追加運賃を得られない場合はRouteLeg.costもunknown。実交通providerの接続は元の後続方針を維持する。

`examples/route-constraint-cases.json` は目的地の屋根状態を同じに保ち、道中の屋根だけを変える反例、および定期区間の既知/不明例。`tools/test_route_constraints.ts` は追加した受渡しの参考計算だけを確認する。全経路機能・実災害案内・実交通の成功を意味しない。


---

## 収録：PRODUCT_AND_UX.md

# 製品・UX仕様

## 1. 情報設計を決める

下部ナビは **地図 / みんな / 機能 / 自分**。既存GUIの柔らかな地図・カード・モーダルの構成を残しつつ、役割が短い語で分かる名前へ整理する。4つの価値は保持するが、昔の指定順を制約にしない。初回の「歩くほど、自分が見える。」に相当する導入は地図タブ内のホームSheetとし、第五のメイン画面や必須オンボーディングを増やさない。設定で次回「地図直行/ホームを開く」を保存。

全画面で同じ `AppContext` を渡す。場所、体験、日付、相手、採用中ルート、AI送信時の参照範囲は明示的なID。移動先画面が足りない情報を暗黙の「現在地」から補ってはいけない。戻る時は入力草稿・スクロール・カメラを維持する。

## 2. 画面構成と機能境界

| 画面/Sheet | 入口と主要操作 | 保存されるもの | 閉じた後の反映 | 関連task群（取得者は未定） |
|---|---|---|---|---|
| S01 地図/Home | 場所選択、現在地、3D、レンズ、記録、発見 | camera/selectedPlace、操作設定 | 他画面も同じ場所を参照 | MAP / UI |
| S02 場所詳細 | 一般情報/自分の意味/共有された意見、記録・比較・移す | 詳細自体は投影。編集は専用API mutation | 意味変更は地図と自分に通知 | PLC / MAP |
| S03 記録 | 今/過去、場所・時刻・用途・原文・条件、保存 | Observation候補、Visit、Experience、Evidence | 建物・履歴・Profileを再計算 | REC |
| S04 AI/根拠/訂正 | 対象チップ、原文、解釈、訂正範囲、任意1問 | original先行、Interpretation、Correction、Job | 同じscope/revisionだけへ適用 | REC / AI |
| S05 自分/振り返り | 今日/日/月、再生、傾向、反例、今の希望、日記 | 日記は承認版、希望・Interest / DiscoveryEvent | 次の候補/地図意味/質問へ | SELF / MEDIA / MAP |
| S06 見方をひらく | 対象→特徴→知識→観察、既知/気になる/閉じる | DiscoveryEvent/Interest / DiscoveryEvent | 自分の関心一覧、再提示制御 | DISC |
| S07 みんな/検索 | 目的・場所・人物・日時条件、食べ方等のコツ | 検索条件、保存した体験参照 | 比較/ルート/移植へ渡す | SOC / PLC |
| S08 比較/相手レンズ | 同じ場所の違い、違う場所の共通役割、対応訂正 | Comparison、Comparison.rejectedMappingIds | 相手レンズで地図へ戻る | SOC / MAP |
| S09 体験レシピ/移植 | 役割順序、固定/可変、移植先、忠実/自分向け | Recipe、TransferPlan、差分、制約 | RoutePlan/Questへ | TRF |
| S10 経路/共同案 | 2人の希望、徒歩/交通、寄り道、定期券、採用/後で | Pass、RoutePlan、Quest状態 | 地図案内、確定訪問後Feedback | RTE / SOC |
| S11 感想を返す | 残した/変えた/合った/合わなかった/見送り理由 | 自分のExperienceとFeedback | 自分の理解と元体験の許可済み返信 | SOC |
| S12 機能ストア/Studio | 探す、入力、生成、プレビュー、修正、導入、戻す | Definition、Artifact、Install、State | 地図/自分のhost slotに新カード | EXT / AI |
| S13 情報を直す | データ取込/更新差分、列対応、3行preview、承認 | SourceSnapshot、RepairProposal、adapterVersion | 正規化factsから表示再計算 | DATA |
| S14 設定/出力 | 全停止・探索opt-in・共有範囲・出力・デモreset | Settings、ShareGrant | 待機Jobも現在設定でcommit判断 | PREF / DEMO / SOC |

S01/S05/S07/S12だけがタブのページ。残りは同じSheet/DetailPanelを再利用する。別ルーター/別フォームライブラリを各取得者が持ち込まない。

## 3. 見た目の仕様

入力スクリーンショットのミント、クリーム、丸いカード、森色の主要ボタンを参照。主背景 `#F4F7EF`、地図の低彩度緑、文字 `#243B30`、主操作 `#426B4D`、補助面 `#FFFFFF`、発見のアクセントは柔らかい黄。これは提案するデザイントークンであり元画像の厳密な抽出値ではない。

390×844では左右余白16px、カード角丸20px、Sheet角丸24px、本文16px・補足13px、見出し22/28px。最小の押せる領域は44pxを目標とする。下部ナビ64px＋safe-area、地図操作は右上縦列、1枚のSheetがナビと重ならない。長文は最初の2行＋「根拠を見る」。Map上に本文を何段も重ねない。

建物は種類ごとに輪郭が異なる。学ぶ＝開いた本の2枚の表紙と紙束、相談/会話＝重なる吹出しの建物、休息＝段状の庭/中庭。再訪は植栽・縁取り・灯り・増えた小さな装飾で表す。実建物高さを回数で伸ばして現実の高さと誤解させない。

人物は白灰の低ポリゴンで、性別や性格のラベルを持たない。静止時は静止する。アニメは180〜450msの状態変化を中心にし、最初から物理演算、複雑なrig、常時パーティクルを入れない。体験IDに触れた時に関連カードが同色で短く強調され、何がつながったかが分かるようにする。

## 4. 一連の主要体験

### T1 初回・地図を育てる

履歴0のホーム→地図で場所を選択→場所詳細の「ここで過ごした」→「今/過去」を選ぶ→用途・理由を入力→保存→その建物が本体形状を持つ→自分タブに今日の記録が出る。友人や位置権限を要求せず成立。AIを使うなら原文の保存後に解釈が提案され、用途を自分で選ぶ道も同じ画面に置く。

時間が不明なら「9月上旬・夕方」程度の概略表現と精度を保存。12:00のような架空の正確な時刻へ変換しない。場所不明の写真は未関連のまま保存できる。

### T2 訂正が効く自己理解

自分の記録→「この解釈は違う」→対象は既定で**この体験のみ**→原文を残し、「静かさではなく、雨を避けて座れたことが大事」と訂正→「更新されたもの：場所の理由／雨の日の仮説／同じ候補の説明」を表示→次の提案が同じ候補ID集合で再評価される。

理由訂正だけなら用途の本体は変わらなくても正しい。用途まで訂正した場合だけ形状も変える。無関係な訂正で順位を強制的に変更しない。過去の記録の原文や相手の理由を書き換えない。

### T3 見方をひらく

選んだ建物または写真→「見方をひらく」→短い発見カード→対象の何を見れば理解できるかが分かる→「知っていた/気になる/保存/今回は閉じる」→新たな関心として自分へ戻る。次の店舗推薦は副次的な行動であり、発見そのものは観察・理解・知りたい気持ちに価値がある。

通知は自分から開くのが基本。自動提案は明示opt-in、現在の受け入れ意思、余裕の3条件が揃う時だけ。予定に空白があるだけで割り込まない。

### T4 他者の体験を別の街へ

みんなで「雨の日に考えを整理」を検索→同じ場所で友人は「話しながら整理」していることを比較→レシピを開く→「落ち着く場所→考えを言葉にする→少し歩く」の順を保って東京へ→忠実さと自分向けを切替→屋内席が不明な候補は実行可能と扱わない→案を選ぶ→実践後、自分の感想を返信する。

当日の相手はサンプル人物、対象店舗は架空店舗であることを保持。本物の友人との通信は後続。体験を移しても、その相手と過ごした記憶は複製できないことを差分カードに残す。

### T5 自分用機能がアプリへ入る

機能→「雨の日だけ、屋根と座席の情報がある候補を見たい」→DSL定義→候補を使うプレビュー→「寄り道15分も追加」→新しい版で計算→有効化→地図の機能カードから入力を変える→結果が変わる→無効化/旧版へ戻す。

入力にない新計算を求めた時は「この版の組合せでは計算できない。開発依頼書を作る」を出す。正常成功に偽装せず、後続のコードプラグインと本体改造へ継ぐ。

## 5. 全機能の状態遷移

| 対象 | 状態 | 重要な境界 |
|---|---|---|
| 位置→訪問 | observed → candidate → confirmed/rejected → corrected/deleted | observedやcandidateでは建物を育てない |
| 体験 | draft → original_saved → interpretation_proposed → accepted/corrected | AI失敗でもoriginal_savedを戻さない |
| AI | queued → running → succeeded/failed/canceled/interrupted/stale | canceled/staleは画面へ勝手に適用しない |
| 経路/Quest | draft → validated → selected/later/rejected → visited/expired | selectedは訪問済みではない |
| 共有 | private → preview → published → revoked | 管理外コピー消去を保証しない |
| 比較 | proposed → accepted/rejected → stale | 同じ根拠版の却下対応を勝手に復活させない |
| 発見 | generated → shown → read。saved/known/interestingは独立event | shownだけで興味を断定しない |
| 日記 | draft → edited → approved | 事実の正本はExperience/Visitに残る |
| 拡張 | generated → validated → previewed → enabled → disabled/rolled_back | 未preview版を黙って導入しない |
| 修復 | detected → proposed → previewed → approved/applied/rejected | 単位変化は普通の列名修復ではない |

## 6. 空状態と失敗からの復帰

| 状況 | 表示すること | すぐできる操作 | 保持するもの |
|---|---|---|---|
| 初回0件 | 「場所を選ぶだけで始められる」 | 手動記録/公開sample/発見 | 設定と草稿 |
| 位置権限なし | 「現在地は取得していません」 | 地図選択/仮想歩行を明示選択 | 記録機能全部 |
| 背景地図失敗 | 通信不可、現実背景未取得 | 再試行/サンプル街区を開く | 訪問・意味・選択 |
| AI待ち | 何を参照して何を生成中か | 別画面へ/取消/手動入力 | 原文とscope |
| AI認証/制限 | 理由を短く表示 | 再試行/手動/明示リプレイ | 二重保存防止key |
| 古いAI結果 | 「途中で条件が変わりました」 | 新条件で再計算 | 元結果は非適用状態 |
| 保存競合 | 「別の編集があります」 | 最新を読む/自分の入力を再適用 | 自分の草稿 |
| 候補なし | 満たせない条件/不明情報 | 調整案を本人が選ぶ/保留 | 元の必須条件 |
| 経路API不可 | 案内未取得 | 再試行/時刻付き保存済み結果 | 直線は案内しない |
| 共有取消 | 元情報が非公開になった | 自分の実体験だけを見る | 自分の感想/訪問 |
| 拡張失敗 | 最後の正常版と失敗段階 | 無効化/旧版/修正 | 本体記録と設定 |

## 7. スクリーンショットから引き継ぐ点・変える点

引き継ぐのは柔らかな街、ホームの高揚感、3D操作の浮遊ボタン、比較カード、Replay/Day/Month、制作Studioの入力→下書き→導入の配置。変えるのは、理由の根拠を生IDから原文へ、未接続の場所記録入口を常時到達可能へ、用途を建物本体に、既存のカラフルな人物を中性モデルへ、固定3地点だけの提案を12件の検索可能な候補集合へ。

画像上の旧機能をそのまま復旧する計画ではなく、同じ利用者価値を空リポジトリから作る。元画像の`extension-studio`は制作画面の参照であり、AI実接続やコード生成の証明として使わない。

## v2接続規約
具体的なfield名はCONTRACTS_V2が正本。画面群は所有者ではなくfeature境界。正本・訂正・仮説・候補の版とsourceModeを保存し、時計や固定4人の担当順で画面を解放しない。

## v2.1：質問を閉じた後

S04/S05で質問に答えると、その回答原文を先に保存する。後で答える/飛ばすも保存し、再入場で同じ質問を強制しない。明示的な再抽出は保存済み回答IDを参照し、元の記録と回答を別々に根拠表示する。回答だけで用途や理由を自動確定しない。QUESTION_FLOW.mdを使用する。


---

## 収録：STACK_AND_ARCHITECTURE.md

# 技術スタックと並列実装の構成

## 採用
Node 22.22.1 / Bun 1.3.14 / miseを既存チーム環境から引継ぐ。Vite・React・TypeScript / Hono / MapLibre・Three / local Codex。API実行はNode、インストールとscriptの入口はBun。ライブラリの正確な組合せはFND-001で取得できる互換版へlockし、全員同じlockを使用する。最新版を無条件に追わない。

| 選択 | 代替を採らない理由 | 並列開発への効果 |
|---|---|---|
| Vite SPA＋Hono | 空repoでSSRやserver component境界を増やさない | UIとAPIの契約だけ共有して別moduleで進める |
| SQLite＋node:sqlite | JSON全体snapshotは関連更新/FK/版/原子性を自作する。外部DB/ORMは接続準備が増える | DDL実行で同じ構造が直ちに使え、独立handlerが同じtransaction規約に従う |
| MapLibre＋Three custom layer | 地図と別画面の3D世界を同期しない | Meaning描画と地図hostを別taskへ分割 |
| OpenAPI/JSON Schema＋生成TS | 人ごとに似た名前の型を作らない | fixtureとAPI clientを契約から先に生成 |
| 同期DB/非同期worker | ネットワーク待ちを保存排他へ持込まない | 短いDB更新後にAIを独立実行 |
| 単一ローカル実演プロセス | 公開認証/分散queue/コンテナ運用を必須にしない | 動く体験の組立を優先。配備は別task |

node:sqliteのExperimentalという留保と単一writerは受容する。[V2-S1,V2-S2] これは本番の耐障害性や大量同時利用を解いたという意味ではない。既にNext/SQLiteアプリが起動し、持込許可がある場合はHTTP/DTO/SQLの契約をそちらへ実装し、不必要なVite移植はしない。

## リポジトリ構成

```text
contracts/                 提供済みDTO/Port/OpenAPI。通常のfeatureは読取のみ
src/app/                   shell、manifestを自動収集
src/components/            共通UI。feature固有UIを押し込まない
src/map/{host,forms,avatar,state,materials}/
src/features/<feature>/    entry.tsxを自動収集
src/integrations/<id>/     統合時adapter/受入（元module編集は追加lock）
server/core/               DB/共通response
server/features/<feature>/ entry.tsを自動収集
server/ai/prompts/          task別promptファイル
shared/logic/<feature>/    pure計算、HTTP/DBを含めない
extensions/<theme>/       3テーマ定義
fixtures/<domain>/         明示sample
future/<id>/               隔離した高度構想PoC
```

FND-001でUIはViteのglob import、serverは既知features directoryのentryだけを起動時に収集する。通常feature追加で巨大router/index.ts、中央export barrel、共通CSS、package.jsonを同時編集しない。manifestは重複ID/operationIdを起動時に拒否する。任意ユーザー指定pathをdynamic importしない。

共通依存追加はそのtaskがpackage.jsonとlockの追加claimを取る。同じ依存を各featureへ別versionで追加しない。Windowsはパスをpath.joinで組み立て、ロック表記だけPOSIXへ正規化する。スクリプトはPython/Node、bash前提のcopy/killを避ける。

## UI/API/logicの接続
ApiPortはoperationIdをOpenAPIのmethod/pathへ対応させる。feature entryは依存capabilityが揃った時だけ操作を有効にする。未実装APIは501、sample adapterは明示選択。実AI失敗時に別modelや固定成功へ黙ってfallbackしない。

DBに41番目のfeatureを加える前でも、既存表は空でよい。全schema実装≠全feature完成。共有contractを読取専用で配布することで最初の基盤完了を全UIの前提にしない。

## 配備の実現経路
FUT02で永続volume＋backup＋private preview、FUT01でactor認証と共有、FUT18で公開境界を整える。local Codexのcredentialをブラウザや配備artifactに入れず、ホスト側workerへ切り分ける。公開可否と新規コード生成PoCは別依存。deploy完了を地図・記録・DSL実演の前提にしない。

## 登録形式の補完

上記構成の収集対象と型はENTRY_CONTRACT.mdで固定する。src/integrationsとserver/integrationsも明示的に収集し、地図hostへforms/avatar/stateを注入する。featureのentryを読み込むだけで、地図の純部品も勝手につながるとは扱わない。登録器はcontracts/entries.ts、操作別request/responseはcontracts/operations.tsを使う。


---

## 収録：DATA_API_AND_AI.md

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

任意1問の保存・回答・後回し・スキップ・再抽出はQUESTION_FLOW.md。AI-008がAPI/QuestionPort、AI-009がUI、INT-016が実接続を担当する。単なるquestion文字列の表示でSELF-008を完了にしない。

経路の階段/屋根/車種/交通区間はRouteLegへ渡し、ROUTE_CONSTRAINT_FLOW.mdに従って判定する。目的地だけのfactsを全行程の状態へ拡張しない。


---

## 収録：MAP_GROWTH_AND_DISCOVERY.md

# 地図の成長・人物・発見・OpenUAS

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


---

## 収録：EXTENSIONS_AND_APP_MODIFICATION.md

# 機能生成・導入・アプリ本体改造

## 1. 到達段階
| 段階 | 提供する価値 | 現在の実装経路 | 受入 |
|---|---|---|---|
| L0 有限DSL | 既存能力の組合せを自然文から作り、入力を変えて使う | AI-006 / EXT-001〜007 / INT-008 | 新definition→preview→validated→install→run→rollback |
| L1 画面/処理組替え | UI/データbinding/トリガーの配置を変える | FUT10 | schemaとcapabilityから組替え、本人state保持 |
| L2 本人AIへの開発依頼 | 環境・許可path・受入付き要求をexport | DEV-001 / FUT11 | 実コード生成/未生成を区別 |
| L3 新規コード拡張 | 現在ない計算を本当に生成して実行 | FUT09 | 別プロセス、型付き入出力、失敗局所化、旧版復帰 |
| L4 アプリ本体改造 | 別worktreeでUI/処理/必要schemaを変更 | FUT12 | DB複製でpreview、承認後切替、code/data復帰分離 |

L0の新しい定義と、L3の新しい演算実装は異なる。機能の説明文を出すだけで作成完了にしない。L4を削除せず、公開deployや汎用ストア完成を不必要な前提にしない。

## 2. v2の厳密なDSL
DslDefinition = schemaVersion:`dsl.v1` / inputs / steps / outputKeys / hostSlot。stepはid,op,inputKeys,outputKey。入力はnumber/boolean/stringの明示フォーム、入力名は重複禁止。出力keyはstepを通じ一意、後続stepからのみ参照できる。任意code、eval、URL fetch、SQL文字列、JS関数は受け付けない。

inputKeys/outputKeysで使える参照は `input.<key>`、`context.places`、`context.routeInput`、`context.passes`、`context.graphNodes`、`context.graphEdges`、`step.<outputKey>`。任意property pathや式文字列は不可。これらは固定名から型付き値へ解決する。循環・未来参照・未知key・入力型不一致をpreview前に拒否する。各stepの実行結果はDslValue（scalar/Place[]/ConstraintResult[]/RouteComputation/DslCard）。

| op | inputKeysの順・型 | 出力と意味 |
|---|---|---|
| filterCandidates | Place[], string(roleTag), boolean(requireCovered), boolean(requireSeats) | Place[]。roleTag一致（空文字は不問）。true条件はknown trueだけ採用。unknownを適合扱いしない |
| checkConstraints | RouteInput, RouteComputation, Place[], Pass[] | ConstraintResult[]。ConstraintPortへlegsを渡しhard/softを判定 |
| computeRoute | RouteInput, GraphNode[], GraphEdge[], Place[], Pass[] | RouteComputation。placeに最寄りgraphnodeを決定、mode/hardで許されるedgeをfilterして各区間をGraphPortで計算。滞在を加算。no-routeはvalidation errorであり成功空routeを返さない |
| sum | 1個以上のnumber | 合計。NaN/Infinity不可 |
| subtract | number, number | 前者−後者。負数も有効、余裕時間が負なら超過 |
| formatCard | string(title), scalarまたはtyped result, string(status:info/pass/fail/unknown) | DslCard。typed resultはhostの固定formatterで文章化。任意HTMLは生成しない |

hostはrun時点のrouteInput/places/passes/graphをschemaから渡す。inputに車種や締切がある場合は、templateに対応する**ホスト側のtyped binding**でRouteInputへ反映してからDSLを実行する。bindingそのものを生成テキストとしてevalしない。各テーマの入力名→DTO field対応は下表。利用者の入力が変わればbind後DTOも変わるので、定義だけ同じでも結果が変わる。

| Theme | 初期入力/binding | 真に変わる結果 | unknown/制限 |
|---|---|---|---|
| 防災 | requireCovered→hard.requireCovered、blocked edge集合/データsourceの更新、資料の鮮度 | 通れるgraphの候補・制約警告・保留 | 実災害での安全保証はしない。古い/不明は案内を保留 |
| バイク | vehicleClass→mode=motorcycleとhard.vehicleClass、通行規制edge | 選べる道路・到達可否 | 排気量/規制はprovider根拠がなければunknown |
| 聖地巡礼 | waypoints[].stayMinutes、ordered waypoints[].placeId、hard.arrivalDeadline | 総滞在＋移動、到着可否 | 固有作品素材/私有地アクセスを勝手に許可扱いしない |

上表の説明名は概念であり、厳密なfield名はRouteInput/HardConstraints/Waypointを使う。用意されていない災害細分条件はsourceのgraph adapterへtyped入力として持ち、DSLのopを追加せず既存graph Portへ正規化する。追加演算が必要ならDevelopmentRequestへ出す。

## 3. 定義・版・導入を分離
Extensionはストア項目、ExtensionVersionは不変definitionとartifactHash、ExtensionInstallはactorごとのactiveVersionId/previousVersionId/enabled/privateState、ExtensionRunは具体入力と出力。生成→draft、previewのschema/型/演算/可変入力確認→validated、本人installで有効化する。preview成功は安全な汎用code実行を証明しない。

同じversionを再導入して二重カードにしない。未検証versionは409/422。rollbackは前版の定義へ戻すが本人stateを削除しない。state型が不適合なら新version用のstateコピーを作り旧stateを保持し、互換なしを明示する。生成job完了だけでインストールを変更しない。

v2の実行hostはruntimeKind=dslのみ。runtimeKind=codeは将来用の予約で、code artifactと隔離プロトコルはFUT09で別versionの契約を追加する。現在のExtensionVersion.definitionを任意code格納先として流用せず、code指定はDEPENDENCY_UNAVAILABLE。

## 4. 情報更新・修復
SourceSnapshotにraw hash/format/parser版と正規化結果を保持する。列名変更は旧新の3行preview、単位や意味変更は別警告。RepairProposalはsnapshotIdと版を固定して本人承認後だけpublish。古いsnapshotへの提案を最新データへ流用しない。JSON/CSV/GeoJSONを初期対応、HTML/PDFはFUT13のadapter。未対応形式は501、架空のparse結果を返さない。

## 5. 新規コードと本体改造の実現仕様
DevelopmentRequestは要求、baseCommit、変更許可paths、受入操作、capability要求、dataはclone-only、生成物path、復帰条件を持つ。本人AIに渡す時はcredentialを含めない。現行appから要求書を作れることと、AIが変更を実施できることを別状態にする。

FUT09はtyped inputをstdin等で受ける別プロセスの演算プラグインから実証する。任意コードを現行serverやbrowserでevalしない。ファイル/ネットワーク/DB capabilityを初期は渡さず、必要な入力のコピーと結果だけを境界にする。失敗・停止・互換違反はそのpluginだけを無効化する。汎用的な隔離強度は公開前の追加課題として残す。

FUT12は別worktreeの変更を生成→依存lock→build→SQLiteの複製を使ったpreview→schema差分/データ損失検査→本人承認→artifact切替。現行実行中appと同じDBへ生成codeを試さない。code rollbackとdata restoreは独立操作で、旧codeに戻しても新schemaのDBが自動で戻るとは考えない。非可逆migrationはbackupと明示承認が必要。

## v2.1：独立して導入する

INT-008は汎用DSLのライブ生成→試用→導入だけを完成させる。三つのテーマはINT-013/014/015で独立して接続し、登録済みテンプレートとして動かす場合はAI生成を完了条件にしない。経路の受渡しはRouteLegのedgeFacts/transit/passAssessmentsを使用し、DSLのcheckConstraintsまで失わず渡す。


---

## 収録：IDEAL_ROADMAP_AND_DECISIONS.md

# 理想構想と次に取得するタスク

P2/P3も未割当。下表の依存は共有契約を読むだけでなく、実証に本当に必要なmoduleを列挙した。隔離設計/調査はその前から可能だが、taskをdoneにするための実証は依存成立後に行う。外部情報/API/学習効果は未検証を明示し、採用しなかった案も消さない。

| Task | 構想 | hard依存 | 具体的な実現経路 |
|---|---|---|---|
| FUT01 | 認証・本物の友人共有・取消の全派生反映 | SOC-002, AI-002 | OIDCまたはprovider認証→actorをsessionへ→recipient別投影→grant revision→検索/会話/画像URL/生成中結果まで依存失効→2アカウントで取消を確認。 |
| FUT02 | 配備向け永続化・データ移行・非公開デプロイ | FND-002, PREF-001 | ローカルSQLiteは既に正本。本人export→検証→配備先へのmigration→秘密値/AI workerをserverへ分離→非公開preview→backup/restoreを実証。コード移行とデータ移行を別承認。 |
| FUT03 | 実機・背景位置・許可されたオフライン地図 | MAP-001, REC-007 | 前景GPSを実機HTTPSで確認→Capacitor等native bridgeまたはMapLibre Native選定→OS権限と背景life cycle→オンデバイス記録queue→許可済みtile bundle→復帰同期。 |
| FUT04 | 立体フロア・ランドマーク・造形の理想版 | MAP-001, MAP-002, MAP-004 | PLATEAU等の権利/座標/LOD確認→建物外殻/入口/階接続を別データ→手動階確認→GLBは少数→混合用途の実体形状→記録/物理モデル分離を維持。 |
| FUT05 | 実乗換・定期控除・リアルタイム寄り道 | RTE-003, RTE-005 | 駅すぱあと等の契約/料金/対応交通を確認→provider courseを保持→鉄道定期区間控除→バス等は別対応確認→最終到着時刻/運休/再検索→fixtureと区別。 |
| FUT06 | OpenUASを体験移植の候補取得へ導入 | TRF-002, DATA-001 | 東京/名古屋の必要meshだけ読込→anchor/model/time/versionを照合→compatible空間のみcosine top-k→広域候補→POI検索→feasibility検証→属性のみbaselineと候補差比較。 |
| FUT07 | 小標本選好学習・将来予測・比較実験 | SELF-002, SOC-008 | 候補提示/選択/制約/結果をログ→階層Bayesまたは正則化pairwise model→contextを少数に→time splitの将来選択予測→単純頻度/申告のみ/理由なしと比較。 |
| FUT08 | 写真からの発見・能動提案・関心変化学習 | DISC-001, MEDIA-001, AI-005 | 画像特徴を本人確認→一般知識の出典検索→anchor bridgeを検証→known graph更新→receptive&&available&&optinの時だけ一枚→週後の自主学習/関心を評価。 |
| FUT09 | 新規コードプラグイン・隔離ランタイム | EXT-001, EXT-002 | DSLで不可能な新関数をDevelopmentRequest→Codexが専用worktreeでTS生成→別に保持したtestで検証→artifact build/hash→networkなしの隔離process/container等で実行→JSON入出力のみhost反映。 |
| FUT10 | 画面・データ・処理の組替えStudio | EXT-003, EXT-004 | screen schema/typed field binding/action DAG→既存機能を再配置→入力型と循環を検査→sample preview→definition版を保存→slotだけ差替→旧版戻し。 |
| FUT11 | 利用者自身のAIへ開発契約を渡すローカルbridge | DEV-001 | DevelopmentRequestをexport→PC上のloopback bridgeでhuman approval→repo allowlist/worktree作成→自身のCodex認証でtask実行→progress/preview URLを返す→承認後artifact取得。 |
| FUT12 | 本体UI/機能の改造・preview・データ保持rollback | FUT11, FND-002 | 許可pathsを限定した別worktreeでUI/処理を生成→schema変更計画→SQLite複製でpreview→旧データ互換を確認→本人承認→artifact切替。code rollbackとdata restoreを分離。deployや汎用plugin完成を待たずローカルで実証。 |
| FUT13 | HTML/PDFを含む5形式と意味変化の修復 | DATA-001, DATA-002 | API/CSV/GeoJSONにHTMLとPDFを追加→許可URL/単位/時刻/source version→schema drift/semantic driftを分離→parser提案と3行diff→回帰fixture→承認適用→previous parser復帰。 |
| FUT14 | 防災の実データ統合・不確実性・案内保留 | EXT-005, RTE-002, DATA-001 | 自治体/JMA等の許可データadapter→地震/浸水/通行止めの用途別時刻→安全制約→GPS不確実時はランドマーク確認→Recommend/Warn/Abstain→人命判断を自動断定しない。 |
| FUT15 | バイクの車種/排気量/時間規制を実データ化 | EXT-006, RTE-002, DATA-001 | 対応providerと道路規制source確認→車種/排気量/時間/二人乗り等の制約モデル→通行可否unknownを区別→禁止edge回避→規制変更の再検索。 |
| FUT16 | 聖地巡礼の出典・許諾・時間順の体験 | EXT-007, DATA-001 | official/fan/communityの出典を分離→作品/scene/場所の対応証拠→公開可素材だけ→私有地/混雑配慮→順序/営業時間/移動時間検証→本人の写真/感想。 |
| FUT17 | 公開API/第三者が追加する機能テンプレート | EXT-002, FUT09 | schema/SDK/examplesを別packageへ→GitHub Issueテンプレ/サンプル→第三者が未打合せで1拡張を作る→install→互換版/権利/manifest審査。 |
| FUT18 | 本番権限・攻撃耐性・監視・省電力 | FUT01, FUT02 | 境界ごとの脅威モデル→認可/秘密/remote code sandbox→負荷/timeout/resource budget→監視/backup→位置収集/描画の消費電力を計測→最適化。 |
| FUT19 | 共同編集・地域コミュニティ・非同期共有 | FUT01, SOC-007 | 共同案の版/提案/承認→本人希望を別保持→実友人の共有リンク→地域tipの鮮度/投票/訂正→取消時のmanaged cache更新→適用中断を明示。 |
| FUT20 | 実利用評価・継続価値・デプロイ費用計測 | SELF-002, DISC-003, TRF-002 | cold start到達時間→任意同意の継続観測→自己理解/移植/発見の別評価→heldout/ablation→アプリAI/地図/交通/compute/storageの実請求から1人当りcost算出。 |

## 保持する設計原則
一人で価値が出て、任意共有で賢くなる。地域表現は属性baselineへの追加adapter。理由・用途・今の希望を分離する。発見は関心の幅を狭める推薦に閉じない。3Dの高度帯は推定と真値を区別する。防災の安全≫習熟度であり、公式情報の不確実性を説明から消さない。

デプロイ、公開認証、省電力、継続学習、広域データは本番へ移るための後続だが、地図造形やDSLを見せるための必須基盤にしない。本体改造のlocal PoCは汎用ストア/クラウドworker完成を待たず実施できる。

採らない構成は「LLMだけが経路も安全も判定」「地図タイル全体から無許可で大量データ取得」「位置頻度を人格と同一視」「任意コードを現行DBに直結」「時間切れだから本体改造構想を消去」。その代わり制約計算・scope・version・本人承認を使う。


---

## 収録：DEMO_AND_MINIMUM_CHECKS.md

# 体験の接続確認と実演

時刻別の台本は作らない。以下の状態遷移をつなぎ、各枝はINT taskの受入が通ったものだけ見せる。場面を増やす条件は完成度であり、特定の担当が空いた時刻ではない。

| 場面 | 操作 | 観察する結果 |
|---|---|---|
| 自分の街が育つ | 手動で訪問と用途/原文を保存 | 再読込後も残り、建物本体が用途に変わる |
| 解釈を直せる | 理由だけを訂正 | 原文保持、理由差分、仮説/候補の入力版が更新、無関係な形不変 |
| AIが実際に働く | 保存済み原文へextractを実行し承認 | 実job、根拠ID、提案→承認の区別 |
| 他者から別都市へ | 共有比較→役割順序レシピ→移植→感想 | 都市名の置換ではなく対応・妥協・再現不能を説明 |
| 見方が増える | 建物の特徴から発見、興味を回答 | 別の観察視点が生まれ、自分の関心へ戻る |
| 機能も育つ | 自然文からDSL生成、入力を変えてpreview、導入 | 結果が変化、hostに残る、旧版へ戻せる |
| 安心して戻れる | job取消、demo reset、再開 | 古い結果が適用されず、本人領域は残る |

最小確認は原文保存、409競合、同op再送、理由と用途の分離、unknownの保留、共有取消、AI遅着、DSL可変入力、デモ領域分離。全本番security/E2E/負荷試験を完成の前提にしないが、これらは体験の論理が破綻しないための確認。

PCの390×844と大画面を基準にし、実機GPS・公開deploy・背景省電力を必須にしない。サンプル街区/人物/規制はsourceMode、live/rule/replayはexecutionModeを画面に残す。実応答がない場合はライブAI成功とは説明しない。

GATE-001で動作版commitと受入証拠を記録する。GitHub上のmodule Done、生成された仕様、静止画像だけを実演済みとしない。今回の納品はこの確認を実装者が実施するための仕様であり、アプリ実行報告ではない。


---

## 収録：CONTRACT_CHANGE.md

# 共有契約変更の最小手順

新しいfieldが本当に必要かを先に確認する。既存DTOで表せる機能追加はfeature内で完結し、schema編集を要求しない。契約不足なら、変更Issueに利用側、意味、null/default、既存データ移行、受入例を書く。

契約変更のclaimには `contracts/`、`db/schema.sql`、`db/dto-map.json`、`API_ENDPOINTS.csv`、`DB_COLUMNS.csv` のうち実際に変更するpathと生成物をまとめる。API/DB変更時は生成器 `tools/build_contracts.py` / `tools/build_db.py` も対象。単一担当への恒久所有ではなく、差分ごとの排他である。進行中featureの互換性を維持する追加を優先し、requiredの追加やrenameはmigrationを伴うbreaking変更にする。

`TASK_GRAPH.json`に契約修正taskを追加する場合、実行boardに格納されたgraphも同じ内容へ更新する。現helperは運用途中のgraph編集を自動化しない。受付1人がboardを最新OIDから読んでclaim状態を保存したままCAS更新し、影響taskへ通知する。board再init、stateの破棄、mainのforce-pushは禁止。

生成順は `python tools/build_contracts.py` → `python tools/build_db.py` → `python tools/generate_types.py`。operation追加時は実装task対応を `API_ENDPOINTS.csv` に反映する。DTO schema・FK・example・受入を同時に更新する。機能実装を待たせないためoptional追加またはversion追加で旧契約を一時併存させ、既存taskが読む版を固定する。

重大な仕様変更がない限り全員一斉更新を要求しない。端点のDTOは小さいPRで共有し、コード接続は関連INT taskで確認する。

## v2.1の生成物

操作の追加時はcontracts/operations.tsもgenerate_types.pyで再生成する。質問や経路の変更はQUESTION_FLOW.md/ROUTE_CONSTRAINT_FLOW.mdと例も同期する。task変更後はtools/build_task_docs.pyでIssue/CSVを更新する。検査実行順はtools/README.mdのv2.1節に従う。既に共有boardがある場合の移行は別途、状態を保持して調整し、initで上書きしない。


---

## 収録：VALIDATION_REPORT.md

# 検証レポート — v2.1

2026-09-09。対象は改訂仕様、共有契約、参考実装。アプリ本体・HTTP handler・ライブCodex接続の実装完了を意味しない。

| 検査 | 結果 | 証拠 |
|---|---|---|
| 要件保持 | 元145＋追加12のID・名称・価値・受入本文を完全一致で確認 | evidence/requirement-preservation.json |
| タスク | 114件、全件未割当、依存循環なし、初期依存なし77、POOL8 | evidence/contract-validation.json |
| HTTP/DTO | 89操作、304 schema、139形式例をJSON Schema検査 | evidence/contract-validation.json |
| SQL | 44テーブル、506業務列、seed/FKの確認成功 | evidence/contract-validation.json |
| 型 | 正しい呼出し成功、誤operation/path/body/response等の5例を型で拒否 | evidence/typescript-tests.json |
| 登録形式 | 10ケース成功。重複・宣言不一致・fixtureの誤公開・不一致版を拒否 | evidence/typescript-tests.json |
| 経路制約 | 12ケース成功。道中の適合・違反・欠落・鮮度・車種・運賃不明 | evidence/typescript-tests.json |
| 質問と回答 | 12ケース成功。別原文保存・再送・skip/defer・再入場・再抽出用ID | evidence/question-tests.json |
| 保存参考実装 | 10ケース成功 | evidence/mutation-tests.json |
| 編集ロック | 17ケース成功。ローカルの一時bare repoのみ | evidence/taskctl-tests.json |

TypeScriptはVersion 5.9.3、参考コードはNode v22.22.1。参考コードの計61ケースと5件の型拒否例を確認した。形式例の件数とは別集計。専用OpenAPI意味検証器、実機、実交通、実災害データ、ライブAI、公開配備は今回の検査対象に含めていない。型が合うことを現実の経路やAI効果の証明にしない。

質問フローの例はローカルSQLite参考処理の出力を使用し、再抽出のrequestは型・参照先まで確認。実AIへの送信はしていない。ConnectionReceiptを参考テストから実アプリ用に発行していない。

再現手順はtools/README.md。再生成・再検査すると環境情報やハッシュが変わるため、配布前にtools/package_delivery.pyでmanifest/ZIPを更新する。
