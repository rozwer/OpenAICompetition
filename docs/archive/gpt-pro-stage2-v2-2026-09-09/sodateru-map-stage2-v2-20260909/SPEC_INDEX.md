# 育てる地図 — Stage2 v2：依存関係で進める実装仕様

2026-09-09 / 契約 v2.0.0。**時間割・固定担当・時間見積りを撤去し、全106タスクを未割当にした改訂版。** 全157要件（元145＋追加12）、旧55受入条件、低優先度の本体改造・デプロイ構想を保持する。旧v1のスケジュール、A/B/C/D所有、単一JSON保存、API型は本版に置換する。

## 開発する価値
場所の原文記録→用途による建物本体の変化→本人の訂正→根拠付き自己理解と次の候補→友人との違い→他都市へ役割と順序を移す→発見→必要な機能の生成・導入。この循環を同じID・原文・版でつなぐ。人格の占い、見せ場のために無関係な順位まで変える演出、生成していない結果の偽装はしない。

## 読む順序
1. [タスク取得・並列実装](TASK_EXECUTION.md) → `tools/taskctl.py ready` → 選んだ `issues/*.md`。
2. [共有契約](CONTRACTS_V2.md) → [API仕様](API_CONTRACT.md) / [DB仕様](DB_SCHEMA.md)。実装者は担当operationとDTOだけを追加で読む。
3. UIは [製品UX](PRODUCT_AND_UX.md)、造形は [地図と発見](MAP_GROWTH_AND_DISCOVERY.md)、拡張は [生成と本体改造](EXTENSIONS_AND_APP_MODIFICATION.md)。

通読版は [SPEC_COMPLETE.md](SPEC_COMPLETE.md)。一覧は [ISSUE_INDEX.md](ISSUE_INDEX.md)、CSVは [ISSUE_BACKLOG.csv](ISSUE_BACKLOG.csv)。`READY_TASKS.csv` は初期依存だけから得た参考値で、実行時は共有boardが正本。

## 今回固定した決定
- Node 22.22.1 / Bun 1.3.14 / mise / Vite・React・TypeScript / MapLibre・Three / Hono / ローカルCodexを出発点にする。**保存だけSQLiteへ変更**。起動済み既存Next/SQLiteを不必要に移植しない。
- `/api/v1` の **86 HTTP操作**、**291 DTO/union**、**42 SQLテーブル**を定義。APIはOpenAPI 3.1.1、DBはそのまま実行できるDDL。階層データも型付きJSONであり自由形式blobではない。
- 全106タスクを手が空いた人・agentが取得する。実装開始はhard依存＋編集pathの空きだけで判定。機能を担当者に永久所有させない。
- `connect_after` は実APIとの接続に必要な実装であり、UI・純関数・provider adapterの着手を止めない。共有契約とfixtureから実装できる。
- P0/P1/P2/P3は重要度・実装の順序。時刻で切替えない。高優先度の接続を解放する下流効果も優先判定に使う。名目5時間は外部の予算条件であり、タスクの時刻・期限へ変換しない。
- 75タスクは初期に着手依存なし。ただしpath競合・環境capability・同時実行の実資源を確認してclaimする。75個の同時起動を約束する数字ではない。8件は小さく独立した追加作業としてPOOLに明示する。

## 完了の意味
仕様・契約・補助コードを提供した状態であり、アプリは未実装。module単体の完了、live接続の完了、デモの完了を分ける。全P1を待たず、P0の通し体験をGATE-001で確認できる。各枝の完了は追加の体験として残し、機能削除の理由にしない。

今回の変更点は [REVISION_NOTES.md](REVISION_NOTES.md)、実行した文書/補助コード検査は [VALIDATION_REPORT.md](VALIDATION_REPORT.md)。GitHubへIssueは登録していない。
