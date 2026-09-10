<!-- task-id: P-HEALTH -->
# P-HEALTH：健康情報を許可して取り込み、統計とAI提案を確認・採用・失効できる

[共通受入](../common-acceptance.md)を適用する。完了は当日の操作・保存・再表示で判定する。

## 操作と結果

本人領域で許可を設定する → XMLをpreviewして取り込む → 欠測と日境界を含む統計を読む → 実AI提案を確認して距離案を明示採用する → 許可を失効・削除して再読込を確認する。

## 依存と担当範囲

着手依存：P-AI, P-HEALTH-CORE
接続時の依存：P-NATIVE
必要provider：private-data-session
実AI受入：True

編集予定パス（当日作成する）：

- `docs/evidence/INT-019/`
- `docs/evidence/INT-020/`
- `docs/spec/HEALTH_INTEGRATION.md`
- `server/ai-tasks/wellbeing/`
- `server/ai/health-guards/`
- `server/features/health-contexts/`
- `server/integrations/int-019/`
- `server/integrations/int-020/`
- `server/services/health-context/`
- `src/client/services/health-file-import/`
- `src/features/health-suggestions/`
- `src/integrations/int-019/`
- `src/integrations/int-020/`

## 読む契約

- `contracts/ai-task-entry.ts`
- `contracts/companion-health.ts`：HealthFileImportPort
- `contracts/domain.ts`：CreateHealthAiContextRequest, CreateHealthAiContextResponse, GetHealthAiContextResponse
- `contracts/operations.ts`：createHealthAiContext, getHealthAiContext

実装するoperation：createHealthAiContext, getHealthAiContext
利用するoperation：
対応要件：HLT-REQ-001, HLT-REQ-002, HLT-REQ-003, HLT-REQ-004, HLT-REQ-005, HLT-REQ-006, HLT-REQ-007, HLT-REQ-008, HLT-REQ-009

## 固有の受入条件

- 選択前にuploadせず、項目/期間で絞り、最大batch/取消/不正XML/単位変換を確認。
- ZIP stream展開adapter・圧縮/展開上限と実Apple exportのDTD方針を初期実装範囲に含める。進捗は既存batch件数を基本とし、bytes進捗の新ABIを必須にしない。
- 本人/許可版/provider/期間/TTL/source版を確認し、最小値だけ固定。撤回で失効。
- 実AIへの入力/出力を型で制限し、撤回後の送信・適用・保存結果の再表示を拒否。既存AI taskを壊さない。
- S-HLT-04で根拠集計を確認し、本人の選択後だけ経路入力を変更。相棒非表示でも利用可能。
- 許可→選択XML→実DB保存→集計→再表示→停止/削除を確認。fixtureでも実保存と明示し、HealthKit取得とはしない。
- 許可最小集計→実Codex→本人採用→実経路APIを確認。既存AI/経路/exportへ認証と失効guardを注入。requiresLiveAI=true。

## 同じ担当が実装・接続する内容

- HLT-001：Apple Health XMLの端末内previewと正規化。該当する機能仕様とentry登録形式に従う。
- HLT-006：健康集計のAI文脈・送信監査serviceとAPI。該当する機能仕様とentry登録形式に従う。
- HLT-007：wellbeing AI task adapterと取得・適用の健康許可guard。該当する機能仕様とentry登録形式に従う。
- HLT-008：健康提案の確認と距離案の明示採用UI。該当する機能仕様とentry登録形式に従う。
- INT-019：XML取込みと健康統計を実保存へ接続。該当する機能仕様とentry登録形式に従う。
- INT-020：健康文脈を実AI提案と経路へ接続。該当する機能仕様とentry登録形式に従う。

## 該当する再発防止

- R24：本番のZIP内export.xmlはstream展開adapterと圧縮/展開上限を同じ操作の実装範囲に含める。batch進捗をUIへ渡す。
  - 拒否例：raw XML限定を本番ZIP受入の完了にせず、DTD方針を実Apple exportの構造で確認する。
