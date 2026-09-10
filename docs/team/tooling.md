# 作業環境

## 導入

miseが使える端末で、この順に実行する。Python 3.14.3、Node 22.22.1、Bun 1.3.14、GitHub CLI 2.97.0、Lefthook 2.1.12をmise.tomlで固定する。

```sh
mise trust
mise install
mise exec -- bun install --frozen-lockfile
mise run hooks:bootstrap
mise run hooks:install
mise run check
mise run specs:check
```

`hooks:bootstrap`はclone共有configでworktree設定を有効にする初回操作。`hooks:install`は現在のworktreeだけへGit hooksを設定する。既存の無関係なhooks設定は上書きしない。
Codex側でもプロジェクトと変更されたhooksの信頼を確認する。コマンド単体の合格を、Codexアプリ内の実発火の確認と混同しない。

React・Vite・Hono・MapLibre・Three・Codex SDK等の採用済み依存もpackage.jsonとbun.lockで固定する。製品の処理コードは当日の担当Issueで実装する。

`CODEX_OWNER`は`rozwer`・`mattsun`・`koshiro`・`kaiya`の自分の値を環境変数または主worktreeの`.env`へ設定する。秘密値や本人の設定をGitへ追加しない。

## 計画と台帳

本番計画は`docs/production-plan/v2/TASK_GRAPH.json`だけを読む。ルートへ写しを作らない。担当文書は`mise run specs:generate`で更新する。

実装用のリポジトリをoriginへ共有した後、台帳の初期化を一度だけ行う。

```sh
mise run task:init
mise run task:ready
```

initは既存の台帳を上書きしない。Git hooksは台帳のない状態での実装commitを拒否するため、最初の仕様コミット・originへの共有を済ませてからhooksを導入し、台帳を初期化する。台帳のGit refは`refs/tags/codex-task-board`。

GitHub Issue番号を登録したtask_policyがある場合はIssueの担当とCODEX_OWNERを照合し、developへ統合する。未登録時はTask IDと`task/Task-ID`形式を使う。後からIssue連携を導入するときは既存のclaim・token・完了記録を保ったまま移行する。以前のリハーサルのIssue番号を転用しない。

## 取得から終了

```sh
mise run task:worktree P-RUNTIME ../runtime-worktree
mise run task:verify
mise run task:submit --help
mise run task:finish --help
```

取得時に既知の編集pathをまとめる。成功時のreceiptには担当・Task・token・baseが保存される。新worktreeはmise trustとhooks導入を経て検査する。各コマンドの引数は`--help`で確認する。
通常のcommit・push・PRを経て統合先に到達したcommitだけをfinishする。統合前、他担当、異なるtoken、範囲外の変更を成功として扱わない。

終了に失敗した旧worktreeは、現在の主checkoutのhelperへ対象worktreeと保存receiptを渡して復旧する。時刻だけでlockを削除しない。遠隔処理は同じprocessの終了結果を確認する。

## 検査範囲

`mise run check`はGit/Codex hooks、二つの隔離cloneでの競合拒否・提出・終了、設定とTask IDを確認する。テストのremoteは一時的なローカルbare repositoryであり、実GitHubのIssueや台帳は変更しない。
`mise run specs:check`は仕様と計画、`mise exec -- bun run check:contracts`は共有型を確認する。アプリのbuild・実provider・Windows実機・Codexの信頼登録はそれぞれの実環境で確認する。
