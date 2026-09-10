# 実装で読む文書

## 利用体験と要件

[4タブの要件](requirements/README.md)で操作と保存結果を確認し、[ID付き要件・受入条件](requirements/reviewed-requirements.md)で対象を特定する。共通用語は[CONTEXT.md](../CONTEXT.md)を使う。

## 次回の新規実装

現在存在する開始資料は[Stage2 v2.1](../deliverables/sodateru-map-stage2-v2.1-20260909/START_HERE.md)。[リハーサル方針](team/competition-rehearsal.md)と併せて読む。

**参照先の欠落**：文書に記載された `docs/production-plan/v2/` の28単位計画・共通受入・再発防止条件は、この作業ツリーに存在しない。Stage2 v2.1にはそれらを反映済みとは扱わず、28単位計画に基づく作業は資料を復元してから開始する。古い担当分担で代用しない。

## 既存アプリの変更

[起動手順](setup.md)、[実装状況](spec/implementation-status.md)と変更対象のコードを確認する。実装状況は既存アプリの経緯であり、次回の製品要件を上書きしない。

詳細設計は[実装仕様](spec/implementation.md)、[データとAPI](spec/data-and-api.md)、[受入条件](spec/acceptance-criteria.md)を参照する。これらには新しい要件の未反映部分があるため、対象要件との対応を確認する。

## 必要なときだけ読む資料

- [デモシナリオ](demo/reviewed-scenarios.md)：レビュー後の実演案。
- [大会ルール](competition/rules-2026-09-05.md)：確認日時点の条件と未確認事項。
- `research/`：調査時点の根拠や検討案。採用決定・現在の実測値とは区別する。
- [地図・人物の試作](../prototypes/mapbox-character/README.md)：試作の起動と表示確認。

## 文書の管理

現行文書は固定パスで更新し、旧版・レビュー原本・配布ZIP・プロジェクトのコピーはGit履歴で管理する。作業ツリーにアーカイブやバックアップを作らない。配布用コピーを実装仕様の別正本にしない。

削除前の資料はコミット `5abdf93` に保存済み。必要な場合は `git show 5abdf93:<リポジトリ相対パス>` で確認できる。
