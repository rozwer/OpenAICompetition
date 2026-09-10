# 共有契約変更の最小手順

新しいfieldが本当に必要かを先に確認する。既存DTOで表せる機能追加はfeature内で完結し、schema編集を要求しない。契約不足なら、変更Issueに利用側、意味、null/default、既存データ移行、受入例を書く。

契約変更のclaimには `contracts/`、`db/schema.sql`、`db/dto-map.json`、`docs/spec/API_ENDPOINTS.csv`、`docs/spec/DB_COLUMNS.csv` のうち実際に変更するpathと生成物をまとめる。API/DB変更時は生成器 `tools/build_contracts.py` / `tools/build_db.py` も対象。単一担当への恒久所有ではなく、差分ごとの排他である。進行中featureの互換性を維持する追加を優先し、requiredの追加やrenameはmigrationを伴うbreaking変更にする。

`TASK_GRAPH.json`に契約修正taskを追加する場合、実行boardに格納されたgraphも同じ内容へ更新する。tools/sync_graph.pyで事前確認し、mainへ取り込んだ同じgraphを--applyでCAS反映する。作業中・提出済み・完了済みtaskの定義変更は拒否される。対象作業を停止・引継ぎしてreleaseするか、後続taskとして追加する。具体的な手順はdocs/team/graph-update.mdを参照する。board再init、stateの破棄、mainのforce-pushは禁止。

生成順は `python tools/build_contracts.py` → `python tools/build_db.py` → `python tools/generate_types.py`。operation追加時は実装task対応を `docs/spec/API_ENDPOINTS.csv` に反映する。DTO schema・FK・example・受入を同時に更新する。機能実装を待たせないためoptional追加またはversion追加で旧契約を一時併存させ、既存taskが読む版を固定する。

重大な仕様変更がない限り全員一斉更新を要求しない。端点のDTOは小さいPRで共有し、コード接続は関連INT taskで確認する。

## v2.1の生成物

操作の追加時はcontracts/operations.tsもgenerate_types.pyで再生成する。質問や経路の変更はdocs/spec/QUESTION_FLOW.md/ROUTE_CONSTRAINT_FLOW.mdと例も同期する。task変更後はtools/build_task_docs.pyでIssue/CSVを更新する。検査実行順はtools/README.mdのv2.1節に従う。既に共有boardがある場合の移行は別途、状態を保持して調整し、initで上書きしない。

## v2.2追加契約

共通生成器はtools/companion_health_contracts.pyを呼んで追加DTO/APIを登録する。ここを修正したらbuild_contracts.py→build_db.py→generate_types.py→build_examples.py→build_v21_examples.py→build_task_docs.pyを実行する。health/petの意味上の反例はtools/test_companion_health_contracts.pyとexamples/companion-health-acceptance.jsonを更新する。

FULL_REQUIREMENT_MATRIXの元157要件と既存API/DB列を削除せず、追加要件を追記する。契約の数だけを固定する検査で機能追加を妨げず、安定IDの保持と重複・参照の整合を確認する。既存DBへ適用するDDL差分はdb/migrations/003_companion_health.sql。

## 2026-09-09 v2.3：もやもや候補から街が広がる

ユーザー合意によりEXP-REQ-001〜007、EXP-001〜004/INT-022を追加。PREP-006の追加pathをclaimして変更した。
旧174要件を残し、ExplorationCandidate/Preferences、6 API、2表、ExplorationPort/LayerPortと任意MapDependencies.explorationを追加する。
Visit候補やMeaningの正本は置換せず、候補の関心と本人の訪問・記録を分離する。UI受領原本12点と対応表をdocs/uiへ追加した。
既存MapDependenciesの構築コードは追加propertyなしで成立する。INT-022で初めて配線・失効・既存記録/経路との通し検証を行う。実装完了をこの仕様変更から推論しない。
