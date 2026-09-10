# P-RELEASE：全対象操作を通して確認し、再現可能な動作版を渡せる

[共通受入](../common-acceptance.md)を適用する。完了は当日の操作・保存・再表示で判定する。

## 操作と結果

新しいcloneから動作版を起動する → 上記全対象操作を連続して使う → 訂正・取消・失敗・復帰を確認する → 同じbuildの証拠とタグを渡す。

## 依存と担当範囲

着手依存：P-COMPANION, P-DIARY, P-DISCOVER, P-EXPLORE, P-EXTENSIONS, P-NATIVE, P-REPAIR, P-TOGETHER, P-TRANSFER, P-HEALTH
接続時の依存：
必要provider：
実AI受入：False

編集予定パス（当日作成する）：

- `docs/demo-cards/`
- `docs/evidence/release/`
- `docs/evidence/responsive/`
- `src/content/states/`

## 読む契約

- `docs/spec/ENTRY_CONTRACT.md`
- `docs/spec/TASK_EXECUTION.md`

実装するoperation：
利用するoperation：
対応要件：DATA-004, DATA-012, EVAL-004, EVAL-005, EVAL-007, EVAL-008, EXT-007, NAV-002, NAV-008, NEW-009, NEW-012, OPS-002, OPS-007, OPS-008, OPS-009, SOC-008

## 固有の受入条件

- 未接続UIはcapabilitiesから外す。本人データを残してdemoを再開始。
- 失敗文に次の操作が1つ明記される。
- 修正前後画像と問題のない操作を記録。
- 実演が止まっても前状態から短く戻る。

## 同じ担当が実装・接続する内容

- GATE-001：記録/訂正/AI/復帰のP0を確認してtag。P1は完成した枝だけ選択し、全P1待ちを禁止。
- POOL-002：各空/失敗状態の短文とボタンlabelをtyped辞書にする。
- POOL-006：既に動く画面のはみ出し・操作不能を記録。元ファイル修正は追加lock取得後。
- POOL-008：時計でなく場面遷移で通し実演を作る。live/sample/replayの区別を記載。

## 該当する再発防止

