# 再発防止条件の根拠

本番計画の仕様。各条件は対象Issueへ生成されるため、着手時に全件を読み直す必要はありません。

## R01

descriptorの存在と現在の実行可否が混同された。

health/bootstrapは実catalogの能力を使用する。AIのprobe-ready、実task実行、INT receiptを区別し、未登録AIでも本体を起動する。 HTTPの既知errorは契約statusへ写し、JSON bodyはparameterの型変換と分離して非破壊で検査する。対向catalogのmanifest・wire IDも照合する。

反例: fixture handler・古いbuild receipt・未設定AIをavailableへ上げない。 数値originalTextを文字列へ変換して受理せず、REVISION_CONFLICTを一律500へ変えない。

反映先: P-AI, P-RUNTIME

根拠: LRN-005-fnd-entry-runtime, LRN-UI-002-bootstrap-capabilities, LRN-AI-010

## R02

IDだけのpromptと二重dispatcherでは原文・許可・版を保証できなかった。

resolverで認可済み投影を解決し、共通adapterを一度実行する。task別builderは許可fieldとIDだけを使い、応答後のfreshness検査を通す。

反例: 別actor・余分Evidence・失効grant・根拠のないrepair列をmodel入力やapplyへ通さない。

反映先: P-AI

根拠: LRN-AI-001-task-injection, LRN-AI-003-input-boundary, LRN-AI-011, LRN-AI-012, LRN-AI-004, LRN-AI-005, LRN-AI-006-prompts, LRN-AI-008

## R03

schemaやSDKの型互換を局所fixtureだけでは保証できない。

採用SDKで非対応のuniqueItems等を登録時に明示拒否し、制約を黙って削らない。$refと隣接keywordを併用し、文字列長はUnicode code pointで検査する。

反例: 非対応schemaではSDK実行0回。$ref+maxLengthと補助平面文字を反例にし、型castや固定結果で不整合を隠さない。

反映先: P-AI

根拠: LRN-AI-001-schema-compatibility

## R04

同じscopeへ戻ると旧request結果を再採用でき、renderに旧本人dataが残った。

C2の共通ケースを基盤で検証し、各UIは現在scope・request identity・abortを既存境界で照合する。 草稿保存を持つUIは、保存開始時のtext snapshotと成功時の最新draftが一致する場合だけclearし、待機中の追記は未送信のまま再入場後も選択・コピーできる。

反例: A→B→A、reset、unmount後の旧応答を表示・保存しない。 保存待ち中に追記して成功させても新しい原文を消さない。遅着テストは旧Promiseが実際にresolveして処理を完了したことまで確認する。

反映先: P-AI, P-MAP, P-RUNTIME, P-WORKSPACE

根拠: LRN-AI-009-bootstrap-revision, LRN-AI-009-review-fixes, LRN-AI-007-kaiya1, LRN-MAP-004, LRN-map001-primitive-axis-and-scope

## R05

Primitive軸変換・pose・位置選択と旧IssueのThree Group記述が食い違った。

geometryごとY-up基底を変換する。造形はPrimitiveで返し、hostはlive/replay位置と実注入poseを所有する。

反例: 非等方box・cylinder・非zero回転で高さを照合し、unknown headingを測定値にしない。

反映先: P-MAP, P-REFLECT

根拠: LRN-map001-primitive-axis-and-scope, LRN-MAP-002-primitive-contract, LRN-MAP-003

## R06

型注釈とApiPort fakeが操作IDのHTTP形式違反を見逃した。

原文保存と再送IDを実OpenAPI decoder・SQLiteで確認し、既送信草稿の再送identityを保つ。 注入なしの既定ID生成・cryptoなしfallback・復元草稿から作るrequestを製品のHTTP decoderへ通す。未送信の旧草稿移行と送信済み再試行を分ける。

反例: 失敗後再送の重複、別actor削除、原文欠落を拒否する。 型がstringであることや有効なIDを注入したfixtureだけをHTTP適合の証拠にしない。送信済みopIdを再入場時に振り直さない。

反映先: P-AI, P-RECORD

根拠: LRN-REC-001, LRN-REC-002, LRN-REC-009, LRN-AI-009-review-fixes

## R07

作成時刻・理由訂正時刻を用途確認時刻と扱うと最新用途を誤る。

用途確認時刻を明示してMeaningへ渡す。訂正は原文・本人状態を保ち、同一transactionでAI staleと通知を確定する。

反例: 理由だけの変更で古い用途を最新にせず、Meaning失敗なら正本更新もrollbackする。

反映先: P-RECORD, P-REFLECT

根拠: LRN-meaning-purpose-confirmed-at, LRN-REC-004

## R08

候補区間が共有Portに出ず、実在Placeとの対応もなかった。

