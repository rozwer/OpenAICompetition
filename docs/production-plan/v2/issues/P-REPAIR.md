<!-- task-id: P-REPAIR -->
# P-REPAIR：地域情報を取り込み、出典と差分を見て修復し、再計算を確認できる

[共通受入](../common-acceptance.md)を適用する。完了は当日の操作・保存・再表示で判定する。

## 操作と結果

地域情報を取り込む → 出典・snapshot・差分を読む → 修復を承認または却下する → 保存する → 再計算した場所・候補と元の根拠を確認する。

## 依存と担当範囲

着手依存：P-ROUTE
接続時の依存：
必要provider：
実AI受入：False

編集予定パス（当日作成する）：

- `docs/evidence/INT-009/`
- `server/features/sources/`
- `server/integrations/int-009/`
- `shared/logic/source-normalize/`
- `src/features/sources/`
- `src/integrations/int-009/`

## 読む契約

- `contracts/domain.ts`：ApproveRepairRequest, ApproveRepairResponse, CreateRepairRequest, CreateRepairResponse, CreateSnapshotRequest, CreateSnapshotResponse, CreateSourceRequest, CreateSourceResponse, GetRepairResponse
- `contracts/operations.ts`：approveRepair, createRepair, createSnapshot, createSource, getRepair
- `docs/spec/ENTRY_CONTRACT.md`

実装するoperation：approveRepair, createRepair, createSnapshot, createSource, getRepair
利用するoperation：
対応要件：DATA-004, EXT-013, EXT-016, EXT-017, EXT-018

## 固有の受入条件

- 数値単位が変わったファイルを黙って旧parserで受理しない。
- 新snapshot到着後の古い提案は409。承認失敗で旧factsが残る。
- 列の対応だけの変更と意味変化の変更を区別できる。
- 列名変更と単位変更の3行差分、適用失敗時旧版維持。

## 同じ担当が実装・接続する内容

- DATA-001：列名/座標/単位を検査しtyped PlaceFactsへ写像。変換不能はunknown。
- DATA-002：raw hashとparser版を保持。proposal承認時にだけ更新を公開。
- DATA-003：旧新列3行と変換/単位を比較して承認する。
- INT-009：修復版を承認し現在facts更新→候補/経路再確認まで通知。

## 該当する再発防止

- R18：現在snapshotの列/単位previewを確認してから明示承認・実取込・再読込へ進む。
  - 拒否例：承認前のfacts更新、単位推測、失敗時の旧版破壊を拒否する。
