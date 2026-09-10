# 第2段階：技術スタックを含む仕様書の作成

このZIPは「育てる地図」の仕様作成用です。GPT Proの新しい第2チャットへ、このZIPと、第1チャットで完成させたSTAGE1_HANDOFF.mdを添付してください。

「00_START_HERE.mdを読み、添付のSTAGE1_HANDOFF.mdを踏まえて02_PROMPT_SPEC.mdの依頼を実行してください」と送ってください。依頼文の全文を貼り付けても構いません。

第1チャットの履歴は自動で伝わりません。STAGE1_HANDOFF.mdは第1段階の成果物なので、このZIPにはまだ入っていません。必ず追加添付してください。引継ぎが欠けている場合、レビュー結果を推測で補わずユーザーへ依頼してください。

## 収録資料と読む順序

- `03_CONTEXT_AND_DECISIONS.md`：目的、既存判断、資料の優先順位、具体例、未決事項。
- `project/docs/requirements/`：最新の4タブ要件の全文と参考画像。利用体験の正本。
- `project/CONTEXT.md`：用語。
- `04_MAPBOX_CURRENT_STATE.md`、`MAPBOX_SETTINGS.json`：現行Mapbox GL JS設定と実装範囲。
- `screenshots/current-nagoya.png`：現在の試作画面。
- `project/docs/spec/`：基礎要件、既存の設計案、データ/API、受入条件。
- `project/docs/demo/`、`competition/`、`research/`、`archive/`：実演案、日付付き調査、検討履歴。
- `project/prototypes/mapbox-character/`：ソース、依存版、lockfile、人物モデルとBlender素材、検証スクリプト、出典。
- `05_VALIDATION.md`、`SNAPSHOT.json`、`PACKAGE_CHECKS.json`：確認内容、採取時点、梱包検証。

各ZIPで単独に元資料を参照できるよう、共通の要件・技術資料・コード・素材は両方に収録しています。各段階の依頼文と読解バンドルは、その段階のものだけを収録しています。

ZIPを読めない環境では、`READING_BUNDLE_STAGE2.md`と`02_PROMPT_SPEC.md`を添付し、必要に応じて参考画像3枚と画面画像を個別に添付してください。第2段階は別途STAGE1_HANDOFF.mdも必要です。

## 資料の境界

2026-09-08の作業ファイルのスナップショットで、未コミット変更も含みます。秘密値・実際の.env・依存実体・ビルド成果物・地図タイルは含みません。既存資料にある大会ルール、外部サービスの提供内容・料金等は今回再調査していません。現在動くのは地図表示試作で、本体機能の実装完了を意味しません。

MANIFEST.sha256は自身を除く収録ファイルのSHA-256です。ZIPの外側にもZIP全体の.sha256を付けています。
