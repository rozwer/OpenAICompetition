# [SELF-003] 履歴・仮説・希望API

| 項目 | 契約 |
|---|---|
| 優先度 / 種別 | P1 / module |
| 担当 | 未割当。claim成功者がこのtaskだけを担当する |
| 着手の必須依存 | なし。提供済み契約で独立着手可能 |
| 接続時に必要な実装 | SELF-002 |
| 共有契約 | v2.1.0 / entries.ts / OperationMap / domain.ts / ports.ts |
| 編集ロック | `server/features/self/` |
| 規模 | M。時間・期限ではない |
| 元Issue追跡 | DAY-B05 |
| 対応要件 | REC-007, SELF-001, SELF-004, SELF-005, SELF-006, SELF-007, SELF-008, SELF-011 |
| 状態 | 未着手。アプリ実装済みではない |

## 完成させるもの

日時窓、hypotheses再計算、明示希望・仮説確認を保存。

## APIと保存境界

| Endpoint | operationId | Request | Response |
|---|---|---|---|
| `GET /api/v1/history` | getHistory | path/query | GetHistoryResponse |
| `GET /api/v1/hypotheses` | listHypotheses | path/query | ListHypothesesResponse |
| `PUT /api/v1/preferences` | putPreference | PutPreferenceRequest | PutPreferenceResponse |
| `PATCH /api/v1/hypotheses/{hypothesisId}` | reviewHypothesis | ReviewHypothesisRequest | ReviewHypothesisResponse |

[登録形式](../ENTRY_CONTRACT.md)、[HTTP](../API_CONTRACT.md)、[OpenAPI](../contracts/openapi.yaml)、[DTO](../contracts/domain.ts)、[操作別の型](../contracts/operations.ts)、[SQL](../db/schema.sql)を使用する。機能は独自のentryやpath/body形式を作らない。

## 実装と受入

1. taskctlで依存と全編集pathを確認しclaimする。返されたbase_commitから専用worktreeを作る。
2. descriptorと注入Portを実装する。feature間の具象importはしない。契約変更は別の明示的な差分として調整する。
3. 接続先が未完成でも契約fixtureでmodule単体を確認できる。未接続箇所を記録し、実接続の成功とは区別する。
4. 次の操作を実行し、使用したデータmode・接続mode・保存結果を証拠へ残す。
5. submit→通常mergeまたはfast-forward→main到達確認→land。未完了ならbranchと引継ぎを残してreleaseする。

**受入操作**：希望保存と履歴集計が再表示される。拒否を全人格へ拡張しない。

サンプル地理データで本物の保存APIを確認することと、保存APIをfakeにすることは異なる。未知の高さ・架空経路を実測・実案内として示さない。

## 失敗・引継ぎ

Port fakeで確認できるのはmodule境界まで。接続先の実装やINTの完了を主張しない。契約不足はCONTRACT_CHANGE.mdに従って修正する。 追加編集pathは先に全取得する。ロックの待ちが解消できなければ未完了として引き継ぎ、別のREADY/POOLを取得する。
