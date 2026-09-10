# P-DEPLOY：本人認証・共同利用・永続化を備えた非公開環境を運用できる

[共通受入](../common-acceptance.md)を適用する。完了は当日の操作・保存・再表示で判定する。

## 操作と結果

本人認証で非公開環境へ入る → データを移行して共同利用する → 権限を変更・取消する → 再起動・監視・復旧で保存と非公開性を確認する。

## 依存と担当範囲

着手依存：P-AI, P-TOGETHER, P-WORKSPACE
接続時の依存：
必要provider：
実AI受入：False

編集予定パス（当日作成する）：

- `future/fut01/`
- `future/fut02/`
- `future/fut18/`
- `future/fut19/`

## 読む契約

- `docs/spec/TASK_EXECUTION.md`

実装するoperation：
利用するoperation：
対応要件：CORE-001, DATA-001, DATA-003, DATA-004, DATA-005, DATA-006, DATA-007, DATA-008, DATA-009, DATA-010, DATA-011, EVAL-004, MAP-012, MAP-013, NEW-011, OPS-001, OPS-003, OPS-008, REC-011, SOC-001, SOC-002, SOC-003, SOC-004, SOC-005, SOC-011, SOC-013, SOC-014

## 固有の受入条件

- 2端末間で用途だけ公開し、原文がAPI/画像からも出ない。取消後も相手自身の実体験は残る。
- 移行前後のID/訂正/写真/拡張stateが一致し、再起動後も残る。
- 一般exportに読込operationが存在するとは仮定しない。移行API/Portを定義してからID・訂正・写真・拡張state・再起動後の永続性を確認する。
- 公開/任意code導入前の要件を満たす。本日の薄い隔離を本番セキュリティ保証と言わない。
- 同時編集を黙って上書きせず、community OFFでも個人の主要機能が成立する。

## 同じ担当が実装・接続する内容

- FUT01：OIDCまたはprovider認証→actorをsessionへ→recipient別投影→grant revision→検索/会話/画像URL/生成中結果まで依存失効→2アカウントで取消を確認。
- FUT02：ローカルSQLiteは既に正本。本人export→検証→配備先へのmigration→秘密値/AI workerをserverへ分離→非公開preview→backup/restoreを実証。コード移行とデータ移行を別承認。
- FUT18：境界ごとの脅威モデル→認可/秘密/remote code sandbox→負荷/timeout/resource budget→監視/backup→位置収集/描画の消費電力を計測→最適化。
- FUT19：共同案の版/提案/承認→本人希望を別保持→実友人の共有リンク→地域tipの鮮度/投票/訂正→取消時のmanaged cache更新→適用中断を明示。

## 該当する再発防止

