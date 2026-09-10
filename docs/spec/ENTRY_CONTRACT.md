# 登録・接続契約 v2.1

本書と `contracts/entries.ts`、`contracts/map-ports.ts`、`contracts/operations.ts` を、起動基盤と機能の共通入力とする。FND-001の完成を待たなくても、全員が同じexport形式から実装できる。型の変更はdocs/spec/CONTRACT_CHANGE.mdで調整する。

## 1. ファイルとexport

各entryは副作用のないdescriptorを**default export**する。importしただけでDBを開く、AIを実行する、イベントを登録する処理を置かない。

| 配置 | default export | 収集する側 |
|---|---|---|
| `src/features/*/entry.tsx` | `UIEntry<ReactNode>` | browserのshell |
| `server/features/*/entry.ts` | `ServerEntry` | serverの組立て |
| `server/db/entry.ts` | `ServiceEntry<'db'>` | serverの組立て |
| `shared/logic/*/entry.ts` | 対応する `ServiceEntry<K>` | serverの組立て。UIへは取り込まない |
| `server/ai/adapter/entry.ts` | `ServiceEntry<'ai'>` | serverの組立て |
| `server/adapters/*/entry.ts` | 対応する `ServiceEntry<K>` | serverの組立て。provider未設定entryも能力状態を返すため収集 |
| `server/ai/health-guards/entry.ts` | `ServiceEntry<'exportHealthGuard'>` | serverの組立て |
| `server/features/questions/service.entry.ts` | `ServiceEntry<'questions'>` | serverの組立て |
| `src/integrations/*/entry.ts` | `IntegrationEntry` | browserの組立て |
| `server/integrations/*/entry.ts` | `IntegrationEntry` | serverの組立て |

FND-001は上表の各globを明示して収集する。ルートpackage.json、共通barrel、巨大routerへ全員が追記する方式を使わない。mapの純部品は次節の明示的注入を使い、featureの自動収集だけで読み込まれると仮定しない。

`server/adapters/*/entry.ts`は他のserver serviceと同じ依存解決器へ渡す。たとえば画像生成adapterは`petPackages`の構成後に`petImageGeneration`として登録し、provider未設定でもdescriptorを収集して`not-configured`を返す。同じserviceを複数entryが提供した場合は起動時に拒否し、暗黙の上書きやfallbackを行わない。

UIはReactの `createElement(entry.Component, props)` または同等のJSXでマウントする。`entry.Component(props)` として直接呼び出してHooksのコンポーネント境界を失わせない。UIPropsはAppContext、scope、ApiPort、NavigationPort、利用可能capabilityを渡す。featureはserverのentryや別featureをimportしない。

ServerEntry.registerはmanifestで宣言したoperationだけをHandlerRegistrarへ登録する。入力はOperationRequest<K>、出力はOperationResponse<K>で、HTTP成功statusは生成済みOPERATION_HTTPの定義を使う。path/query/bodyの検証、scopeヘッダーの解決、エラーのApiErrorへの変換はHTTP組立て側の責務。handlerは外部のHTTP RequestやHono Contextを受け取らない。

DbPort、QuestionPort等はServiceLookup.getで取得する。module間の具象importはしない。宣言したrequiresServicesを満たす順にServiceEntry.createを呼ぶ。循環・重複serviceは起動エラーとし、存在しない依存を空オブジェクトで埋めない。

ServiceMapのキーはdb、meaning、hypotheses、graph、constraints、transfer、sharing、ai、dsl、questions、comparison、joint、discovery、observations、sourceNormalize、exportHealthGuard等の型定義済みキー。各pure moduleのentryは対応キーをprovidesとして宣言する。PromptはAI adapterへ組立て側から明示注入し、UIや他featureが直接importしない。一般exportは`exportHealthGuard`をrequiresServicesとして受け取り、健康featureの具象moduleをimportしない。

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

`INT-DEMO-002`は`demo.api`のclone/resetを実DBで実行し、返却された実在actorによる`getBootstrap`とbrowserのscope再mountまで確認した同一buildのreceiptだけを受け入れる。seed descriptorやfixture UIの存在だけではこのcapabilityを解放しない。

`examples/entry-wiring.ts` はexport・handler・wireの最小例、`tools/test_entries.ts` は収集時の拒否条件の実行例。これらは明示fixtureであり、アプリの接続完了receiptを発行しない。

## 4. 既存Nextアプリを使う場合

このZIPは空repoのVite/Hono構成を出発点にする。既存アプリを使う分岐では、収集・注入を `src/app` と `src/server` へ置く。`server/*`、`shared/logic/*`、ルートcontractsの書込pathを既存のserver/domain/contractsへ写す対応表を、着手前にTASK_GRAPHと一緒に変更する。Nextのsrc/app内に任意のVite構成をそのまま生成しない。feature間import禁止・domain/contractsの独立を維持する。

## v2.2：相棒・健康情報の追加口

