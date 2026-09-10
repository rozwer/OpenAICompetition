# P-EXPLORE：候補から歩く・訪問確認・記録へ進み、次の探索へ戻れる

[共通受入](../common-acceptance.md)を適用する。完了は当日の操作・保存・再表示で判定する。

## 操作と結果

候補を選ぶ → 歩行・場所で過ごす操作へ進む → 訪問を確認して記録する → 保存結果を見る → 更新後の探索へ戻る。

## 依存と担当範囲

着手依存：P-REFLECT
接続時の依存：
必要provider：
実AI受入：False

編集予定パス（当日作成する）：

- `API_ENDPOINTS.csv`
- `DB_COLUMNS.csv`
- `contracts/domain.ts`
- `contracts/exploration.ts`
- `contracts/openapi.json`
- `contracts/openapi.yaml`
- `contracts/operations.json`
- `contracts/operations.ts`
- `contracts/schemas.json`
- `db/dto-map.json`
- `db/migrations/004_exploration-display-fields.sql`
- `db/schema.sql`
- `docs/evidence/INT-022/`
- `docs/spec/MIST_EXPLORATION.md`
- `examples/http/`
- `server/features/corrections/`
- `server/features/experiences/`
- `server/features/exploration/`
- `server/features/places/`
- `server/features/visits/`
- `server/integrations/int-022/`
- `shared/logic/exploration/`
- `src/features/exploration/`
- `src/integrations/int-001/`
- `src/integrations/int-022/`
- `src/map/exploration/`
- `tools/build_contracts.py`
- `tools/mist_exploration_contracts.py`

## 読む契約

- `contracts/domain.ts`：CreateExperienceRequest, CreateExperienceResponse, GetCandidateSetResponse, GetExperienceResponse, GetExplorationCandidateResponse, GetExplorationPreferencesResponse, GetMeaningResponse, ListExplorationCandidatesResponse, PlanRouteRequest, PlanRouteResponse, PutExplorationPreferencesRequest, PutExplorationPreferencesResponse, RefreshExplorationCandidatesRequest, RefreshExplorationCandidatesResponse, RespondExplorationCandidateRequest, RespondExplorationCandidateResponse
- `contracts/exploration.ts`
- `contracts/map-ports.ts`：MapDependencies
- `contracts/operations.ts`：createExperience, getCandidateSet, getExperience, getExplorationCandidate, getExplorationPreferences, getMeaning, listExplorationCandidates, planRoute, putExplorationPreferences, refreshExplorationCandidates, respondExplorationCandidate
- `docs/spec/MIST_EXPLORATION.md`

実装するoperation：getExplorationCandidate, getExplorationPreferences, listExplorationCandidates, putExplorationPreferences, refreshExplorationCandidates, respondExplorationCandidate
利用するoperation：createExperience, getCandidateSet, getExperience, getMeaning, planRoute
対応要件：EXP-REQ-001, EXP-REQ-002, EXP-REQ-003, EXP-REQ-004, EXP-REQ-005, EXP-REQ-006, EXP-REQ-007

## 固有の受入条件

- 候補の表示・保存だけでは建物が育たない。記録後に候補と本人Meaningを更新する。
- 候補IDとplaceIdを混同せず、未設定のナビを成功表示しない。2D/3Dが同じ選択を示す。

## 同じ担当が実装・接続する内容

- INT-022：候補から訪問・記録へ進み、体験後の探索へ戻れる

## 該当する再発防止

- R13：routes.planの安定entryとplaceIdを使い、解決済みSource・住所・入口を表示し記録後にrefreshする。
  - 拒否例：raw Source IDを説明にせず、失効/別scope Sourceや候補IDをPlaceとして渡さない。
- R14：候補の関心・非表示・次の探索は本人scopeのrulesで保存し、確認した体験だけをMeaningへ反映する。
  - 拒否例：閲覧・近接・経路選択で訪問を確定せず、physical/peerへ本人候補を混入しない。
