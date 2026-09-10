<!-- task-id: P-TRANSFER -->
# P-TRANSFER：体験の役割を編集し、別都市へ移して差分と根拠を確認できる

[共通受入](../common-acceptance.md)を適用する。完了は当日の操作・保存・再表示で判定する。

## 操作と結果

共有体験から役割レシピを作る → 別都市とモードを選ぶ → 役割の割当と差分を比較する → 保存する → 根拠と変更理由を読み直す。

## 依存と担当範囲

着手依存：P-ROUTE, P-SHARE
接続時の依存：
必要provider：
実AI受入：False

編集予定パス（当日作成する）：

- `docs/evidence/INT-011/`
- `fixtures/transfer-cases/`
- `server/features/recipes/`
- `server/features/transfer/`
- `server/integrations/int-011/`
- `shared/logic/transfer/`
- `src/features/recipe/`
- `src/features/transfer/`
- `src/integrations/int-011/`

## 読む契約

- `contracts/domain.ts`：CreateRecipeRequest, CreateRecipeResponse, GetRecipeResponse, GetTransferResponse, PlanTransferRequest, PlanTransferResponse, UpdateRecipeRequest, UpdateRecipeResponse
- `contracts/operations.ts`：createRecipe, getRecipe, getTransfer, planTransfer, updateRecipe
- `contracts/ports.ts`：TransferPort
- `docs/spec/ENTRY_CONTRACT.md`
- `docs/spec/TASK_EXECUTION.md`

実装するoperation：createRecipe, getRecipe, getTransfer, planTransfer, updateRecipe
利用するoperation：
対応要件：EVAL-003, EVAL-007, NAV-002, SOC-008, SOC-010, TRF-001, TRF-002, TRF-004, TRF-005

## 固有の受入条件

- カテゴリ列のコピーではなく、歩いて切替→対話→一人で整理など順序を編集。
- 思い出を移植可能としない。2モードで説明と尺度が対応する。
- 別都市の3役割を再構成し、retained/changed/nonTransferable/unknownを再表示。
- 入力理由の訂正前後を同じ候補集合で比べられる。
- 役割順序と固定条件を変えると対応が変わり、再読込後も同じTransferPlanを開ける。
- 同カテゴリ選択では説明できない役割の例がある。

## 同じ担当が実装・接続する内容

- TRF-001：役割/順序/固定/可変/思い出を別保存。同じplaceの再登場は別roleId。
- TRF-002：属性baselineで役割ごとに候補を割当。忠実/本人適合を分離、実在性とhardを先に確認。
- TRF-003：candidateSet固定でdiffとRoutePlanを保存。関連版を持ち訂正で再確認を出す。
- TRF-004：忠実さ/本人適合、移せない記憶、unknownを別欄で示す。
- INT-011：保存済み許可体験から役割レシピを作り、移植先の候補へ対応付けて差分と経路を保存する。比較画面や返信を待たない。
- POOL-004：忠実/本人向け、固定/可変/記憶の入力例を作る。

## 該当する再発防止

- R16：本人ごとに所有する同一順序placeIdsを使い、忠実さ/本人適合/実行可能性を別々に記録する。
  - 拒否例：rules scoreを成功確率や実利用者評価とせず、unknown道路・運賃をゼロにしない。