既存のentryは維持し、次の種類とslotを追加する。全追加機能の完成を起動条件にしない。

| 収集path | 契約 | 読み込む側 |
|---|---|---|
| src/client/services/*/entry.ts | ClientServiceEntry | browser/native shell |
| server/ai-tasks/*/entry.ts | AiTaskEntry | serverのAI dispatcher |
| 既存UI entryの追加slot | companion-overlay / settings-panel / health-panel | browser shell |

ClientServiceEntryはprovidesとcreateの返却型を対応させる。実行platformに一致するentryを一つ選び、重複providesは拒否する。ios実装があるときはwebのunsupported実装を同時登録しない。未登録serviceはUIProps.clientServices.getからundefinedとなり、その接続入口だけを未対応表示にする。native codeを通常のWeb bundleへimportしない。

CompanionEventsPort、HealthBridgePort、HealthFileImportPortはclient専用。PetPackagePort、PetImageGenerationPort、HealthAggregationPort、HealthContextPort、PrivateDataSessionPortはserverのServiceMapで受け取る。全server serviceを最初から作るのではなく、実際に登録されたfeatureが要求するserviceだけを組み立てる。

AiTaskEntryはビルド時に信頼したコードだけを収集する。task名で一つにdispatchし、同じtaskの重複を拒否する。wellbeing未実装ならそのtaskだけAI_UNAVAILABLE。既存extract/discover等を巻き込まない。画像生成はAiPortのテキストtaskへ混ぜずPetImageGenerationPortへ送る。

AI-011の任意`prompt`登録は既存`create(services): AiTaskRunner`を変更しない。`prompt`がないentryは従来runnerだけで動く。`prompt`のfactoryへ渡すservice lookupは`ai`を型から除外し、resolverがdispatch中のAiPortを自己再呼出ししない。

prompt taskはtask別inputからresolverで保存済みsourceを解決し、actor・namespace・scope snapshot・Evidence revision・original Evidence・必要Evidence ID集合を検証する。prompt builderへ渡す前にactor、namespace、revisionを除き、必要なcontextとEvidence ID・役割・原文だけへ投影する。resolverが余分なEvidenceを返した場合も拒否する。

adapterの実行順は`prepare → 認証/設定確認 → providerを一度だけ実行 → assertCurrent → decode`とする。provider応答後にscopeが過去になっていれば結果をdecode・applyしない。`ABORTED`、`STALE_SCOPE`、`CONFIGURATION_INVALID`、`AUTH_UNAVAILABLE`、`PROVIDER_FAILED`、`OUTPUT_INVALID`を区別し、固定結果や別providerへ暗黙fallbackしない。AI-011のtypecheck例はcontract fixtureであり、Codex・DB・INTの接続証拠ではない。実配線はAI-012、製品接続は対応INTで確認する。

HandlerContext.authorizationはserverにだけ渡す。健康APIと健康由来の既存AI/経路操作はPrivateDataSessionPortでscopeを解決する。X-Actor-Id等は照合する要求値であり本人認証にはしない。

INT-018はrequiredProviders=['image-generation']、INT-019は['private-data-session']、INT-020は['private-data-session']かつrequiresLiveAI=true、INT-021は['healthkit','private-data-session']を宣言する。ConnectionReceipt.providerProofsには種別、接続先識別、証拠pathを入れる。証拠pathがreceipt.evidencePathsにない場合はcapabilityを解放しない。メタデータが揃うことと実機/実生成が成功することは別であり、INTの受入で内容を確認する。

初期配線でcompanion-overlayを一箇所、settings-panelを設定領域、health-panelを「自分を知る」へ配置する。追加の第5タブを作らない。UI生成セッションはslotと画面IDを引き継ぐ。

## v2.3：探索候補の地図接続

docs/spec/MIST_EXPLORATION.mdとcontracts/exploration.tsを共通入力にする。
EXP-001のshared/logic/exploration/entry.tsはServiceEntry<'exploration'>、EXP-002のserver/features/exploration/entry.tsは6操作のServerEntry、EXP-004のsrc/features/exploration/entry.tsxはmap-sheetのUIEntryとして収集する。
EXP-003のsrc/map/exploration/index.tsはExplorationLayerPortをdefault exportする。独自にfeatureやserverをimportしない。
INT-022は既存INT-001のmap.entry.tsxへMapDependencies.explorationを注入する。その編集pathはTASK_GRAPHのINT-022で取得する。
同じhostを二重起動せず、組立て側がExplorationMapBindingのsnapshot/subscribe/selectPlaceを詳細UIと地図へ渡す。UIが別featureの状態を直接importしない。
未注入の既存MapHostFactoryはそのまま使える。候補は本人scope変更時に即座に破棄し、physical/peerレンズに混入させない。
通常利用はapi:refreshExplorationCandidates等の各operation capabilityとintegration:INT-022が揃ってから公開する。INT-022はrequiresLiveAI=falseとし、rulesで実API/DBが動いた範囲を証明する。
