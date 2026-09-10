# P-RECORD：観測や原文を場所へ記録し、本人が確認した体験と成長を再表示できる

[共通受入](../common-acceptance.md)を適用する。完了は当日の操作・保存・再表示で判定する。

## 操作と結果

場所または観測入力を選ぶ → 原文を記録する → 本人が訪問・用途を確認する → 保存を確認する → 再入場して体験と建物の変化を読む。

## 依存と担当範囲

着手依存：P-MAP
接続時の依存：P-REFLECT
必要provider：
実AI受入：False

編集予定パス（当日作成する）：

- `contracts/ports.ts`
- `docs/evidence/INT-001/`
- `docs/evidence/REC-005/`
- `docs/spec/ENTRY_CONTRACT.md`
- `docs/spec/MAP_GROWTH_AND_DISCOVERY.md`
- `server/features/experiences/`
- `server/features/meaning/`
- `server/features/observations/`
- `server/features/visits/`
- `server/integrations/int-001/`
- `shared/logic/meaning/`
- `shared/logic/observations/`
- `src/api/draft.ts`
- `src/features/record-create/`
- `src/integrations/int-001/`

## 読む契約

- `contracts/domain.ts`：CreateExperienceRequest, CreateExperienceResponse, DeleteExperienceRequest, DeleteExperienceResponse, GetBootstrapResponse, GetEvidenceResponse, GetExperienceResponse, GetHistoryResponse, GetMeaningResponse, ImportObservationsRequest, ImportObservationsResponse, ListExperiencesResponse, ListVisitsResponse, UpdateVisitRequest, UpdateVisitResponse
- `contracts/operations.ts`：createExperience, deleteExperience, getBootstrap, getEvidence, getExperience, getHistory, getMeaning, importObservations, listExperiences, listVisits, updateVisit
- `contracts/ports.ts`：ApiPort, DbPort, MeaningPort, ObservationCandidateInterval, ObservationsPort
- `docs/spec/MAP_GROWTH_AND_DISCOVERY.md`

実装するoperation：createExperience, deleteExperience, getEvidence, getExperience, getMeaning, importObservations, listExperiences, listVisits, updateVisit
利用するoperation：getBootstrap, getHistory
対応要件：CORE-001, CORE-002, CORE-003, DATA-002, EVAL-002, EVAL-004, MAP-001, MAP-002, MAP-003, MAP-004, MAP-005, MAP-009, MAP-012, MAP-014, NAV-005, NAV-007, NEW-004, OPS-004, OPS-007, REC-001, REC-002, REC-003, REC-004, REC-005, REC-006, REC-008, REC-010, REC-011, SELF-002, SELF-003, SELF-009

## 固有の受入条件

- 保存前に成長せず、保存済み原文・ID・本人stateが再表示で一致する。
- 生成操作IDを実OpenAPI decoderへ渡せる。API失敗後の再送で重複記録しない。
- 未確定・重複訪問は成長しない。理由だけの訂正で用途本体を変えない。
- 確認時刻を保存境界から受け取り、呼出側ごとに推測しない。
- 同じファイルを再取込して重複ゼロ。通過と確定訪問を分離。
- 候補からconfirmした場所だけ育つ。建物内の全階へ加算しない。

## 同じ担当が実装・接続する内容

- INT-001：場所に原文を記録し、保存後も同じ場所の体験と成長を確認できる
- REC-005：確定した訪問と用途から再利用可能なMeaningを作る
- REC-006：raw record→時刻順Observationと候補区間。source+recordID/hashで重複排除。120秒gap/50m accuracyは製品ヒューリスティック。
- REC-007：正規化adapterを呼び観測とcandidateを保存。確認/却下/場所修正/削除を扱う。

## 該当する再発防止

- R06：原文保存と再送IDを実OpenAPI decoder・SQLiteで確認し、既送信草稿の再送identityを保つ。 注入なしの既定ID生成・cryptoなしfallback・復元草稿から作るrequestを製品のHTTP decoderへ通す。未送信の旧草稿移行と送信済み再試行を分ける。
  - 拒否例：失敗後再送の重複、別actor削除、原文欠落を拒否する。 型がstringであることや有効なIDを注入したfixtureだけをHTTP適合の証拠にしない。送信済みopIdを再入場時に振り直さない。
- R07：用途確認時刻を明示してMeaningへ渡す。訂正は原文・本人状態を保ち、同一transactionでAI staleと通知を確定する。
  - 拒否例：理由だけの変更で古い用途を最新にせず、Meaning失敗なら正本更新もrollbackする。
- R08：ObservationsPortの候補区間と精度・source identityを使い、一意の実在Placeだけへcandidate Visitを保存する。
  - 拒否例：曖昧な最近傍やplaceholder Placeを作らず、候補だけでconfirmedや成長にしない。
