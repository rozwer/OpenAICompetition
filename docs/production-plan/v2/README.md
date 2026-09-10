# 本番の28単位

[一覧](ISSUE_INDEX.md)から利用者の完成結果を選ぶ。各単位はUI・API・保存・再表示と固有の失敗例を同じ担当が実装する。

[共通受入](common-acceptance.md)と[レビュー前の条件](REVIEW_PREVENTION.md)を最初に確認する。[再発防止](RECURRENCE.md)は必要な条件を調べるときに使う。

計画の正本はTASK_GRAPH.json。28単位の依存、全181要件との対応、operation所有、固有受入、内部の旧作業内容を保持する。旧IDを取得単位として登録せず、過去の完了状態を引き継がない。将来拡張として分類された7件も全体の対象に含む。

当日は全件を未着手で開始する。[P-START](issues/P-START.md)で環境・台帳・共有契約を導入し、各Issueの着手依存に沿って進める。write_pathsは新規実装する配置であり、この資料内に実装ファイルがあるという意味ではない。

計画を変更したら、リポジトリルートで`python3 tools/check_specs.py --write`を実行し、続けて`python3 tools/check_specs.py`で生成結果を確認する。
