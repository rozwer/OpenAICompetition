# [FUT09] 新規コードプラグイン・隔離ランタイム

| 項目 | 契約 |
|---|---|
| 優先度 / 種別 | P2 / future |
| 担当 | 未割当。claim成功者がこのtaskだけを担当する |
| 着手の必須依存 | EXT-001, EXT-002 |
| 接続時に必要な実装 | 上記の必須依存と受入操作に従う |
| 共有契約 | v2.1.0 / entries.ts / OperationMap / domain.ts / ports.ts |
| 編集ロック | `future/fut09/` |
| 規模 | XL。時間・期限ではない |
| 元Issue追跡 | FUT09 |
| 対応要件 | EXT-002, EXT-008, EXT-009, EXT-010, EXT-011, EXT-012, EXT-013 |
| 状態 | 未着手。アプリ実装済みではない |

## 完成させるもの

DSLで不可能な新関数をDevelopmentRequest→Codexが専用worktreeでTS生成→別に保持したtestで検証→artifact build/hash→networkなしの隔離process/container等で実行→JSON入出力のみhost反映。

## APIと保存境界

HTTPを新設しない。提供済みのOperationMapとPortを使う。

[登録形式](../ENTRY_CONTRACT.md)、[HTTP](../API_CONTRACT.md)、[OpenAPI](../contracts/openapi.yaml)、[DTO](../contracts/domain.ts)、[操作別の型](../contracts/operations.ts)、[SQL](../db/schema.sql)を使用する。機能は独自のentryやpath/body形式を作らない。

## 実装と受入

1. taskctlで依存と全編集pathを確認しclaimする。返されたbase_commitから専用worktreeを作る。
2. descriptorと注入Portを実装する。feature間の具象importはしない。契約変更は別の明示的な差分として調整する。
3. 接続先が未完成でも契約fixtureでmodule単体を確認できる。未接続箇所を記録し、実接続の成功とは区別する。
4. 次の操作を実行し、使用したデータmode・接続mode・保存結果を証拠へ残す。
5. submit→通常mergeまたはfast-forward→main到達確認→land。未完了ならbranchと引継ぎを残してreleaseする。

**受入操作**：未実装の新計算が動き、無限loopは停止、検証後改変artifactは導入されない。workerだけで安全とはしない。

サンプル地理データで本物の保存APIを確認することと、保存APIをfakeにすることは異なる。未知の高さ・架空経路を実測・実案内として示さない。

## 失敗・引継ぎ

Port fakeで確認できるのはmodule境界まで。接続先の実装やINTの完了を主張しない。契約不足はCONTRACT_CHANGE.mdに従って修正する。 追加編集pathは先に全取得する。ロックの待ちが解消できなければ未完了として引き継ぎ、別のREADY/POOLを取得する。
