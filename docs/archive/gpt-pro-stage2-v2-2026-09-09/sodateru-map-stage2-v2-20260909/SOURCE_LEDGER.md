# 出典・確認範囲

本改訂のAPI/DB/path割当/priorityは設計判断。既存要件と製品構想は入力ZIPとv1資料から保持した。下記V2-Sは2026-09-09に公式ページを確認した。続くS01等はv1の出典台帳を引継いだもので、今回全項目の再検証をしたという意味ではない。

| ID | 一次資料 | 使用範囲 |
|---|---|---|
| V2-S1 | https://nodejs.org/download/release/v22.22.1/docs/api/sqlite.html | Node22.22.1のnode:sqlite / DatabaseSync、Experimentalの留保 |
| V2-S2 | https://sqlite.org/lang_transaction.html / https://sqlite.org/foreignkeys.html | transaction単一writer、BEGIN IMMEDIATE、接続ごとのFK有効化 |
| V2-S3 | https://spec.openapis.org/oas/v3.1.1.html | 使用するOpenAPI形式。最新版との主張はしない |
| V2-S4 | https://git-scm.com/docs/git-push | 明示expected OIDのforce-with-leaseを使うCAS |

## v1から引継いだ台帳

# 入力・一次情報・持込み台帳

確認日：**2026-09-08**。本書の設計はユーザーの最新指示を優先する。外部情報は選定に影響する事項だけ確認した。仕様の提案・工数・操作例は本書で作成したもので、外部研究による実証値ではない。

## 1. 入力の優先順位

入力ZIP：`gpt-pro-stage2-competition-docs-2026-09-08.zip`  
SHA-256：`36eed7458c0e4b1b4bf56419dc1d8756be145c0f4e0141020746df154f46e234`

| 順位 | ZIP内の相対パス | 本書への反映 |
|---|---|---|
| 1 | `02_LATEST_USER_BRIEF.md`と今回のユーザー指示 | 5時間の機能幅、全構想、スタック変更可、堅牢化後順、理想改造の保持 |
| 2 | `00_START_HERE.md` / `01_PRO_PROMPT.md` | 読む順・指定10成果物・4人Issue・出力/自己点検 |
| 3 | `03_TEAM_STACK_AND_CURRENT_STATE.md` | 確定チーム環境と参考製品案の分離、既存状況は報告として扱う |
| 4 | `STAGE1_REVIEW.md` / `STAGE1_HANDOFF.md` | 差別化、設計問題、研究の取り込み方、過去制約の比較 |
| 5 | `reference/project/docs/requirements/reviewed-requirements.md` | **元145IDの正本**。原文要件と受入を全要件CSVへ保存 |
| 6 | `reference/project/docs/requirements/acceptance-mapping.md` | 旧A01–A55を全件保持し対応要件/Issueを追跡 |
| 7 | `reference/project/docs/requirements/{navigation,grow-map,grow-together,know-yourself,grow-app}.md` | 各価値と画面/操作の詳細を照合 |
| 8 | `screenshots/`の10画像、`reference/project/docs/requirements/references/`の3画像 | ミント/クリーム、丸み、Sheet、比較、人物と建物本体の方向 |
| 9 | `reference/project/docs/research/` / `reference/team-workspace/docs/` / `reference/project/CONTEXT.md` | 実装・研究・大会の背景。最新指示に反する固定条件は上書き |

旧archiveの`requirements.json`は137件であり、145件の正本としては使用しない。`READING_BUNDLE.md`は参照をまとめたものとして利用し、同じ文書の重複を別要件として数えない。画像の見た目から保存/API/実機動作が実装済みとは推定しない。

元ZIPの実コード・lock・地図GeoJSON・GLB・DB・API keyは本作業へ渡されていない。既存アプリのビルドや49件等の試験数は現在地文書の報告であり、本書による再検証結果ではない。入力画像や過去資料の原本は出力ZIPへ重複同梱していない。原要件/旧受入は追跡のためCSV内に保持した。

## 2. 一次情報

URLは出典を再確認するためのもので、このパッケージが当該サービスへ接続済みという意味ではない。番号S01–S13を仕様中で参照する。

### S01 — 大会公式ルール
`https://codex-student-hack-fes.openai.chatgpt.site/official-rules/`

確認：2026年9月15日の開催、開催中の実質的開発、重要な既存コード/OSS/データ等の開示、第一段階の5項目各20%、最終段階の4項目各25%、同点時のCodex活用→実世界への価値の優先。**5時間・空リポジトリ・3分ピッチ・本資料の事前持込み許可は、このページだけから確定しない。** チームの計画と主催者確認を別に記録する。

### S02 — Vite公式Guide
`https://vite.dev/guide/`

確認：Node20.19+または22.12+の基準、テンプレートに追加条件があり得る。22.22.1を出発点にする根拠。全依存の実installやpatch版の互換性を確認したものではない。

### S03 — Hono公式Node.js Guide
`https://hono.dev/docs/getting-started/nodejs`

確認：Node adapter、serve/静的ファイル配信の入口。Vite proxy、8787番、JSON Repoは今回の設計。特定ホストへのデプロイ成功を示すものではない。

### S04 — Codex SDK公式資料
`https://developers.openai.com/codex/sdk/`  
`https://learn.chatgpt.com/docs/codex-sdk`  
`https://raw.githubusercontent.com/openai/codex/main/sdk/typescript/README.md`

