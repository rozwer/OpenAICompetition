# 補助ツール

`taskctl.py` は標準PythonとGitだけを使用する。自分のrepoのcloneから実行する。Gitの認証設定は通常の方法で行い、tokenをIssueやJSONへ書かない。

```bash
python tools/taskctl.py init --manifest TASK_GRAPH.json
python tools/taskctl.py ready
python tools/taskctl.py claim MAP-002 --actor person3-agentA
```

返却token/base_commitと専用worktreeの扱い、handoff/recover、mainへの通常mergeはTASK_EXECUTION.mdに従う。共有boardのbranchはcoord/task-board。taskctlは人間の合意を代替する認証機構ではない。

## 検査と生成

```bash
python -m pip install -r tools/requirements.txt
python tools/validate_contracts.py
python tools/test_taskctl.py
node tools/test_mutation.mjs
tsc --noEmit --strict --target es2022 --module esnext --moduleResolution bundler contracts/domain.ts contracts/ports.ts
```

Git検査はtempのbare repoと4cloneを使い、実repoへ書き込まない。DB検査はメモリDBの参考transactionであり、アプリの実装・HTTPを検査しない。node:sqliteの版別制約は公式資料に従う。

schema変更時のみ `build_contracts.py` → `build_db.py` → `generate_types.py` → `build_examples.py` の順で再生成する。schemaの正本変更は生成器にも反映する。再生成が既存schemaを上書きするため、必ずCONTRACT_CHANGE.mdのpath claimを取る。task graph/Issue本文は自動再生成されず、変更に合わせて更新する。

## Issue登録

```bash
# 既定は表示だけ。4人のassigneeを付けない。
python tools/import_issues.py --repo OWNER/REPO
# 明示実行のみ実repoへ作成。必要なIDを限定できる。
python tools/import_issues.py --repo OWNER/REPO --only MAP-002 POOL-001 --apply
```

同名タイトルの既存Issue/直前実行のreceiptはスキップする。大規模repoの既存Issue取得は最大1000件であり、全履歴の重複保証ではない。assigneeやGitHubラベルをロック正本にしない。今回このscriptの--applyは実行していない。

## 同梱の例
`examples/http`は89操作の形式例、`record-flow.json`は同じIDでの作成・訂正、`seed-core.json`はSQLへ投入できる最小DTOセット、`dsl-time-budget.json`は有限演算の可変入力受入例。サンプルの店舗・人物・場所を現実のデータとして利用しない。

## v2.1で追加した検査

再生成はbuild_contracts.py → build_db.py → generate_types.py → build_examples.py → build_v21_examples.py → build_task_docs.py。

その後、Node 22.22.1で `node tools/test_questions.mjs` を実行する。これはexamples/question-flow.jsonと回答APIの同じIDを使う例も出力する。続いてvalidate_contracts.py、test_mutation.mjs、test_taskctl.pyを実行する。

`python tools/test_typescript.py --tsc <tsc executable>` はTypeScriptと@types/nodeが利用できる環境で、誤ったAPI呼出しの型エラー、登録例、道中制約の反例を検査する。一時出力はCommonJSとして実行し、周囲のアプリのtype=moduleには依存しない。アプリのビルドや実AI接続の成功とは別に報告する。
