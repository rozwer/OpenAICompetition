# ヘルスケア情報の取込み・統計・AI提案

2026-09-09追加仕様。原理上可能な接続を独立実装できるよう、Web importとiOS HealthKitを共通の型へ接続する。実データ取得、iOS署名・実機動作、外部AI接続は未実装。これらの未完了を、受入構造を用意しない理由にしない。

## 1. 目的と画面

「自分を知る」で歩数・歩行距離・活動量・睡眠・運動の記録を振り返り、本人が許可すればAIの提案と散歩計画へ利用する。健康指標だけから性格、興味、疲労や病気を確定しない。休む選択も普通に表示し、活動量が少ないために相棒が罰する/弱る演出を入れない。

| 画面ID | 入口・操作 | 保存結果 | 不足時の表示 |
|---|---|---|---|
| S-HLT-01 連携設定 | 自分を知る→ヘルスケア。HealthKit接続またはXML選択 | 接続元、取得する項目・期間、保存先の許可 | Webでは自動取得を未対応と示し、ファイルimportを案内 |
| S-HLT-02 import確認 | ファイルを端末内で解析→項目/期間と送信先を確認→取り込む | 同意した正規化レコードとbatch結果 | 巨大/不正/未対応データを拒否。無断で全XMLをserverへ送らない |
| S-HLT-03 統計 | 日/週/月を選ぶ。情報源・欠損・更新日時を開く | 選んだ集計条件とHealthSummary | 読めたデータなしは欠測。0歩と表示しない |
| S-HLT-04 AIへの利用 | 利用する項目・期間・AI接続先を確認→提案を依頼 | consent revisionと最小HealthAiContext、AI job | AI許可がなければ統計だけ使える |
| S-HLT-05 利用停止/削除 | 取込み停止、AI利用停止、保存データ削除を別々に選ぶ | 接続/許可変更、派生失効、削除結果 | 停止と削除を同じ成功文言にしない |

相棒は統計カードや提案の入口になれるが、ヘルスケアの実装はペット生成・相棒選択に依存しない。相棒を隠しても全操作へ到達できる。提案例は「今週の記録を振り返る」「今日は短い散歩も候補にする」。健康値だけで必須ルート条件を変更せず、提案を本人が選んだ後に距離等を反映する。

## 2. 取得経路とOS境界

### Web / XML

AppleヘルスケアのXML exportを利用者が選択する。ブラウザ側HealthFileImportPortが項目と期間をpreviewし、選択後に正規化したレコードを500件以下のbatchで返す。ZIPは対応するexport.xmlだけをstream読取りし、外部entity/DTDを無効にする。ファイル上限の初期値は圧縮100MiB、展開500MiB。長時間処理は進捗と取消を持ち、全XMLを一度にメモリへ展開しない。写真、医療記録、個人プロフィール等の未選択要素は保存しない。

取込前のファイルは端末内に留まる。保存先がPC上のserverでも、その端末からはデータの送信先なので確認画面に表示する。既存の画像uploadAssetへXMLを偽装して渡さない。

### iOS / HealthKit

Web UIをCapacitor等のnative shellで動かし、HealthBridgePortをSwift側のadapterへ結ぶ構成を基準とする。HealthKit capability、読取り理由文、項目別のOS許可、実機の署名/導入をNAT-001とHLT-004で実装する。Safari/PWAからHealthKitを直接読めるとは仮定しない。native shellの構築を、背景GPS・オフライン地図全体の完成待ちにしない。

HealthBridgePortはavailability、requestReadAuthorization、readBatch、acknowledge、stopを提供する。OS許可画面が閉じたことは読取り許可の証明ではない。読取り拒否とデータなしを区別できない場合はreadAuthorization=unknownまたはrequest-completedのまま、no-readable-dataを表示する。HealthKitの書込み許可は要求しない。

HKAnchoredObjectQuery相当の追加・削除差分を取得し、serverがbatchをcommitした後にだけnative側anchorを進める。anchorはactor/namespace/端末/metric/検索期間の組ごとに端末内保存し、別の取込へ使い回さない。batch再送を許し、破損anchorの全再読取りでも二重計上しない。背景同期は対応OSの範囲で追加できるが、前景での「同期する」が独立して完成する構造にする。

## 3. 共通データ

| metric | 正規単位 | 取込元 | 集計上の意味 |
|---|---|---|---|
| steps | count | stepCount | 指定sourceの区間量 |
| walking-distance | m | distanceWalkingRunning | 歩行/走行距離。歩行だけと誤表示しない |
| active-energy | kcal | activeEnergyBurned | 活動エネルギー。基礎代謝を加えない |
| sleep-duration | s | sleepAnalysis | sleepStageと区間を保持。in-bedとawakeを睡眠時間に加えない |
| workout-duration | s | workout | 記録された運動時間。消費量と混同しない |

