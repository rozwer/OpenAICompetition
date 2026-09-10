# [DISC-003] 発見・イベント・関心API

| 項目 | 契約 |
|---|---|
| 優先度 / 種別 | P1 / module |
| 担当 | 未割当。claim成功者がこのtaskだけを担当する |
| 着手の必須依存 | なし。提供済み契約で独立着手可能 |
| 接続時に必要な実装 | DISC-001 |
| 共有契約 | v2.1.0 / entries.ts / OperationMap / domain.ts / ports.ts |
| 編集ロック | `server/features/discovery/` |
| 規模 | M。時間・期限ではない |
| 元Issue追跡 | DAY-B06, DAY-B07 |
| 対応要件 | DATA-008, DATA-011, DISC-001, DISC-002, DISC-003, DISC-004, DISC-005, DISC-006, DISC-007, DISC-008, NAV-009, REC-009, SELF-012, SELF-013 |
| 状態 | 未着手。アプリ実装済みではない |

## 完成させるもの

ルール選択器を呼びカードとイベントを保存。event再送で二重関心を作らない。

## APIと保存境界

| Endpoint | operationId | Request | Response |
|---|---|---|---|
| `POST /api/v1/discoveries` | openDiscovery | OpenDiscoveryRequest | OpenDiscoveryResponse |
| `GET /api/v1/discoveries/{cardId}` | getDiscovery | path/query | GetDiscoveryResponse |
| `POST /api/v1/discoveries/{cardId}/events` | recordDiscoveryEvent | RecordDiscoveryEventRequest | RecordDiscoveryEventResponse |
| `GET /api/v1/interests` | listInterests | path/query | ListInterestsResponse |

[登録形式](../ENTRY_CONTRACT.md)、[HTTP](../API_CONTRACT.md)、[OpenAPI](../contracts/openapi.yaml)、[DTO](../contracts/domain.ts)、[操作別の型](../contracts/operations.ts)、[SQL](../db/schema.sql)を使用する。機能は独自のentryやpath/body形式を作らない。

## 実装と受入

1. taskctlで依存と全編集pathを確認しclaimする。返されたbase_commitから専用worktreeを作る。
2. descriptorと注入Portを実装する。feature間の具象importはしない。契約変更は別の明示的な差分として調整する。
3. 接続先が未完成でも契約fixtureでmodule単体を確認できる。未接続箇所を記録し、実接続の成功とは区別する。
4. 次の操作を実行し、使用したデータmode・接続mode・保存結果を証拠へ残す。
5. submit→通常mergeまたはfast-forward→main到達確認→land。未完了ならbranchと引継ぎを残してreleaseする。

**受入操作**：設定全停止で能動提案を停止、本人の過去の関心は消さない。

サンプル地理データで本物の保存APIを確認することと、保存APIをfakeにすることは異なる。未知の高さ・架空経路を実測・実案内として示さない。

## 失敗・引継ぎ

Port fakeで確認できるのはmodule境界まで。接続先の実装やINTの完了を主張しない。契約不足はCONTRACT_CHANGE.mdに従って修正する。 追加編集pathは先に全取得する。ロックの待ちが解消できなければ未完了として引き継ぎ、別のREADY/POOLを取得する。
