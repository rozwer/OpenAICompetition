# 共有契約 v2.1.0

HTTP正本は [contracts/openapi.yaml](../../contracts/openapi.yaml)、同値JSONは [contracts/openapi.json](../../contracts/openapi.json)。JSON Schemaは [contracts/schemas.json](../../contracts/schemas.json)、生成済みTypeScriptは [contracts/domain.ts](../../contracts/domain.ts)。DB正本は [db/schema.sql](../../db/schema.sql)、DTOとの列対応は [DB_COLUMNS.csv](../../DB_COLUMNS.csv)。

純関数・UI・APIの間は [contracts/ports.ts](../../contracts/ports.ts)。DbPort、ApiPort、MeaningPort、HypothesisPort、GraphPort、ConstraintPort、TransferPort、SharingPort、AiPort、DslPortを固定する。自由な`any`で埋めず、戻り値のunknownやno-routeを扱う。

## 実装境界
UIはApiPortを呼び、DBを直接触らない。機能APIは自身のファイルでhandlerを実装し、共通DbPortの短いmutationを使う。pure logicは引数でDTOを受け取り、通信もSQLも行わない。provider/AIはDTOへ正規化して返す。意味の建物はMeaning DTOを描画するだけで人格推定をしない。

## 契約の共通事項
camelCaseのHTTPとsnake_caseのDBをdto-map通り変換する。省略可とnull可を区別する。unknownをfalse/0へ丸めない。原文Evidence、正本Experience、AI提案Interpretation、本人Correction、派生Meaningを別にする。共有は許可された投影をserverで作り、UIで隠すだけにしない。

`examples/http/`の例は全operationの形式例であり、存在するレコードIDや地理的正しさを保証する実データではない。`examples/record-flow.json`は作成と訂正のつながる例。`examples/seed-core.json`は最小DB seed用。

## 改訂ルール
新featureは独自endpointや列を勝手に追加しない。まず [CONTRACT_CHANGE.md](CONTRACT_CHANGE.md) に従う。共有ファイルを読めることと、同時編集できることは別。生成済み型を各moduleが別々に編集しない。

## v2.1追加

登録形式はdocs/spec/ENTRY_CONTRACT.mdとcontracts/entries.ts、地図の純部品はcontracts/map-ports.ts。ApiPortはcontracts/operations.tsのOperationMapを使い、操作名・path・query・body・responseを結び付ける。

RouteLegの道中情報、FollowUpQuestion/QuestionResponse、extractのquestionResponseIdsを追加した。QuestionProposalへの変更とRouteLegの必須field追加を含むため、v2クライアントとwire互換ではない。空repoへの一括配布用であり、稼働中DBにDDLを再実行しない。