ObservationsPortの候補区間と精度・source identityを使い、一意の実在Placeだけへcandidate Visitを保存する。

反例: 曖昧な最近傍やplaceholder Placeを作らず、候補だけでconfirmedや成長にしない。

反映先: P-RECORD, P-REFLECT

根拠: LRN-REC-006-observation-boundaries, LRN-REC-007-candidate-visit-connection

## R09

履歴のdate-timeと地域の日境界・本人review由来が曖昧だった。

UIは使用IANA zoneを表示してUTCへ変換し、APIは半開区間でVisit開始/Observation観測/Experience作成時刻を使う。本人reviewは再計算で保持する。

反例: UTC文字列の日付slice、Preference変更による原Evidence改変、自動confirmedを拒否する。

反映先: P-REFLECT

根拠: LRN-SELF-001, LRN-SELF-003

## R10

現在希望と過去根拠・計算候補と本人確定を混同できた。

仮説は支持/反例/観測alternativeを局所文脈で扱い、rulesはproposed/needs_more_dataまでとする。

反例: 現在希望やunknown weatherを過去の確定傾向へ混入しない。

反映先: P-REFLECT

根拠: LRN-SELF-002-hypothesis-boundaries

## R11

経路edge・network供給・比較元時間が別境界で不足した。

同じversioned networkからedgeIdsのgeometryと基準全行程を解決する。寄道差分は提案移動−基準移動＋滞在で計算し、欠落はunknownにする。

反例: 基準10分/提案15分/滞在20分は25分。基準不在を直線や全行程で補わない。

反映先: P-ROUTE

根拠: LRN-RTE-001-graph-port, LRN-RTE-002-constraint-port, LRN-RTE-003

## R12

保存時passや券の一覧だけでは採用時の有効性を保証できない。

採用時にPlace/Pass/Source版と期限を照合する。券管理一覧とprovider営業日での適用判定を分け、health指定時だけ本人許可を検査する。

反例: 別actor VisitをQuest達成根拠にせず、期限外の券や未知courseを運賃適用済みにしない。

反映先: P-ROUTE, P-TOGETHER

根拠: LRN-RTE-003, LRN-RTE-005-pass-validity

## R13

探索から歩く/記録へ渡すID、住所・入口・出典投影が不足した。

routes.planの安定entryとplaceIdを使い、解決済みSource・住所・入口を表示し記録後にrefreshする。

反例: raw Source IDを説明にせず、失効/別scope Sourceや候補IDをPlaceとして渡さない。

反映先: P-EXPLORE, P-ROUTE

根拠: LRN-RTE-004, LRN-EXP-005-display-and-navigation, LRN-EXP-004-kaiya1

## R14

探索候補は本人との関係未確定であり成長の正本ではない。

候補の関心・非表示・次の探索は本人scopeのrulesで保存し、確認した体験だけをMeaningへ反映する。

反例: 閲覧・近接・経路選択で訪問を確定せず、physical/peerへ本人候補を混入しない。

反映先: P-EXPLORE

根拠: LRN-EXP-001-kaiya1, LRN-EXP-002-kaiya1, LRN-EXP-003, LRN-003

## R15

過去投影やgrant IDだけでは現在の共有許可を保証できない。

現在grantと最新Evidenceから読み直して投影し、非許可fieldはnull/空配列にする。同じinput/grant版の拒否mappingは保存層で除外する。

反例: 許可取消後の原文・写真流出、保存した拒否の再提示を拒否する。

反映先: P-RUNTIME, P-SHARE

根拠: LRN-SOC-001-sharing, LRN-SOC-003-comparison-builder

## R16

2軸rules得点や同じ候補数は実評価・同じ候補集合ではない。

本人ごとに所有する同一順序placeIdsを使い、忠実さ/本人適合/実行可能性を別々に記録する。

反例: rules scoreを成功確率や実利用者評価とせず、unknown道路・運賃をゼロにしない。

反映先: P-RUNTIME, P-TRANSFER

根拠: LRN-TRF-002-two-axis-baseline, LRN-FND-004-seed-boundaries

## R17

有限DSLだけでは可変行程配列や車種詳細を表せない。

hostのtyped bindingから既存RouteInputへ写す。出典・素材利用・立入り許可を分離し、入力差に応じて結果が変わる既存fixtureを使う。

反例: 未知車種・期限外規制を走行可にせず、任意property/SQL/evalや未知opで拡張しない。

反映先: P-EXTENSIONS

根拠: LRN-EXT-006-motorcycle-template, LRN-EXT-007-pilgrimage-boundaries, LRN-POOL-005-extension-cases

## R18

修復提案の見本では承認後の取込・旧版維持を証明できない。

