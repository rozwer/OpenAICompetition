# 経路から制約へ渡す情報

RouteLegにedgeCoverage、edgeFacts、transit、passAssessmentsを追加した。経路計算側は採用したedgeを確定し、そのedgeのfactsと出典をRouteLegへ投影する。ConstraintPortはこの投影を受け取るため、目的地のPlaceFactsだけで道中の条件を判断しない。

## 階段・屋根・車種

- edgeCoverage=completeは、そのlegの全区間がedgeFactsに対応している場合だけ。通常の非零距離legで空配列ならcompleteを拒否する。
- 各edgeはstairs、coveredをKnownBool、車種別通行条件をVehicleAccessFact[]で持つ。GraphEdgeのnullはunknown、vehicleClasses=nullもunknown。空の既知配列は許可車種なしでありunknownと区別する。
- 有効期限切れの事実は判定時点でunknownとして扱う。未知をfalseへ変換してfilterしない。
- avoidStairsでは一つでも既知stairs=trueならfail。既知違反がなく、欠落・unknownがあればunknown。全区間を確認でき、すべてfalseならpass。
- requireCoveredでは一つでも既知covered=falseならfail。欠落・unknownだけならunknown。全区間がknown trueならpass。
- vehicleClassは対応するVehicleAccessFactを使い、該当classの情報欠落はunknown。歩行者条件から大型二輪の通行可否を推測しない。

既知違反を含む候補は経路選択から除外する。未知を含む候補を診断用に残す場合はfeasibility=unknownとし、条件を満たす経路として採用させない。no-routeとunknownは別。各結果はsourceIdsを引き継ぐ。

## 寄り道と全行程時間

`ConstraintPort.evaluate` の第5引数は optional の `ConstraintEvaluationContext`。`baselineTravelSeconds`
は、同じ出発地から最終目的地まで、今回の寄り道 waypoint を追加する前の「元の全行程」の移動秒数。経路計算側が同じ条件・有効期間で比較可能な値と確認した時だけ渡し、不明・古い・比較不能ならnullまたは省略する。利用者が推測値を入力する項目にしない。

寄り道時間は、`(寄り道後の全 leg の移動秒数 - baselineTravelSeconds) + 今回の全 waypoint の滞在秒数`。最初の leg や直線距離との差にしない。例えば元の全移動 10 分、寄り道後の全移動 15 分、滞在 20 分なら寄り道は 25 分。

contextまたは `baselineTravelSeconds` が欠落・null・非有限・負数、もしくは提案経路の時間が期限切れ等で計算不能なら `detourMinutes=unknown`。数値だけのbaselineの鮮度・同条件性は評価側で再検査できないため、その確認とnull化は呼出し側の責任。未知を0分としない。旧呼出しは従来の4引数のまま互換で、寄り道があるのにcontextを渡さなければ寄り道の成立を確定しない。この context は pure service 間の評価入力であり、HTTP・OpenAPI・DB保存契約は変えない。

## 交通と定期券

transit legにはoperatorCode、lineCode、乗降stationCode、viaStationCodes、出発・到着時刻とprovenanceを持つ。徒歩のlegではtransit=null。交通の情報が未取得ならtransit=nullとし、定期の適用はunknownにする。

PassAssessmentはpassId、適用可否KnownBool、控除後の追加運賃KnownMoney、根拠を持つ。経路provider/運賃adapterが実区間と有効期間を照合して作り、純粋なConstraintPortへ渡す。駅名の一致だけで無料としない。情報未取得を0円にしない。複数定期券を組み合わせる運賃を取得できない場合は、単一券の評価を単純加算せずunknownを返す。

RouteLeg.costは採用した適用条件を反映した追加費用。既知の運賃は出典を持ち、passAssessmentsと一致させる。追加運賃を得られない場合はRouteLeg.costもunknown。実交通providerの接続は元の後続方針を維持する。

`examples/route-constraint-cases.json` は目的地の屋根状態を同じに保ち、道中の屋根だけを変える反例、および定期区間の既知/不明例。`tools/test_route_constraints.ts` は追加した受渡しの参考計算だけを確認する。全経路機能・実災害案内・実交通の成功を意味しない。
