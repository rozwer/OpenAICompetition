# 検証レポート — v2

2026-09-09。対象は仕様・契約・補助実装。アプリ本体の実装/起動を検証した報告ではない。

| 検査 | 結果 | 証拠 |
|---|---|---|
| 旧要件の保持 | 元145＋追加12のID/機能名/価値/元受入を一致確認 | evidence/requirement-preservation.json |
| タスク依存と未割当 | 106件、循環なし、全assignee=null。初期依存なし75、独立POOL8 | evidence/contract-validation.json |
| 旧Issue・受入の追跡 | 56件の旧Issueと55受入を対応 | LEGACY_ISSUE_MAPPING.csv / LEGACY_ACCEPTANCE_TRACE.csv |
| APIと型 | 86操作、291 schema、135 request/response例をJSON Schemaで検査 | contracts/ / evidence/contract-validation.json |
| OpenAPI構造 | YAML/JSON同値、内部ref、path parameter、status、operation一意を確認 | contracts/openapi.json |
| TypeScript | 共有DTO/portsをstrictでtypecheck、成功 | evidence/typecheck.json |
| SQL | 42テーブルのDDLを実行。seed投入とforeign_key_check、481業務列の対応を確認 | evidence/contract-validation.json |
| Gitによる原子的claim | 17ケース成功。同一task競合/別path並列/世代更新/失敗時未取得を確認 | evidence/taskctl-tests.json |
| mutation参考実装 | 10ケース成功。再送/競合/rollback/参照整合を確認 | evidence/mutation-tests.json |
| Issue登録補助 | 2件をdry-run、実repo書込みなし | evidence/issue-import-dry-run.jsonl |
| 保存形式 | 本文参照・JSON/CSV・ZIPメンバーのSHA-256整合を確認 | MANIFEST.sha256 / DELIVERY.json |

## 実行環境と留保

Node参考実装の実行環境は **Node v22.16.0 / SQLite 3.49.1**。推奨するNode22.22.1そのもの、Mac/Windows実機での実行確認ではない。共有型の実際のTypeScript版はtypecheck.jsonに記載する。

専用openapi-spec-validatorパッケージはネットワーク取得ができず未実行。代わりにJSON Schemaの構造/135例、全参照、YAML/JSON同値、path/status、TypeScript、SQLを検査した。OpenAPIの全ての意味規則を専用validatorで網羅したとは主張しない。

アプリのHTTP handler、地図描画、ライブCodex接続、生成DSL実行器、実交通・OpenUAS、実機、デプロイ、GitHub Issue実登録は未実施。本番耐障害性/安全性の認証ではない。helperのGit検査は一時的なローカルbare repoと4cloneだけを用い、利用者のrepoへ書いていない。

helperのテストを多数の本番テスト必須工程としてIssueに追加していない。共有の仕組みが機械的に破綻しないことを、納品前に検査したものである。