現在snapshotの列/単位previewを確認してから明示承認・実取込・再読込へ進む。

反例: 承認前のfacts更新、単位推測、失敗時の旧版破壊を拒否する。

反映先: P-AI, P-DISCOVER, P-REPAIR

根拠: LRN-DATA-003-worktree-parent-and-repair-ui

## R19

Uint8ArrayをJSONへ渡すと画像が添字objectになった。

HTTP hostで同じ認可文脈の保存metadataとbytesからraw response/MIMEを返す。

反例: PNG byteとContent-TypeをHTTPで一致させ、他actorはbytes読取り前に拒否する。

反映先: P-COMPANION, P-DIARY, P-RUNTIME

根拠: LRN-MEDIA-001-private-assets, LRN-MEDIA-HTTP-001-binary-response

## R20

namespace IDだけでは再bootstrapできず、追加tableがresetから漏れた。

実在actorと設定contextをseedし、C3の表宣言・除外理由・同scope resetを操作として確認する。

反例: 原文/provenance表のreset漏れ、空actor、unknown health-derivedのexport混入を拒否する。

反映先: P-RUNTIME, P-WORKSPACE

根拠: LRN-DEMO-002, LRN-PREF-001-export-boundaries, LRN-PREF-002

## R21

設定保存だけでは停止後の遅着AI applyを防げない。

apply直前に本人namespaceのsettings revision/ai_enabledを再読込する。停止は保存データ削除とは分ける。

反例: 全停止保存後に届いたAI結果をapplyしない。

反映先: P-AI, P-WORKSPACE

根拠: LRN-PREF-001-export-boundaries

## R22

browser事前検査・private bytes・server decoder・profile選択が分離していた。

browserへNode依存を持ち込まず、serverで所有metadata/保存hash/bytes hash/atlasを再検査する。取込後の相棒選択は本人の別操作を残す。

反例: 取込失敗で現在profileを変えず、非表示設定でもAI相談入口を失わない。

反映先: P-COMPANION

根拠: LRN-PET-001-pet-package, LRN-PET-002-kaiya1, LRN-PET-004-kaiya1, LRN-INT-017-kaiya1

## R23

生成job IDだけでは動作previewできず、catalogにadapter/rendererがなかった。

同scopeのpackageとassetをrendererへ注入し、catalog組立てをこの操作内で完成する。採用とprofile選択を分け、却下状態を保持する。

反例: 取消後のpoll/bytesを捨て、DB確定失敗時のbytesを回収する。未設定providerを成功にしない。

反映先: P-COMPANION

根拠: LRN-PET-003-kaiya1, LRN-PET-005-kaiya1, LRN-PET-006-kaiya1, LRN-PET-007-kaiya1, LRN-INT-018-CATALOG-kaiya1

## R24

raw XML fixtureの合格はZIP/進捗・実Apple export対応を含まなかった。

本番のZIP内export.xmlはstream展開adapterと圧縮/展開上限を同じ操作の実装範囲に含める。batch進捗をUIへ渡す。

反例: raw XML限定を本番ZIP受入の完了にせず、DTD方針を実Apple exportの構造で確認する。

反映先: P-HEALTH, P-HEALTH-CORE

根拠: LRN-HLT-001-health-file-import

## R25

connectionIdだけでは本人/端末bindingを検査できず、native shellの実API接続が欠けた。

connectionIdをactor/namespace/paired deviceに一意に結び、INT-021でplugin target登録・API URL/TLS・本人認証・限定CORSまたはnative transportを接続する。

反例: 別scope/deviceのanchor再利用を拒否し、DB commit前にackしない。Xcode/署名/実機なしを完了にしない。

反映先: P-HEALTH-CORE, P-NATIVE

根拠: LRN-NAT-001-kaiya1, LRN-HLT-004-kaiya1

## R26

PlaceLevelの理想受入に対応する共有DTO/保存契約がなかった。

隔離PoCと製品接続を分け、製品化前に外殻・入口・垂直接続・用途volumeの共有契約と保存を決める。

反例: unknown高さを実測にせず、PoCだけでMAP/INT接続完了としない。

反映先: P-MOBILE

根拠: LRN-FUT04-place-level-contract

## R27

focused testが通っても標準runnerのloadや共有DBで失敗した。

標準runnerの収集とNode/Bunを明示分離し、テストworkerへ一時DBを注入する。file再open受入は残す。 提出するtestの命名・配置・環境指定が標準runnerの収集対象であることを確認し、独自configだけの成功を提出しない。

反例: 型cast、suite除外、常時直列化、既定DB事前削除で失敗を隠さない。

反映先: P-AI, P-EXTENSIONS, P-RUNTIME

根拠: LRN-EXT-005, LRN-product-test-fixture-types, LRN-DEV-001-test-database-isolation

