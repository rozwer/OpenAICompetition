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

| 文書 | 内容 |
|---|---|
| [実装仕様書](docs/spec/implementation.md) | 画面、各機能の処理、構成、既定案と未決事項 |
| [データとAPI](docs/spec/data-and-api.md) | 保存形式、API、権限、版管理、ジョブ |
| [受入条件と実装順序](docs/spec/acceptance-criteria.md) | 55の受入条件と段階別の完了条件 |

以下の詳細仕様書には将来の完成版の契約も含まれます。現在実行できるコマンドは起動手順を正本とします。

基礎要件、デモ、技術調査、大会資料は[ドキュメント一覧](docs/README.md)から参照できます。
[用語集](CONTEXT.md)はプロジェクト共通の定義としてルートに置きます。
旧設計、過去のレビュー、応募時の原文は[アーカイブ](docs/archive/README.md)に保管しています。

APIキーやデモ用アカウントの資格情報は、Git管理外の`.env`や`.local/`に保存します。
