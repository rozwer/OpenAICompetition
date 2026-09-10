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
