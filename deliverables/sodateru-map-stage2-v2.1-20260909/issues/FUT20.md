# [FUT20] 実利用評価・継続価値・デプロイ費用計測

| 項目 | 契約 |
|---|---|
| 優先度 / 種別 | P3 / future |
| 担当 | 未割当。claim成功者がこのtaskだけを担当する |
| 着手の必須依存 | SELF-002, DISC-003, TRF-002 |
| 接続時に必要な実装 | 上記の必須依存と受入操作に従う |
| 共有契約 | v2.1.0 / entries.ts / OperationMap / domain.ts / ports.ts |
| 編集ロック | `future/fut20/` |
| 規模 | XL。時間・期限ではない |
| 元Issue追跡 | FUT20 |
| 対応要件 | DATA-012, DISC-008, EVAL-003, EVAL-007, EVAL-008, OPS-006, SELF-004 |
| 状態 | 未着手。アプリ実装済みではない |

## 完成させるもの

cold start到達時間→任意同意の継続観測→自己理解/移植/発見の別評価→heldout/ablation→アプリAI/地図/交通/compute/storageの実請求から1人当りcost算出。

## APIと保存境界

HTTPを新設しない。提供済みのOperationMapとPortを使う。

[登録形式](../ENTRY_CONTRACT.md)、[HTTP](../API_CONTRACT.md)、[OpenAPI](../contracts/openapi.yaml)、[DTO](../contracts/domain.ts)、[操作別の型](../contracts/operations.ts)、[SQL](../db/schema.sql)を使用する。機能は独自のentryやpath/body形式を作らない。

## 実装と受入

1. taskctlで依存と全編集pathを確認しclaimする。返されたbase_commitから専用worktreeを作る。
2. descriptorと注入Portを実装する。feature間の具象importはしない。契約変更は別の明示的な差分として調整する。
3. 接続先が未完成でも契約fixtureでmodule単体を確認できる。未接続箇所を記録し、実接続の成功とは区別する。
4. 次の操作を実行し、使用したデータmode・接続mode・保存結果を証拠へ残す。
5. submit→通常mergeまたはfast-forward→main到達確認→land。未完了ならbranchと引継ぎを残してreleaseする。

**受入操作**：少数デモを科学的効果と主張せず、保持率/未知概念/意図と結果の差/費用を実測する。

サンプル地理データで本物の保存APIを確認することと、保存APIをfakeにすることは異なる。未知の高さ・架空経路を実測・実案内として示さない。

## 失敗・引継ぎ

Port fakeで確認できるのはmodule境界まで。接続先の実装やINTの完了を主張しない。契約不足はCONTRACT_CHANGE.mdに従って修正する。 追加編集pathは先に全取得する。ロックの待ちが解消できなければ未完了として引き継ぎ、別のREADY/POOLを取得する。
