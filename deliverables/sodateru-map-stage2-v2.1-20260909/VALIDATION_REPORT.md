# 検証レポート — v2.1

2026-09-09。対象は改訂仕様、共有契約、参考実装。アプリ本体・HTTP handler・ライブCodex接続の実装完了を意味しない。

| 検査 | 結果 | 証拠 |
|---|---|---|
| 要件保持 | 元145＋追加12のID・名称・価値・受入本文を完全一致で確認 | evidence/requirement-preservation.json |
| タスク | 114件、全件未割当、依存循環なし、初期依存なし77、POOL8 | evidence/contract-validation.json |
| HTTP/DTO | 89操作、304 schema、139形式例をJSON Schema検査 | evidence/contract-validation.json |
| SQL | 44テーブル、506業務列、seed/FKの確認成功 | evidence/contract-validation.json |
| 型 | 正しい呼出し成功、誤operation/path/body/response等の5例を型で拒否 | evidence/typescript-tests.json |
| 登録形式 | 10ケース成功。重複・宣言不一致・fixtureの誤公開・不一致版を拒否 | evidence/typescript-tests.json |
| 経路制約 | 12ケース成功。道中の適合・違反・欠落・鮮度・車種・運賃不明 | evidence/typescript-tests.json |
| 質問と回答 | 12ケース成功。別原文保存・再送・skip/defer・再入場・再抽出用ID | evidence/question-tests.json |
| 保存参考実装 | 10ケース成功 | evidence/mutation-tests.json |
| 編集ロック | 17ケース成功。ローカルの一時bare repoのみ | evidence/taskctl-tests.json |

TypeScriptはVersion 5.9.3、参考コードはNode v22.22.1。参考コードの計61ケースと5件の型拒否例を確認した。形式例の件数とは別集計。専用OpenAPI意味検証器、実機、実交通、実災害データ、ライブAI、公開配備は今回の検査対象に含めていない。型が合うことを現実の経路やAI効果の証明にしない。

質問フローの例はローカルSQLite参考処理の出力を使用し、再抽出のrequestは型・参照先まで確認。実AIへの送信はしていない。ConnectionReceiptを参考テストから実アプリ用に発行していない。

再現手順はtools/README.md。再生成・再検査すると環境情報やハッシュが変わるため、配布前にtools/package_delivery.pyでmanifest/ZIPを更新する。
