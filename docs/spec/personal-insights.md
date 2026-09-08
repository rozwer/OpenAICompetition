# 自分と街との関係 — MVP（2026-09-08）

## 1. 既存構成の解釈

MapLibreの共通地図、Reactのルート状態、Next.js Route Handler、SQLite、A/Bの署名付きセッション、ローカルCodex app-serverを維持した。GPSはRecordingが端末から取得し既存recordsへ保存する。従来の診断APIは互換用に残し、利用者が開くプロフィール画面は新しい「自分と街との関係」へ接続した。初期目的は性格の断定ではなく、確認した訪問と街との関係を可視化すること。

## 2. 追加ファイル

- `src/contracts/personal-insights.ts`: Visit/Context/Relation、AI JSON Schema、集計・画面の契約。
- `src/domain/personal-activity.ts`: 滞在候補検出、関係集計、30日比較集計、プロンプト、出力検証。
- `src/infrastructure/personal-store.ts`: SQLite保存。
- `src/server/personal-insights.ts`: 保存・確認・解析の組立て。
- `src/app/api/personal/route.ts`、`src/client/personal.ts`: HTTPとクライアント。
- `src/features/personal/PersonalInsights.tsx`、`InsightSections.tsx`、`PlaceRelationshipSheet.tsx`: モバイル画面。
- `tests/personal-insights.test.ts`、`tests/personal-live.test.ts`、`tests/e2e/personal.spec.ts`: 集計・分離・AI実接続・画面検証。

## 3. 変更ファイル

`src/app/page.tsx`（機能間の組立て・利用者別状態）、`src/app/globals.css`、`src/features/map/MapCanvas.tsx`、`src/features/map/poi-layer.ts`、`src/features/places/PlacesPanel.tsx`（詳細カードの挿入枠）、`src/features/extensions/Extensions.tsx`（入口の名称）、`src/infrastructure/codex.ts`（構造化解析メソッド）、`src/server/services.ts`、既存E2Eと実装状況文書。

## 4. Place × Context × UserRelation

SQLiteの`personal_records(actor,kind,id,payload)`に格納する。kindはplace、visit、candidate、dismissed、favorite、relation、insight。既存のDBと同居し、専用テーブルで混在を避ける。各kindのpayloadは契約のTypeScript型で表す。

- place: 元POIのスナップショット。source/categoryPath/brandIdを維持。
- visit: userId/placeId、開始・終了、滞在分数（不明はnull）、source、Context。手動記録または本人が確認したGPS候補のみ。
- Context: 日本時間の平日/週末と時間帯、同行者（未記録/一人/一緒）、天気（未取得はunknown）。UIは直前の滞在時間・同行者の記録に対応。
- relation: 訪問数、合計滞在、時間不明件数、初回・最近の日時、お気に入り。表示数値はLLMから受け取らず訪問から再計算。

GPSの5分以上・30m以内・精度30m以内・点間120秒以内の滞在について、40m以内に十分区別できる候補POIがある場合に候補を作る。密集して区別できない地点、精度不明、架空再生は対象外。本人確認前は集計に含めない。候補IDと訪問IDで重複確認・再送を抑える。インポートGPSも精度が不明なら候補にならない。

## 5. LLMへ送る情報

日本時間の日境界で最近30日とその前30日を分ける。訪問回数、既知の滞在時間、不明時間件数、カテゴリ別・ブランドID別回数、平日/週末、時間帯、同行者、再訪率、新規場所数、3時間以内のカテゴリ間遷移回数。場所別は訪問数上位40件のID・名称・カテゴリ・ブランド・回数・滞在・お気に入り・根拠ID。

生GPS、緯度経度、正確な個別訪問時刻、会話原文は送らない。場所名・OSM IDは送るため、匿名化された集計という意味ではない。画面で送信内容を説明した更新ボタンから呼ぶ。

## 6. LLM Schema

`personalInsightSchema` はstrictなZod Schema。JSON Schemaへ変換してCodexのoutputSchemaに渡す。summary、最大4 personaCards、最大6 patterns、最大6 changes、6軸以内のpreferenceScores、最大40 placeRelationships。全プロパティはrequired、未判定はnullまたは空配列。解釈にはconfidence（0〜1）と実在するevidenceIdsを付ける。scoreは0〜100またはnull。未知の根拠・場所、重複軸、根拠のない数値を拒否する。

前期間が0件の場合は変化とtrendを表示しない。店舗名から静けさや目的を断定せず、ブランド不明を個人経営とみなさないよう指示する。文章の正しさを完全に保証する仕組みではなく、推測として表示する。

## 7. Insight保存

明示更新のみ。GPS更新・画面閲覧はAIを呼ばない。集計のSHA-256が同じならキャッシュを返す。利用者ごとの同時実行を一本化し、全体2件・試行間隔30秒。解析中に集計が変わった結果は保存しない。成功ごとにUUID・生成日時・対象期間・fingerprint・JSON resultを追記し、過去の結果を保持する。失敗しても前の結果・訪問を消さず、入力内容を含めないエラーを表示する。

## 8〜10. 表示

- Persona: 横スワイプできる複数の行動モード。特徴タグ・確信度・根拠を表示。
- Pattern: 展開可能な一覧。「AIの解釈」と確信度を明示。
- Place Relationship: POIの一般情報より上に本人との関係を表示。訪問数・滞在は確認済みの記録、説明とタグはAIの解釈として分離。お気に入り・訪問記録もここで操作。

## 11. Personal Map Layer

既存semantic-poisのGeoJSONに関係のプロパティを注入し、personal-place-haloレイヤーで縁取りする。お気に入りはピンク、合計120分以上の記録は紫、3回以上の訪問は緑で大きく、訪問済みは青緑。低ズームのクラスタリングと既存アイコンは共用する。未訪問の場所に関係を捏造しない。地図凡例を表示し、同じPOIは一度だけ描画。現在の上限は800地点。

## 12. 今回の範囲と未実装

Priority 1〜5を実装。Priority 6のうち過去InsightのTimelineとPersonal Compassは基本表示を追加した。Area Affinityの地域境界・濃淡・スコア、Discovery Gap、月別レポートの自動生成、定期解析は未実装。過去日付を指定する手動訪問UIや編集/削除、天気取得も未実装。候補の推定はPOI登録状況・位置精度に依存し、自動入店判定ではない。滞在を確認した後に同じGPS候補が伸びても、確認済み時間を自動延長しない。

既存A/Bデモの本人別保存を利用している。利用者を自由に切り替えられるデモ認証は、多人数向けの本人認証ではない。実運用にはアカウント認証・権限管理・データ削除/保持設定が必要。

## 13. 次の実装

実地で滞在候補を検証し、地域境界とArea Affinity、探索不足のカテゴリ表示、訪問の編集・削除へ進める。推薦ルートへ使う場合も、観測値とAI解釈を分けたこの契約を利用する。

## 確認手順

地図 → 周辺の場所 → 場所を選択 → 訪問を記録/お気に入り → プロフィール → 最近の行動をAIで読み解く。AIには利用者がログイン済みのローカルCodexを使用。実接続テストは `PERSONAL_LIVE=1 pnpm exec vitest run tests/personal-live.test.ts`（検証用の架空集計のみ、アプリDBへ保存しない）。

場所別に平日/週末 × 時間帯 × 同行者 × 天気の件数も集計し、全体の比率だけから文脈を取り違えないようにした。検証: pnpm check（41件）、pnpm build、E2E16件、Codex実接続1件成功。
