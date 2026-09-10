# 育てる地図

記録と対話から場所の用途や選ぶ理由を残し、友人との比較、別の街への体験の移し替え、Codexによる機能追加につなげるプロジェクトです。

Windowsで動く最初の実装版です。3D地図・架空散歩再生・文字対話・記憶の訂正・デモ利用者間の友人申請を実装しています。全7機能の完成版ではありません。
最新の合意と未実装範囲は[実装状況](docs/spec/implementation-status.md)、実行方法は[起動手順](docs/setup.md)、4人での分担は[再現開発手順](docs/team/reproduce.md)を参照してください。

```sh
pnpm install --frozen-lockfile
pnpm exec codex login
pnpm dev
```

ブラウザで `http://127.0.0.1:3000` を開きます。Node.js 24以上を使います。

## 実装の入口

次回本番の新規実装は[28単位の実装計画](docs/production-plan/v2/README.md)を使います。
着手前に[レビュー差し戻しを防ぐ条件](docs/production-plan/v2/REVIEW_PREVENTION.md)と[共通受入](docs/production-plan/v2/common-acceptance.md)を読み、担当Issueに生成された固有条件を確認します。
下記の実装仕様にも今回の条件を反映しています。現在のアプリの起動方法と動作状況は上記の手順を参照してください。

| 文書 | 内容 |
|---|---|
| [実装仕様書](docs/spec/implementation.md) | 画面、各機能の処理、構成、既定案と未決事項 |
| [データとAPI](docs/spec/data-and-api.md) | 保存形式、API、権限、版管理、ジョブ |
| [受入条件と実装順序](docs/spec/acceptance-criteria.md) | 55の受入条件と段階別の完了条件 |

以下の詳細仕様書には将来の完成版の契約も含まれます。現在実行できるコマンドは起動手順を正本とします。

基礎要件、デモ、技術調査、大会資料は[ドキュメント一覧](docs/README.md)から参照できます。
[用語集](CONTEXT.md)はプロジェクト共通の定義としてルートに置きます。
旧設計・過去の配布物はGit履歴で管理します。作業ツリーへアーカイブやバックアップのコピーを追加しません。

APIキーやデモ用アカウントの資格情報は、Git管理外の`.env`や`.local/`に保存します。