## R28

hook世代・OS・trust・親directory・receipt所在の差が開始や終了を繰り返し止めた。

TASK_EXECUTIONとtoolingの一経路を使い、worktree-local hooks、pretrust、UTF-8 bytes、保存receipt、単一processの結果確認、最新helperによるfinishを継承する。親directory作成をCodexが実施する。 担当・Task ID・Issue・worktree・head・必要pathを一度で引き継ぎ、開始時に既知pathを全取得する。失敗した開始の復旧は保存receiptと単一processの最終結果を照合する。

反例: 失敗claim・CAS競合・他token・未merge・別cloneを成功にせず、時刻だけでlockやbranchを消さない。通常commit/push/finishの遠隔照合を残す。

反映先: P-START

根拠: LRN-001-workflow-migration, LRN-004, LRN-AI-001-hook-config, LRN-AI-009-worktree-trust, LRN-DATA-002-worktree-parent, LRN-MEDIA-001-worktree-parent, LRN-MEDIA-002, LRN-MEDIA-003-worktree-parent, LRN-OPS-002, LRN-OPS-LAND-MIGRATION, LRN-PLC-001-worktree-trust, LRN-UI-001-hooks, LRN-map001-worktree-hook-skew, LRN-owner-develop-workflow, LRN-prep009-registration, LRN-rehearsal-throughput, LRN-windows-hooks, LRN-windows-shared-git-timeouts, LRN-worktree-hooks-isolation

## R29

任意機能の未接続が要件や準備から抜け、UI画像が実接続と混同され得た。

受領UIと採用規則、素材/native/健康同意/実接続の前提を該当Issueへ置き、後続に口頭説明を残さない。

反例: 画像や契約だけで実装/利用者承認済みにせず、外部入力待ちを暗黙の機能削除へ変えない。

反映先: P-START

根拠: LRN-002

## R30

静的HTML見本は実React部品の動作を検証していなかった。

fixtureは実部品をmountし、狭幅寸法と閉じる・再試行操作によるstate変化を確認する。 StrictModeのeffect cleanupは取消として処理し、利用者向け失敗表示にしない。通常mountと再mountの操作結果を確認する。

反例: 静的スクリーンショットだけを実部品の受入証拠にしない。

反映先: P-RUNTIME

根拠: LRN-UI-001-hooks, LRN-AI-009-review-fixes

## 発見した依存の反映

hardはgraphの推移到達性、connect_afterは接続条件、within_issueは同じIssueの内部責任として検査します。

| 利用側 | 供給側 | 関係 | 理由 | 根拠 |
|---|---|---|---|---|
| P-COMPANION | P-RUNTIME | hard | private atlas取得にはJSON化しない実HTTP boundaryが必要。 | R19 |
| P-DIARY | P-RUNTIME | hard | 写真の再表示は同じ所有文脈のbytes/MIME取得が必要。 | R19 |
| P-COMPANION | P-RUNTIME | hard | 生成previewも実asset内容が必要。INT-017経由の推移依存で足りる。 | R23 |
| P-AI | P-AI | within_issue | descriptorだけでなく実行準備状態を確定してからlive操作を完了する。 | R01 |
| P-AI | P-RUNTIME | hard | settingsRevisionは既存bootstrapで取得する。PREF-001の追加待ちにしない。 | R04 |
| P-AI | P-AI | within_issue | job取消・apply制御は再利用し、質問側で二重実装しない。 | R02 |
| P-AI | P-AI | within_issue | 質問保存Portのmodule fixtureで先に着手し、実接続は質問journeyで結ぶ。hard化すると循環する。 | R02 |
| P-ROUTE | P-RUNTIME | connect_after | sample networkの供給元を明示する。GraphPortの純計算だけではnetwork取得を代替できない。 | R11 |
| P-WORKSPACE | P-RUNTIME | hard | clone後の実在actor・設定・seedがbootstrapまで揃う必要がある。 | R20 |
| P-WORKSPACE | P-WORKSPACE | within_issue | export専用provenance guardとcatalog登録を同じIssueで完成する。HLT-006/007全体の完了待ちは不要。 | R20 |
| P-RECORD | P-RECORD | within_issue | optional候補区間を正式Portで受け取り、実在Placeと対応する。fixture着手は待たない。 | R08 |
| P-NATIVE | P-NATIVE | within_issue | Swift pluginのApp target登録・API transportをnative shellへ組み立てる。 | R25 |
| P-NATIVE | P-HEALTH-CORE | hard | 本人sessionと端末bindingでanchorのscopeを保証する。 | R25 |
| P-DEPLOY | P-WORKSPACE | hard | 一般exportとimportを区別し、移行前の正本出力を入力として使う。 | R20 |
