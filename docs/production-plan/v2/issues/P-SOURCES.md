<!-- task-id: P-SOURCES -->
# P-SOURCES：OpenUASと追加形式の情報を取り込み、意味の変化を修復できる

[共通受入](../common-acceptance.md)を適用する。完了は当日の操作・保存・再表示で判定する。

## 操作と結果

OpenUASまたはHTML/PDF等の入力を選ぶ → 正規化した候補と出典を確認する → 意味の変化を承認・修復する → 移植と再計算結果を読む。

## 依存と担当範囲

着手依存：P-REPAIR, P-TRANSFER
接続時の依存：
必要provider：
実AI受入：False

編集予定パス（当日作成する）：

- `future/fut06/`
- `future/fut13/`

## 読む契約

- `docs/spec/TASK_EXECUTION.md`

実装するoperation：
利用するoperation：
対応要件：EXT-016, EXT-017, TRF-007, TRF-008, TRF-009, TRF-010

## 固有の受入条件

- 実vector使用を記録し、is_complemented表示が残る。都市外へ無理に外挿しない。
- 5形式全てを取り込め、単位/対象範囲変化は列名修復だけで自動適用しない。

## 同じ担当が実装・接続する内容

- FUT06：東京/名古屋の必要meshだけ読込→anchor/model/time/versionを照合→compatible空間のみcosine top-k→広域候補→POI検索→feasibility検証→属性のみbaselineと候補差比較。
- FUT13：API/CSV/GeoJSONにHTMLとPDFを追加→許可URL/単位/時刻/source version→schema drift/semantic driftを分離→parser提案と3行diff→回帰fixture→承認適用→previous parser復帰。

## 該当する再発防止

