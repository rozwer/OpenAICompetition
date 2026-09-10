<!-- task-id: P-SHARE -->
# P-SHARE：共有範囲を選び、友人と体験を比較・返信し、共有を取り消せる

[共通受入](../common-acceptance.md)を適用する。完了は当日の操作・保存・再表示で判定する。

## 操作と結果

体験ごとの共有項目を選ぶ → 相手のレンズで比較する → 感想・返信を保存する → 共有を取り消す → 再入場で非公開部分が消えることを確認する。

## 依存と担当範囲

着手依存：P-RECORD
接続時の依存：
必要provider：
実AI受入：False

編集予定パス（当日作成する）：

- `docs/evidence/INT-005/`
- `docs/evidence/INT-012/`
- `server/features/comparison/`
- `server/features/feedback/`
- `server/features/sharing/`
- `server/integrations/int-005/`
- `server/integrations/int-012/`
- `shared/logic/comparison/`
- `shared/logic/sharing/`
- `src/features/feedback/`
- `src/features/social/`
- `src/integrations/int-005/`
- `src/integrations/int-012/`

## 読む契約

- `contracts/domain.ts`：CreateComparisonRequest, CreateComparisonResponse, CreateFeedbackRequest, CreateFeedbackResponse, CreateShareGrantRequest, CreateShareGrantResponse, GetComparisonResponse, ListFeedbackResponse, ListSharedExperiencesResponse, RejectMappingRequest, RejectMappingResponse, RevokeShareGrantRequest, RevokeShareGrantResponse
- `contracts/operations.ts`：createComparison, createFeedback, createShareGrant, getComparison, listFeedback, listSharedExperiences, rejectMapping, revokeShareGrant
- `contracts/ports.ts`：ComparisonPort, SharingPort
- `docs/spec/ENTRY_CONTRACT.md`

実装するoperation：createComparison, createFeedback, createShareGrant, getComparison, listFeedback, listSharedExperiences, rejectMapping, revokeShareGrant
利用するoperation：
対応要件：DATA-003, DATA-006, DATA-007, DATA-009, EVAL-007, MAP-013, NAV-002, ROUTE-008, SOC-001, SOC-002, SOC-003, SOC-004, SOC-005, SOC-006, SOC-007, SOC-008, SOC-009, SOC-011, SOC-012, SOC-013, SOC-014, TRF-006, TRF-011

## 固有の受入条件

- 用途のみ共有のJSONにreason/text/写真が出ない。
- 取消直後の次fetchとAI applyで旧共有内容が出ない。
- 根拠の無い似ている推論は確定扱いしない。拒否対応は再提示しない。
- 相手レンズ表示と自分の正本の編集対象を混同しない。
- 相手の共有取消で保存済み結果もstale。否定対応を保持。
- 元体験の共有取消後も本人の実訪問/自作文が残る。
- 時間不足で行かなかったことをdislikeへ変換しない。
- 比較を保存して再読込。対応否定が残り、相手レンズが同じ体験を指す。非公開原文は出ない。
- 感想の作成・再表示・共有取消後の本人原文保持を実APIで確認。

## 同じ担当が実装・接続する内容

- SOC-001：ShareGrantからSharedExperience DTOだけを作る。非許可原文/写真を含めない。
- SOC-002：検索と詳細で同じ投影を使う。取消はgrantRevisionを増し派生をstaleにする。
- SOC-003：同じ場所/別用途、別場所/同役割、実用知、似て非なる理由を区別。
- SOC-004：違いと共通役割を比較カードにし、項目共有を切り替えられる。
- SOC-005：投影済み入力から比較を作り版とgrantVersionsを保持。
- SOC-008：ownExperienceを保存済み参照し元作者の体験を上書きしない。共有引用は現在投影で返す。
- SOC-009：残した・変えた・合う/合わない・行かなかったを選ぶ。
- INT-005：共有済み体験を比較し、同じ場所の相手レンズと対応否定を実API・DBで接続する。移植・返信完成を待たない。
- INT-012：本人の実践記録を保存し、許可された元体験への感想を返す。移植機能未完成でも既存体験から利用できる。

## 該当する再発防止

- R15：現在grantと最新Evidenceから読み直して投影し、非許可fieldはnull/空配列にする。同じinput/grant版の拒否mappingは保存層で除外する。
  - 拒否例：許可取消後の原文・写真流出、保存した拒否の再提示を拒否する。
