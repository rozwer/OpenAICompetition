<!-- task-id: P-ROUTE -->
# P-ROUTE：条件と定期券を設定し、根拠付きの経路を比較して選べる

[共通受入](../common-acceptance.md)を適用する。完了は当日の操作・保存・再表示で判定する。

## 操作と結果

希望・制約・定期券を入力する → 同じ候補集合で経路を比較する → 選択を保存する → 条件を変更して理由と差分を確認する。

## 依存と担当範囲

着手依存：P-MAP
接続時の依存：
必要provider：
実AI受入：False

編集予定パス（当日作成する）：

- `server/features/passes/`
- `server/features/routes/`
- `shared/logic/constraints/`
- `shared/logic/graph/`
- `src/features/passes/`
- `src/features/routes/`

## 読む契約

- `contracts/domain.ts`：CreateCandidateSetRequest, CreateCandidateSetResponse, CreatePassRequest, CreatePassResponse, CreateQuestRequest, CreateQuestResponse, DeletePassRequest, DeletePassResponse, GetCandidateSetResponse, GetRouteResponse, ListPassesResponse, PlanRouteRequest, PlanRouteResponse, SetRouteStateRequest, SetRouteStateResponse, UpdatePassRequest, UpdatePassResponse, UpdateQuestRequest, UpdateQuestResponse
- `contracts/operations.ts`：createCandidateSet, createPass, createQuest, deletePass, getCandidateSet, getRoute, listPasses, planRoute, setRouteState, updatePass, updateQuest
- `contracts/ports.ts`：ConstraintEvaluationContext, ConstraintPort, DbPort, GraphPort
- `docs/spec/ENTRY_CONTRACT.md`

実装するoperation：createCandidateSet, createPass, createQuest, deletePass, getCandidateSet, getRoute, listPasses, planRoute, setRouteState, updatePass, updateQuest
利用するoperation：
対応要件：CORE-001, NAV-005, ROUTE-001, ROUTE-002, ROUTE-003, ROUTE-004, ROUTE-005, ROUTE-006, ROUTE-007, ROUTE-009, ROUTE-010, TRF-003

## 固有の受入条件

- 通れないedgeを抜くと別経路またはno-route。
- 階段必須にunknownなら案内確定しない。unknown費用を0円へしない。
- 同じ候補集合で理由変更前後を比較。未達制約は採用不可。
- RouteNetworkPortのversioned snapshot供給をこのIssue内のruntime注入として実装する。sampleはFND-004から供給し、実道路provider未設定はunavailableのまま表示する。
- 条件緩和は本人操作後にだけ再計算。順位が変わらなくても差分理由を表示。
- 期限切れは適用候補にしない。入力保存だけを実運賃対応と称さない。
- unknown運賃とサンプル運賃に区別がある。

## 同じ担当が実装・接続する内容

- RTE-001：GraphPortからedgeIds・時間・距離を返す。同じgraph snapshotから呼出側がpolylineを組み立てる。
- RTE-002：pass/fail/unknown。寄り道は全行程差分+滞在。定期控除未対応はunknown。
- RTE-003：CandidateSet/RoutePlan/Questを保存。運賃/provider状態を戻し、採用済みを勝手に置換しない。 任意healthContextIdを出典として保持できる入口を設ける。本人許可と失効を確認し、未指定は従来動作。健康値からhard条件を自動変更しない。
- RTE-004：出発・目的・寄り道・締切・制約の入力、採用/後で/却下。
- RTE-005：operator/station/via/validity/cardType/providerCourseを保存。
- RTE-006：定期入力、source表示、鉄道/バスと未対応の区別。

## 該当する再発防止

- R11：同じversioned networkからedgeIdsのgeometryと基準全行程を解決する。寄道差分は提案移動−基準移動＋滞在で計算し、欠落はunknownにする。
  - 拒否例：基準10分/提案15分/滞在20分は25分。基準不在を直線や全行程で補わない。
- R12：採用時にPlace/Pass/Source版と期限を照合する。券管理一覧とprovider営業日での適用判定を分け、health指定時だけ本人許可を検査する。
  - 拒否例：別actor VisitをQuest達成根拠にせず、期限外の券や未知courseを運賃適用済みにしない。
- R13：routes.planの安定entryとplaceIdを使い、解決済みSource・住所・入口を表示し記録後にrefreshする。
  - 拒否例：raw Source IDを説明にせず、失効/別scope Sourceや候補IDをPlaceとして渡さない。