元単位と正規値の対応はadapterで固定し、変換版をsourceVersionへ残す。時刻はoffset付きISO 8601、比較はUTC、日/週/月の境界は選択したIANA timeZone。DSTで一日が23/25時間でも86400秒に固定しない。endAtはstartAtより後。期間の途中で日境界を跨ぐquantityは日境界で比例配分し「区間内均等の按分」であることを表示する。按分値はquality=estimated、prorated-intervalとし、AI文脈にもqualityを保持する。睡眠は区間の重なりを取り除く。

外部UUIDがある場合はexternalKeyに使用する。XMLでは正規化前の種類、source、開始/終了、値、作成日時から安定hashを作り、同じexport内の同一要素を同じkeyとする。UUIDがないXMLとHealthKitの同一記録を自動で同一と断定しない。記録の識別単位はnamespace+actor+connection+externalKey。recordVersion/hashが変わった場合は更新し、削除差分はtombstoneとして扱い派生を失効する。

HealthSampleはsource identity、期間、metric/unit/value、睡眠stageを保持する。原XMLを汎用Evidenceや会話へ丸ごと保存しない。HealthImportBatchは件数と入力hashを記録する。sourceModeはserverが接続元に基づいて付け、任意のクライアント申告でsampleに偽装できないようにする。

## 4. 重複・欠損・集計

初期policyはsingle-source-per-day-v1。利用者が選んだ優先sourceのうち、その日・metricに有効な記録を持つ最優先sourceを一つ選ぶ。sourceKeyはconnectionId・appId・deviceIdを連結した識別子とし、日ごとの選択をsourceSelectionsへ残す。同じ日・同metricにiPhoneとWatchを加算しない。選択sourceに記録がない日だけ次sourceを検討する。優先リスト外しかない場合はunavailable。異なるconnectionの同じsourceを採る場合も片方を明示的に選ぶ。

同一sourceの累積量は同じexternalKeyを一回だけ集計する。異なるkeyのquantity区間が重なり、正当な分割なのか複製なのか分からなければvalue=null、state=partial、source-overlapを返し、AIへ数値を渡さない。睡眠と運動のdurationは選択sourceの区間和集合。in-bed/awakeを除き、睡眠の複数stageが同区間でも二重に足さない。数値0の有効レコードとレコードなしは区別する。

HealthSummaryはwindow・policy・consentRevision・inputVersionsを持つ。valueが使えるときだけstate=available。不完全な期間、未対応項目、読めたデータなし、source削除は理由を残す。Appleヘルスケア画面の独自source調整と必ず同じ合計になるとは保証しない。ここで採用したsourceとpolicyを表示する。

## 5. 権限と保存

三つの許可を分離する。OS側の読取り、アプリが選択データを保存すること、指定AI providerへ集計を送ること。初期値は全て無効。アプリ許可にはmetric・期間・serverStorageEnabled・aiProviderIdsとrevisionを保存する。OS許可があってもAIへの送信許可にはならない。

現在のX-Actor-Id等はdemo切替用で本人認証ではない。実健康データAPIはPrivateDataSessionPortで認証済み/端末ペアリング済みactorを解決する。選択scopeと一致しない要求を拒否する。未設定adapterでは実データの取込・取得・AI利用を閉じる。demoはserver同梱の明示サンプルのみで検証する。実データ送信をサンプルnamespaceで迂回できないことを確認する。

HLT-009がこの境界を実装する。将来のOIDC等と同じportへ接続でき、友人共有全体やFUT01の完成を着手条件にしない。本人セッションまたは端末ペアリングの具体的な認証方式はadapter実装時に固定するが、受け取るscope・目的・認証トークンと拒否条件はcontracts/companion-health.tsで固定する。トークンは健康値・ログ・Issueへ含めない。

本人健康データは友人レンズ、共有体験、一般の本人export、拡張DSLの無制限データ源へ自動公開しない。一般exportから健康由来のAI結果も除外する。別の明示export機能を作る場合は許可範囲を追加契約する。

一般export用の`export_record_provenance`は健康値やAI request/result本文を複写せず、namespace+actor+record type+record ID+record revisionを主キーに、tri-state、判定理由、任意のsource job/health context/consent revision、input VersionRefだけを保存する。`ExportHealthGuardPort`はexportと同じread transaction内で現行revisionと推移的inputを検査する。健康用PrivateDataSessionやwellbeing AI task全体の代替ではなく、一般exportのfail-closed投影だけを担当する。

## 6. AIと経路へ接続する

1. 利用者がmetrics・期間・providerを指定する。
2. createHealthAiContextは本人のcurrent summaryだけから最小値を作る。生サンプル、端末識別、他の期間、欠測/partial値を混ぜない。値が一つもなければ依頼を作らず理由を表示する。
3. AI jobはtask=wellbeing、input.healthContextId、objective、任意placeIdだけを受け取る。server側HealthContextPortが許可と入力版を再確認して解決する。クライアントが任意の集計を「確認済み」と送る形式にしない。
4. 送信直前と結果適用直前にconsent revision・provider・source revision・有効期限を確認する。contextの初期寿命は作成から15分。失効したjobはstaleとなり、新しい同意/集計で再依頼する。
5. AI出力はWellbeingSuggestion（種類、文章、根拠summary参照、任意の距離案）として既存AiJobに保存する。AIは診断、運動の安全保証、健康値からの人格評価をしない。提案が医学的効果を実証したとも表示しない。
6. 本人が距離案を選んだ場合にのみルート入力へ反映する。RouteInput.healthContextIdは任意の出典参照で、未指定なら既存経路処理と同じ。結果は従来の道路/時間/通行制約で再検証する。