確認：Node向けSDK、CLIをJSONLで包む構成、thread.run、outputSchemaによる構造化結果、runStreamed、workingDirectoryとGitの扱い。採用実版の取消方法・認証成功・レート/費用・接続時間は未実測。専用workdirとZod再検査は本書の提案。

### S05 — Codex非対話実行公式資料
`https://developers.openai.com/codex/noninteractive/`  
`https://learn.chatgpt.com/docs/non-interactive-mode`

確認：execのJSON/出力schema、保存された正規ログインまたは適切なAPI認証を利用する経路、認証情報の扱い。利用者のサブスク枠を一般公開アプリへ無制限提供できる権利を確認したものではない。

### S06 — MapLibre公式Three.js custom layer例
`https://maplibre.org/maplibre-gl-js/docs/examples/add-a-3d-model-using-threejs/`  
`https://maplibre.org/maplibre-gl-js/docs/examples/display-buildings-in-3d/`

確認：参照した3D例にMapLibre6.8.0/Three0.169.0、共有WebGL custom layer、Mercator座標、render(gl,args)とmainMatrixの構成。初期候補にする根拠。Windows/Mac/iPhoneでの実動作を確認したわけではない。新旧signatureを混ぜず、初日に実版を固定する。

### S07 — OpenFreeMap公式
`https://openfreemap.org/`  
`https://openfreemap.org/quick_start/`

確認：公開instanceが登録/キー不要として案内されること、帰属、保証/SLAの制限、MapLibre接続の入口。将来の無償継続や会場の通信品質を保証しない。帰属を消さず、自作sample街区への明示切替を用意する。

### S08 — OpenStreetMap標準タイル利用方針
`https://operations.osmfoundation.org/policies/tiles/`

確認：標準タイルサービスのbulk取得/オフライン利用制約と帰属。OSMデータ自体のライセンスとサービス利用条件を同一視しない。この制約をすべての商用/自前tile providerへ一般化もしない。

### S09 — OpenUAS公開データ・公式repo
`https://zenodo.org/records/13141800`  
`https://github.com/UCLabNU/OpenUAS`

確認：8都市、50m/250m、補完フラグ、利用上の条件と商用利用時の確認事項。今回vectorはダウンロード・学習・アプリ統合していない。ベクトルが個人の性格/安全/騒音を測れるとは主張しない。

### S10 — openrouteservice公式技術資料
`https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/extra-info/`  
`https://giscience.github.io/openrouteservice-r/reference/ors_profile.html`  
`https://giscience.github.io/openrouteservice/technical-details/travel-speeds/`

確認：徒歩等のprofileと経路付加情報の入口。契約キー・利用枠・実リクエスト・実地の通行可否は未確認。自動車向けprofileを実際の全二輪規制対応と扱わない。Dayは取得可否とsourceを分けて表示する。

### S11 — 駅すぱあとWebサービス 定期控除
`https://docs.ekispert.com/v1/dictionary/teiki-deduction/`

確認：定期控除のパラメータ/考え方と鉄道に関する適用上の注意。バス等へそのまま一般化しない。契約/キー/実運賃照合は未実施。不明な追加運賃を0円で埋めない。

### S12 — W3C Geolocation仕様
`https://www.w3.org/TR/geolocation/`

確認：SecureContext、利用者の許可、許可拒否/位置取得失敗/timeout等の扱い。端末背景取得、OS別省電力、実GPS精度は別の実機実証を要する。PCのmobile幅表示をiPhone実証と呼ばない。

### S13 — GitHub CLI公式manual
`https://cli.github.com/manual/gh_issue_create`  
`https://cli.github.com/manual/gh_issue_list`

確認：Issueのlist/create、body-file、assignee/labelの入口。付属登録スクリプトはローカルdry-runを検査し、接続repoへの実投稿は行わない。repo権限/ラベル/assigneeの適格性は利用者が明示実行した時に確認する。

## 3. 持込み・権利を一括許可にしない

| 対象 | この計画での扱い | 当日の判定/持込不可時 |
|---|---|---|
| 本仕様/Issue/契約JSON | 事前設計資料。持込み可否の確認対象 | 主催者へ申告。不可なら持ち込まず、許容された範囲で当日作る |
| 既存アプリのsource | 主計画では不使用 | 許可が出て実物が起動する場合だけ短縮分岐 |
| 付属の合成fixture | 実装支援の入力例。過去アプリのデータではない | 持込み許可を確認。不可なら取得者が同じschemaで当日生成 |
| スクリーンショット | デザイン参照。素材としての再配布はしない | 権利/持込み条件を確認し、独自CSS/meshへ置換 |
| MapLibre/Three/Hono等OSS | 実取得版とlicenseを記録 | 大きな依存は開示。ライセンス文/帰属を残す |
| 地図/経路/交通/OpenUAS | providerごとに権利・利用範囲が異なる | API認証/利用条件未確認なら未接続。合成を実情報と偽らない |
| Codexログイン/開発環境 | 本人の正規環境の準備 | 主催者の準備範囲を確認。資格情報を他人へ配布しない |
| 写真/作品/聖地巡礼情報 | 自作/許諾素材、公式とfan情報を分ける | 未許諾の作品画像を同梱せず、文字/本人写真で実証 |

実装時に`THIRD_PARTY.md`へ名前、実版、用途、URL、license、改変、帰属先、持込み申告を記入する。公開条件や規約解釈を法的助言と断定しない。

## 4. 本改訂の検証

v2で実行した検査と未検証範囲はVALIDATION_REPORT.mdを参照。旧担当・時系列の検査結果は本版の根拠にしない。
