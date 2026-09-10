<!-- task-id: P-TOGETHER -->
# P-TOGETHER：共同の希望と制約を入力し、二人で選べる経路を保存できる

[共通受入](../common-acceptance.md)を適用する。完了は当日の操作・保存・再表示で判定する。

## 操作と結果

二人の希望・定期券・制約を入力する → 共通部分と競合を比較する → 共同経路を選ぶ → 保存後に同じ希望と結果へ戻る。

## 依存と担当範囲

着手依存：P-ROUTE, P-SHARE
接続時の依存：
必要provider：
実AI受入：False

編集予定パス（当日作成する）：

- `docs/evidence/INT-006/`
- `server/features/joint/`
- `server/integrations/int-006/`
- `shared/logic/joint/`
- `src/features/joint/`
- `src/integrations/int-006/`

## 読む契約

- `contracts/domain.ts`：CreateJointPlanRequest, CreateJointPlanResponse, GetJointPlanResponse
- `contracts/operations.ts`：createJointPlan, getJointPlan
- `docs/spec/ENTRY_CONTRACT.md`

実装するoperation：createJointPlan, getJointPlan
利用するoperation：
対応要件：DATA-006, ROUTE-004, ROUTE-005, ROUTE-006, ROUTE-010, SOC-005, SOC-011, SOC-012, SOC-013, TRF-006, TRF-011

## 固有の受入条件

- 一方だけ違反する候補を共同候補に採用しない。不成立理由を表示。
- 片方の締切変更だけで結果が変わる。
- 締切・車種・pass期限を変えて可否/unknownが正しく変わる。

## 同じ担当が実装・接続する内容

- SOC-006：参加者別hardを同時評価。softを平均1点に潰さず左右の説明を保持。
- SOC-007：参加者別入力→共同案保存→再表示。依存未接続中は明示fixtureで開発。
- INT-006：定期券入力から制約計算、共同希望、選択route描画へ接続。

## 該当する再発防止

- R12：採用時にPlace/Pass/Source版と期限を照合する。券管理一覧とprovider営業日での適用判定を分け、health指定時だけ本人許可を検査する。
  - 拒否例：別actor VisitをQuest達成根拠にせず、期限外の券や未知courseを運賃適用済みにしない。
