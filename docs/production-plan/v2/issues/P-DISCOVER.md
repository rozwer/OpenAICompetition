<!-- task-id: P-DISCOVER -->
# P-DISCOVER：場所や記録から発見を選び、関心の変化を振り返れる

[共通受入](../common-acceptance.md)を適用する。完了は当日の操作・保存・再表示で判定する。

## 操作と結果

場所や記録から発見カードを開く → 根拠を読む → 既知・関心を選ぶ → 保存する → 振り返りで関心の変化を見る。

## 依存と担当範囲

着手依存：P-REFLECT
接続時の依存：
必要provider：
実AI受入：False

編集予定パス（当日作成する）：

- `docs/evidence/INT-007/`
- `fixtures/discovery-reviewed/`
- `server/features/discovery/`
- `server/integrations/int-007/`
- `shared/logic/discovery/`
- `src/features/discovery/`
- `src/integrations/int-007/`

## 読む契約

- `contracts/domain.ts`：GetDiscoveryResponse, ListInterestsResponse, OpenDiscoveryRequest, OpenDiscoveryResponse, RecordDiscoveryEventRequest, RecordDiscoveryEventResponse
- `contracts/operations.ts`：getDiscovery, listInterests, openDiscovery, recordDiscoveryEvent
- `docs/spec/ENTRY_CONTRACT.md`
- `docs/spec/TASK_EXECUTION.md`

実装するoperation：getDiscovery, listInterests, openDiscovery, recordDiscoveryEvent
利用するoperation：
対応要件：DATA-008, DATA-011, DISC-001, DISC-002, DISC-003, DISC-004, DISC-005, DISC-006, DISC-007, DISC-008, NAV-009, REC-009, SELF-012, SELF-013

## 固有の受入条件

- 探索opt-inでもblocked概念は出ない。固有事実に出典がなければ断定しない。
- 気になるだけがinterestへ残る。閉じるを嫌いとして学習しない。
- 設定全停止で能動提案を停止、本人の過去の関心は消さない。
- 興味は自分一覧へ、既知/閉じるは別記録。
- 場所に架空固有事実をつけず、観察の問いがある。
- 固有事実の出典では掲載サイトと著者・作成機関を区別し、根拠箇所と帰属を照合する。掲載者を著者として表示しない。

## 同じ担当が実装・接続する内容

- DISC-001：場所/建物/写真anchorからfeature→bridge→knowledgeを選ぶ。禁止と苦手を分離。
- DISC-002：本人が開くカードと、既知/興味/閉じる/禁止の別操作。
- DISC-003：ルール選択器を呼びカードとイベントを保存。event再送で二重関心を作らない。
- INT-007：本人主導の発見を地図/写真anchorに接続。
- POOL-003：一般知識/固有事実と出典を分離した短い発見カードを用意。

## 該当する再発防止

- R18：現在snapshotの列/単位previewを確認してから明示承認・実取込・再読込へ進む。
  - 拒否例：承認前のfacts更新、単位推測、失敗時の旧版破壊を拒否する。
