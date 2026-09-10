# P-APP-STUDIO：本人のAIへ改造依頼を渡し、previewからデータを保って戻せる

[共通受入](../common-acceptance.md)を適用する。完了は当日の操作・保存・再表示で判定する。

## 操作と結果

本人のAIへ開発契約を渡す → 本体のUI・機能改造をpreviewする → 採用する → データを保持してrollbackする。

## 依存と担当範囲

着手依存：P-EXTENSIONS
接続時の依存：
必要provider：
実AI受入：False

編集予定パス（当日作成する）：

- `future/fut11/`
- `future/fut12/`

## 読む契約

- `docs/spec/TASK_EXECUTION.md`

実装するoperation：
利用するoperation：
対応要件：NEW-006, NEW-007, NEW-008, OPS-005

## 固有の受入条件

- 通常ブラウザはCLIを勝手に起動せず、許可したPCのrepoだけを利用者契約で変更する。
- 自分タブに新画面と集計を追加し、既存訪問を残したまま旧buildへ戻す。既存データ破壊を許可なしでしない。

## 同じ担当が実装・接続する内容

- FUT11：DevelopmentRequestをexport→PC上のloopback bridgeでhuman approval→repo allowlist/worktree作成→自身のCodex認証でtask実行→progress/preview URLを返す→承認後artifact取得。
- FUT12：許可pathsを限定した別worktreeでUI/処理を生成→schema変更計画→SQLite複製でpreview→旧データ互換を確認→本人承認→artifact切替。code rollbackとdata restoreを分離。deployや汎用plugin完成を待たずローカルで実証。

## 該当する再発防止

