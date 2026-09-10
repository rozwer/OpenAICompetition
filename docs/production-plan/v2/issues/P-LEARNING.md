# P-LEARNING：写真と利用履歴からの提案を評価し、継続価値と費用を確かめられる

[共通受入](../common-acceptance.md)を適用する。完了は当日の操作・保存・再表示で判定する。

## 操作と結果

写真・利用履歴から提案を受ける → 本人の選択と反例を保存する → 比較実験で学習と将来予測を評価する → 継続価値と費用の測定結果を確認する。

## 依存と担当範囲

着手依存：P-AI, P-DISCOVER, P-TRANSFER
接続時の依存：
必要provider：
実AI受入：False

編集予定パス（当日作成する）：

- `future/fut07/`
- `future/fut08/`
- `future/fut20/`

## 読む契約

- `contracts/domain.ts`：ApplyCorrectionsRequest, ApplyCorrectionsResponse, PreviewCorrectionsRequest, PreviewCorrectionsResponse
- `contracts/operations.ts`：applyCorrections, previewCorrections
- `docs/spec/TASK_EXECUTION.md`

実装するoperation：applyCorrections, previewCorrections
利用するoperation：
対応要件：DATA-012, DISC-001, DISC-002, DISC-003, DISC-004, DISC-005, DISC-006, DISC-007, DISC-008, EVAL-001, EVAL-002, EVAL-003, EVAL-007, EVAL-008, OPS-006, SELF-004, SELF-005, SELF-006, SELF-007, SELF-008, SELF-009, SELF-010, TRF-011

## 固有の受入条件

- 訂正による画面変化を精度改善と呼ばず、未使用将来ログでcalibrationと適合を測る。
- 写真の建物名が不明でも対象の構造から発見でき、禁止分野は能動探索でも出ない。
- 少数デモを科学的効果と主張せず、保持率/未知概念/意図と結果の差/費用を実測する。

## 同じ担当が実装・接続する内容

- FUT07：候補提示/選択/制約/結果をログ→階層Bayesまたは正則化pairwise model→contextを少数に→time splitの将来選択予測→単純頻度/申告のみ/理由なしと比較。
- FUT08：画像特徴を本人確認→一般知識の出典検索→anchor bridgeを検証→known graph更新→receptive&&available&&optinの時だけ一枚→週後の自主学習/関心を評価。
- FUT20：cold start到達時間→任意同意の継続観測→自己理解/移植/発見の別評価→heldout/ablation→アプリAI/地図/交通/compute/storageの実請求から1人当りcost算出。

## 該当する再発防止

