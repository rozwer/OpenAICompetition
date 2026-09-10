# 実装ルール

- README.mdから担当Issueを選び、そのread_setと固有受入を読む。要件の正本はdocs/requirements.csv、作業単位はdocs/production-plan/v2/TASK_GRAPH.json。
- UI・API・保存・再表示まで同じ担当が接続する。完了条件は担当Issueとdocs/production-plan/v2/common-acceptance.md。旧Task IDは内部の対応用であり、別の取得単位にしない。
- 機能同士を直接importしない。domainとcontractsをUI・HTTP・DB・AI実装から独立させ、依存は組立て箇所で注入する。具体的な登録形式はdocs/spec/ENTRY_CONTRACT.mdに従う。
- 共有DTO・Port・Schemaを変更する前に利用側と調整する。操作名と入出力の対応、原文、本人の訂正、権限、版を保持する。
- 未設定・未接続・fakeを成功として返さない。架空経路を歩行可能経路、未知の高さを観測値として示さない。API課金や外部アカウント、データ共有、生成コード実行を未接続の代用として有効化しない。
- 対象操作の保存・再表示と固有の反例を検証する。共有の反例は所有基盤で確認し、利用側は接続を確認する。変更・失敗・環境差がない検査を繰り返さない。
- レビューにはTask・PR・worktree・head・差分・コマンド・終了結果・証拠・未接続を揃える。詳細はdocs/production-plan/v2/REVIEW_PREVENTION.md。
