# 理想構想と次に取得するタスク

P2/P3も未割当。下表の依存は共有契約を読むだけでなく、実証に本当に必要なmoduleを列挙した。隔離設計/調査はその前から可能だが、taskをdoneにするための実証は依存成立後に行う。外部情報/API/学習効果は未検証を明示し、採用しなかった案も消さない。

| Task | 構想 | hard依存 | 具体的な実現経路 |
|---|---|---|---|
| FUT01 | 認証・本物の友人共有・取消の全派生反映 | SOC-002, AI-002 | OIDCまたはprovider認証→actorをsessionへ→recipient別投影→grant revision→検索/会話/画像URL/生成中結果まで依存失効→2アカウントで取消を確認。 |
| FUT02 | 配備向け永続化・データ移行・非公開デプロイ | FND-002, PREF-001 | ローカルSQLiteは既に正本。本人export→検証→配備先へのmigration→秘密値/AI workerをserverへ分離→非公開preview→backup/restoreを実証。コード移行とデータ移行を別承認。 |
| FUT03 | 実機・背景位置・許可されたオフライン地図 | MAP-001, REC-007 | 前景GPSを実機HTTPSで確認→Capacitor等native bridgeまたはMapLibre Native選定→OS権限と背景life cycle→オンデバイス記録queue→許可済みtile bundle→復帰同期。 |
| FUT04 | 立体フロア・ランドマーク・造形の理想版 | MAP-001, MAP-002, MAP-004 | PLATEAU等の権利/座標/LOD確認→建物外殻/入口/階接続を別データ→手動階確認→GLBは少数→混合用途の実体形状→記録/物理モデル分離を維持。 |
| FUT05 | 実乗換・定期控除・リアルタイム寄り道 | RTE-003, RTE-005 | 駅すぱあと等の契約/料金/対応交通を確認→provider courseを保持→鉄道定期区間控除→バス等は別対応確認→最終到着時刻/運休/再検索→fixtureと区別。 |
| FUT06 | OpenUASを体験移植の候補取得へ導入 | TRF-002, DATA-001 | 東京/名古屋の必要meshだけ読込→anchor/model/time/versionを照合→compatible空間のみcosine top-k→広域候補→POI検索→feasibility検証→属性のみbaselineと候補差比較。 |
| FUT07 | 小標本選好学習・将来予測・比較実験 | SELF-002, SOC-008 | 候補提示/選択/制約/結果をログ→階層Bayesまたは正則化pairwise model→contextを少数に→time splitの将来選択予測→単純頻度/申告のみ/理由なしと比較。 |
| FUT08 | 写真からの発見・能動提案・関心変化学習 | DISC-001, MEDIA-001, AI-005 | 画像特徴を本人確認→一般知識の出典検索→anchor bridgeを検証→known graph更新→receptive&&available&&optinの時だけ一枚→週後の自主学習/関心を評価。 |
| FUT09 | 新規コードプラグイン・隔離ランタイム | EXT-001, EXT-002 | DSLで不可能な新関数をDevelopmentRequest→Codexが専用worktreeでTS生成→別に保持したtestで検証→artifact build/hash→networkなしの隔離process/container等で実行→JSON入出力のみhost反映。 |
| FUT10 | 画面・データ・処理の組替えStudio | EXT-003, EXT-004 | screen schema/typed field binding/action DAG→既存機能を再配置→入力型と循環を検査→sample preview→definition版を保存→slotだけ差替→旧版戻し。 |
| FUT11 | 利用者自身のAIへ開発契約を渡すローカルbridge | DEV-001 | DevelopmentRequestをexport→PC上のloopback bridgeでhuman approval→repo allowlist/worktree作成→自身のCodex認証でtask実行→progress/preview URLを返す→承認後artifact取得。 |
| FUT12 | 本体UI/機能の改造・preview・データ保持rollback | FUT11, FND-002 | 許可pathsを限定した別worktreeでUI/処理を生成→schema変更計画→SQLite複製でpreview→旧データ互換を確認→本人承認→artifact切替。code rollbackとdata restoreを分離。deployや汎用plugin完成を待たずローカルで実証。 |
| FUT13 | HTML/PDFを含む5形式と意味変化の修復 | DATA-001, DATA-002 | API/CSV/GeoJSONにHTMLとPDFを追加→許可URL/単位/時刻/source version→schema drift/semantic driftを分離→parser提案と3行diff→回帰fixture→承認適用→previous parser復帰。 |
| FUT14 | 防災の実データ統合・不確実性・案内保留 | EXT-005, RTE-002, DATA-001 | 自治体/JMA等の許可データadapter→地震/浸水/通行止めの用途別時刻→安全制約→GPS不確実時はランドマーク確認→Recommend/Warn/Abstain→人命判断を自動断定しない。 |
| FUT15 | バイクの車種/排気量/時間規制を実データ化 | EXT-006, RTE-002, DATA-001 | 対応providerと道路規制source確認→車種/排気量/時間/二人乗り等の制約モデル→通行可否unknownを区別→禁止edge回避→規制変更の再検索。 |
| FUT16 | 聖地巡礼の出典・許諾・時間順の体験 | EXT-007, DATA-001 | official/fan/communityの出典を分離→作品/scene/場所の対応証拠→公開可素材だけ→私有地/混雑配慮→順序/営業時間/移動時間検証→本人の写真/感想。 |
| FUT17 | 公開API/第三者が追加する機能テンプレート | EXT-002, FUT09 | schema/SDK/examplesを別packageへ→GitHub Issueテンプレ/サンプル→第三者が未打合せで1拡張を作る→install→互換版/権利/manifest審査。 |
| FUT18 | 本番権限・攻撃耐性・監視・省電力 | FUT01, FUT02 | 境界ごとの脅威モデル→認可/秘密/remote code sandbox→負荷/timeout/resource budget→監視/backup→位置収集/描画の消費電力を計測→最適化。 |
| FUT19 | 共同編集・地域コミュニティ・非同期共有 | FUT01, SOC-007 | 共同案の版/提案/承認→本人希望を別保持→実友人の共有リンク→地域tipの鮮度/投票/訂正→取消時のmanaged cache更新→適用中断を明示。 |
| FUT20 | 実利用評価・継続価値・デプロイ費用計測 | SELF-002, DISC-003, TRF-002 | cold start到達時間→任意同意の継続観測→自己理解/移植/発見の別評価→heldout/ablation→アプリAI/地図/交通/compute/storageの実請求から1人当りcost算出。 |

## 保持する設計原則
一人で価値が出て、任意共有で賢くなる。地域表現は属性baselineへの追加adapter。理由・用途・今の希望を分離する。発見は関心の幅を狭める推薦に閉じない。3Dの高度帯は推定と真値を区別する。防災の安全≫習熟度であり、公式情報の不確実性を説明から消さない。

デプロイ、公開認証、省電力、継続学習、広域データは本番へ移るための後続だが、地図造形やDSLを見せるための必須基盤にしない。本体改造のlocal PoCは汎用ストア/クラウドworker完成を待たず実施できる。

採らない構成は「LLMだけが経路も安全も判定」「地図タイル全体から無許可で大量データ取得」「位置頻度を人格と同一視」「任意コードを現行DBに直結」「時間切れだから本体改造構想を消去」。その代わり制約計算・scope・version・本人承認を使う。
