# 共有契約変更の最小手順

新しいfieldが本当に必要かを先に確認する。既存DTOで表せる機能追加はfeature内で完結し、schema編集を要求しない。契約不足なら、変更Issueに利用側、意味、null/default、既存データ移行、受入例を書く。

契約変更のclaimには `contracts/`、`db/schema.sql`、`db/dto-map.json`、`API_ENDPOINTS.csv`、`DB_COLUMNS.csv` のうち実際に変更するpathと生成物をまとめる。API/DB変更時は生成器 `tools/build_contracts.py` / `tools/build_db.py` も対象。単一担当への恒久所有ではなく、差分ごとの排他である。進行中featureの互換性を維持する追加を優先し、requiredの追加やrenameはmigrationを伴うbreaking変更にする。

`TASK_GRAPH.json`に契約修正taskを追加する場合、実行boardに格納されたgraphも同じ内容へ更新する。現helperは運用途中のgraph編集を自動化しない。受付1人がboardを最新OIDから読んでclaim状態を保存したままCAS更新し、影響taskへ通知する。board再init、stateの破棄、mainのforce-pushは禁止。

生成順は `python tools/build_contracts.py` → `python tools/build_db.py` → `python tools/generate_types.py`。operation追加時は実装task対応を `API_ENDPOINTS.csv` に反映する。DTO schema・FK・example・受入を同時に更新する。機能実装を待たせないためoptional追加またはversion追加で旧契約を一時併存させ、既存taskが読む版を固定する。

重大な仕様変更がない限り全員一斉更新を要求しない。端点のDTOは小さいPRで共有し、コード接続は関連INT taskで確認する。
