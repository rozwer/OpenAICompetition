# 育てる地図

場所で何をし、何を得て、なぜ選んだかを記録し、その理解を自分の地図、他者との比較、別の街での行動へ使うアプリを実装する。

## 環境を用意する

```sh
mise trust
mise install
mise exec -- bun install --frozen-lockfile
mise run hooks:bootstrap
mise run hooks:install
mise run check
```

各自の環境変数またはGit管理外の`.env`へ`CODEX_OWNER`を設定する。Git/Codex hooksの登録と共同作業の開始は[作業環境](docs/team/tooling.md)に従う。

## 実装を始める

1. [画面と利用体験](docs/spec/PRODUCT_AND_UX.md)と[画面見本・操作対応](docs/ui/README.md)で、操作と保存結果を確認する。
2. [本番計画](docs/implementation-issues/README.md)から担当する単位を選び、その受入条件とread_setを読む。
3. [開始と進め方](docs/spec/TASK_EXECUTION.md)に従い、001で環境・契約・共同作業の動作を確認する。

## 仕様の参照先

- [181要件](docs/requirements.csv)：利用者の価値と受入条件。
- [26件の実装Issue](docs/implementation-issues/README.md)：担当範囲・依存・固有の合否。
- [契約入口](docs/spec/CONTRACTS_V2.md)：DTO・Port・HTTP・DB。
- [文書一覧](docs/README.md)：必要な詳細仕様を選ぶ。

全件を未着手として開始し、実装した操作・保存・再表示で完了を判定する。画面見本や型定義の存在を製品の完成と数えない。

## 仕様・計画の更新

`mise run specs:check`で要件対応・依存・契約参照・画面素材・DB定義を確認する。
計画JSONを変更した場合は`mise run specs:generate`で担当文書を再生成してから確認する。
アプリの起動・検査コマンドは001で導入する環境に合わせて定義する。