create/get/apply/cancelの既存AI APIも、wellbeing jobを扱うときはPrivateDataSessionPortを通す。保存済みAI出力の再表示も許可を確認する。healthContextId付き経路の取得・export・共有についても同じで、健康由来の説明を公開共有へ混ぜない。相棒にはjob状態イベントだけ渡し、健康値を持たせない。

HealthDisclosureはprovider、項目、許可版、payload hash、送信状態を保持する。serverログ・request_dedup・汎用change eventに健康の本文を増殖させない。撤回後に新しく開始する送信を止める。既に外部へ送信された内容をアプリ側の撤回だけで取り戻せるとは約束しない。

## 7. APIと保存先

/api/v1/health は既存の稼働確認。健康データは/api/v1/health-data以下に分ける。書込みは既存のopId・revision・transaction規則を使う。

| operationId | method / path（health-data以下） | 内容 |
|---|---|---|
| getHealthDataState | GET /state | 本人のconsent、connections、summary IDs。端末のOS許可を推測しない |
| createHealthConnection / updateHealthConnection | POST /connections、PATCH /connections/{connectionId} | 取込元登録、停止・再開・切断 |
| putHealthConsent | PUT /consent | expectedRevision=0は初回のみ。項目/期間/保存/AI変更はrevisionを上げる |
| revokeHealthConsent | POST /consent/revoke | 新規取込み/AI利用を停止、summary/context/jobを失効 |
| importHealthBatch | POST /batches | connection、許可版、最大500件と削除key。commit後にnative anchorをack |
| buildHealthSummary / listHealthSummaries | POST/GET /summaries | 明示policyで集計、本人の集計を再表示 |
| createHealthAiContext / getHealthAiContext | POST /ai-contexts、GET /ai-contexts/{contextId} | providerに許可した最小集計と出典版 |
| purgeHealthData | POST /purge | 本人の保存済み健康データと派生内容を削除 |

health_connections、health_consents、health_samples、health_import_batches、health_summaries、health_ai_contexts、health_disclosuresを使う。DTOと実列の対応はDB_COLUMNS.csv。値を汎用タグや任意JSONのcommandへ逃がさない。

purgeはsamples・集計・文脈に加え、健康由来のAI結果/経路説明/キャッシュ/冪等応答を消去または内容を除去する。ユーザーが書いた通常の日記原文は勝手に消さず、健康由来の自動挿入部分を区別して除去する。保持する監査は値を含まない最小メタデータだけ。HealthKit本体の記録は削除しない。接続停止と削除を別操作にする。

## 8. 追加実装の配置と依存

- UI：src/features/health/。health-panelとsettings-panelへ登録。
- Web XML：src/client/services/health-file-import/。
- native橋渡し：native/ios/、src/client/services/health-bridge/。Webではunsupported adapterを返す。
- 保存API：server/features/health-data/。
- 集計：shared/logic/health-aggregation/。
- AI文脈：server/services/health-context/。
- 実データ本人確認：server/auth/private-data/。
- 組立て：INT-019（importと統計）、INT-020（AI提案と経路）、INT-021（実機HealthKit）。

HLT-001〜009とNAT-001を独立に取得できる。module着手は提供済み契約から可能。XMLとnativeは互いの完成を待たない。集計と統計画面は型付きサンプルで着手でき、統合時に実データとの接続を確認する。AI枝だけが未接続でも本人の統計まで閉じない。逆にfixtureを本物のHealthKit取得の証拠にしない。

## 9. 受入と出典

HLT-REQ-001〜010で、取得経路、項目/単位/時間、二重計上、許可、本人分離、統計、AI、取消/削除、独立実装、実機復帰を追跡する。空データ・同一batch再送・異なる単位・日境界/DST・重複source・睡眠stage重なり・削除差分・撤回中のAI・他人のcontext参照・Web未対応を反例にする。

- [HealthKit](https://developer.apple.com/documentation/healthkit)：iPhone等の健康データ基盤。
- [HealthKitの許可](https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data)：読取り許可の非開示を踏まえる。
- [差分queryとanchor](https://developer.apple.com/documentation/healthkit/hkanchoredobjectquery)：追加・削除差分の取得。
- [睡眠stage](https://developer.apple.com/documentation/healthkit/hkcategoryvaluesleepanalysis)：in-bedと睡眠stageの区別。
- [AppleのXML書出し](https://support.apple.com/guide/iphone/share-your-health-data-iph5ede58c3d/ios)。
- [Capacitor公式](https://capacitorjs.com/docs)：Web UIとnative pluginの接続候補。

2026-09-09に一次資料を確認。single-source-per-day-v1、上限、画面配置、API/DBは本アプリの設計判断で、Apple公式の集計結果や実機動作の保証ではない。
