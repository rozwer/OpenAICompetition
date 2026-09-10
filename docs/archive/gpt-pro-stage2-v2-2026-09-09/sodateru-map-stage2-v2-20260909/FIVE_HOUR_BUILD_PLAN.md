# 実装手順の参照先

ファイル名は旧版リンクとの互換のため残した。**時間割は設けない。** 正本は [TASK_EXECUTION.md](TASK_EXECUTION.md) と [TASK_GRAPH.json](TASK_GRAPH.json)。全taskは未割当で、依存成立とpathロックの解放により取得する。

旧 `TEAM_TIMELINE.csv` は廃止。代わりに `ISSUE_BACKLOG.csv`、実行時の `taskctl.py ready`、独立した `POOL_TASKS.csv` を使う。各人の作業量を均等配分する制約や、特定時刻での一斉合流はない。
