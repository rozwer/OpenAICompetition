# P-DIARY：写真と日記を保存・編集し、再起動後に同じ内容を読める

[共通受入](../common-acceptance.md)を適用する。完了は当日の操作・保存・再表示で判定する。

## 操作と結果

記録に写真と日記を添える → 保存して編集する → アプリを再起動する → 認可された画像bytesと原文を読む。

## 依存と担当範囲

着手依存：P-RECORD, P-WORKSPACE
接続時の依存：
必要provider：
実AI受入：False

編集予定パス（当日作成する）：

- `docs/evidence/INT-010/`
- `server/features/diaries/`
- `server/integrations/int-010/`
- `src/features/diary/`
- `src/integrations/int-010/`

## 読む契約

- `contracts/domain.ts`：CreateDiaryRequest, CreateDiaryResponse, ListDiariesResponse, UpdateDiaryRequest, UpdateDiaryResponse
- `contracts/operations.ts`：createDiary, listDiaries, updateDiary
- `docs/spec/ENTRY_CONTRACT.md`

実装するoperation：createDiary, listDiaries, updateDiary
利用するoperation：
対応要件：DATA-008, DATA-011, DISC-007, EVAL-004, NAV-009, OPS-007, REC-009, SELF-012

## 固有の受入条件

- AI下書きが未承認のまま本人の確定文にならない。
- 写真アップロード失敗時も本文の草稿を保持。
- 再起動後に本文と写真参照が戻る。出力の確認を重複させない。

## 同じ担当が実装・接続する内容

- MEDIA-002：原記録への参照と承認版の日記・asset参照を保存。
- MEDIA-003：日記編集、写真選択、圧縮しすぎないpreview、保存済み表示。
- INT-010：日記本文と写真参照を実API/DBで保存して再表示する。設定・出力の受入はPREF-001/PREF-002へ集約する。

## 該当する再発防止

- R19：HTTP hostで同じ認可文脈の保存metadataとbytesからraw response/MIMEを返す。
  - 拒否例：PNG byteとContent-TypeをHTTPで一致させ、他actorはbytes読取り前に拒否する。
