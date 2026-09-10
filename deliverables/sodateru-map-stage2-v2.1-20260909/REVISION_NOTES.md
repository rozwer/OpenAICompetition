# v2 → v2.1 の修正

2026-09-09。ユーザー承認に基づき、受領したPro原本の6件のレビュー指摘を修正した。Pro原本は別に保全。本版はアプリへの実装ではなく、実装へ渡す仕様・契約・参考コードの改訂。

| 指摘 | 修正 | 主な確認 |
|---|---|---|
| R1 登録形式が未確定 | entries.ts、map-ports.ts、ENTRY_CONTRACT.md、最小登録例 | 重複entry/operation、宣言と登録の不一致、fixtureの誤公開を拒否 |
| R2 道中の情報が不足 | RouteLegのedgeFacts/coverage/transit/passAssessments | 目的地の条件を固定し、道中の適合・不適合・不明を区別 |
| R3 質問の回答保存がない | FollowUpQuestion/QuestionResponse、3 API、QuestionPort、回答IDによる再抽出 | 原文保持、再送、skip/defer、再入場、別体験参照の拒否 |
| R4 統合もfakeで完了できる | INT/GATE専用の未完了・受入規則へ変更 | 全該当Issueの規則と分割依存を検査 |
| R5 統合が大きすぎる | 比較/移植/返信、汎用生成導入/各テーマを分割 | 他枝や三テーマ全完成を不要に。INT-002の表示UI依存を明記 |
| R6 APIの型が操作に結び付かない | OpenAPIからOperationMapを生成 | 正しい呼出しが通り、未知operation/誤body/誤responseが型エラー |

要件は157件のまま。タスク114件、API89操作、304 schema、44テーブル、506業務列。全タスク未割当・時間割なし・8件の独立POOLを維持。新たな外部サービス、課金、実コード実行機能は有効化していない。

この改訂にはv2とのwire非互換変更がある。新旧の型を混在させず一括配布する。既存DBへの再適用や現在のアプリの置換は行わない。既存Nextを使う場合はENTRY_CONTRACT.md第4節の構造対応を先に行う。
