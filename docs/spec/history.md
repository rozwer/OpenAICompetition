# History MVP（2026-09-08）

## 1. 調査と統合

既存のMapLibre、Next.js、SQLite、React状態、ローカルCodexを維持。日付ライブラリの追加はせず、日本時間（Asia/Tokyo）の日/月境界を共通関数にした。Visit/Context/UserRelationは前回追加したpersonal_records、GPSはrecordsのpointを参照する。通常の地図メニューの「これまでの軌跡」を有効化し、`#history`に遷移。下部4項目は変えない。History中は通常MapCanvasと全Snapshotの定期取得を止める。

添付READMEはレイヤー未分離の参考画像である旨を確認した。配色・角丸・地図中心の構成を採用し、空状態のイラストを利用。画像の架空の地点・数値・経路・写真をユーザーの記録として使用しない。実地図と文言はMapLibre/CSS/HTMLで描画する。

## 2. 新規ファイル

- `src/contracts/history.ts`: HistoryData、DayJourney、MonthlyHistorySummary、ReplaySnapshot、MonthlyInsight Schema。
- `src/domain/history.ts`: 日本時間の期間、日/月集計、初訪問、GPS線の軽量化。
- `src/infrastructure/history-store.ts`: 期間指定SQL、変更revision、AI保存。
- `src/server/history.ts`: 取得・キャッシュ・AI解析。
- `src/app/api/history/route.ts`: 認証済みGETとAI更新POST。
- `src/features/history/HistoryPage.tsx`、`HistoryMap.tsx`、`HistorySections.tsx`: 3モード、地図、タイムライン、Recap。
- `public/images/history/empty.png`: 添付空状態イラスト。
- `tests/history.test.ts`、`tests/history-live.test.ts`、`tests/e2e/history.spec.ts`。

## 3. 変更ファイル

`src/app/page.tsx`（組立て・ルーティング）、`src/features/home/Home.tsx`（入口）、`src/app/globals.css`（デザイン）、`src/server/services.ts`（DI）、`src/infrastructure/codex.ts`（月次JSON生成）、`tests/e2e/app.spec.ts`（入口の新しい期待値）、`docs/spec/implementation-status.md`。

## 4. 取得

`GET /api/history?mode=day&period=YYYY-MM-DD`、またはmode=month/replay、period=YYYY-MM。署名付きセッションから利用者を決定。日付実在性・未知パラメータを検証。本人の確認済みVisitだけを対象とし、未確認の滞在候補・架空の散歩は除外。GPSはdevice/importedだけを参照する。新規アカウントには空状態、記録のない日/月には専用文言。

## 5. Day Journey

日境界と重なるVisitを時刻順に並べ、地図番号と一覧を対応させる。同じ場所への再訪を消さない。到着・出発、カテゴリ、ブランド、当日の滞在時間を表示。不明な滞在はnullで、0分と区別。深夜をまたぐ場合は各日の範囲に滞在時間を配分する。GPSに対応する線がない場合のみ、訪問順の破線を描画し「実際に歩いた経路ではない」と明示。記録の間隔を移動所要時間と断定しない。

## 6. Monthly Recap

その月と重なる確認済み訪問の件数、ユニーク場所数、初訪問場所数、滞在のある日数、既知の滞在分数、カテゴリ回数、上位5地点、新規代表5地点を集計。月またぎは双方に訪問が現れ、滞在時間は重複しないよう配分。初訪問は利用者の全期間の最初の日付から判定。GPS距離は記録された有効な線分の距離であり、徒歩距離ではない。欠測時は「記録なし」。

## 7. Replay

選択月末までの訪問を累積し、場所ごとの最初の訪問と累計回数を付ける。月内の初訪問は大きな緑、以前の地点は薄い緑、3回以上の訪問は青。記録のある月をスライダーと再生/停止で選択できる。月を変える際は同じMapLibreインスタンスのソースを更新する。低ズームではクラスタ化。地点選択から初訪問日のDayへ、DayからMonthへ、Monthの新規場所から絞り込んだReplayへ接続。

## 8. AI Monthly Insight

「AIのひとことを更新」でのみ実行。今月と前月の件数・カテゴリ・上位場所・滞在などの集計を送り、生GPSや個別の訪問時刻は送らない。場所名・IDを含む集計であり匿名化データという意味ではない。

出力はstrict JSON `{title:string(max80),summary:string(max400),confidence:number(0..1)}`。日本語1〜3文を指示し、性格・目的・未知の地域の推定を避ける。前月0件を行動0と解釈しない。`history_insights`に利用者/月/集計fingerprint/生成日時/JSONを保存。失敗・不正JSON時は集計を維持して注意文を表示する。利用者ごとの30秒間隔、同時2件。同じ入力は再生成しない。

## 9. パフォーマンス

SQLの利用者・kind・日時インデックスを使用。日/月表示は必要な2か月、Replayは該当時点までのデータをサーバーで読む。全生GPSをHistoryのReact stateへ送らない。GPSは品質・時間ギャップ・不自然な速度を既存segments処理で区切り、最大約2,000点/500線分に軽量化する。欠測を埋めるルートAPIは呼ばない。

サーバーは利用者/revision/モード/期間ごと最大64ビュー、画面は最大30ビューをキャッシュ。Visit/Place/GPSの追加・更新・削除をSQLiteトリガーでrevisionに反映する。画面内キャッシュはHistoryを開き直すか再試行で更新する。AI結果は集計hashが一致する場合のみ再利用。

一回の読取上限はVisit 50,000、GPS 100,000。超過は部分集計である旨を表示。地図は2,000地点、Day一覧は500件まで。超過データを厳密な全件集計として扱わない。デモ規模向けであり、本番の大規模履歴では日次集計テーブルとページネーションに置換する。

## 10. 未実装

地域数・地域名は信頼できるAreaモデルが未整備のため表示しない。写真・メモ・SNS共有・履歴の自然文検索・地域レベル・高度な推薦・今回範囲外のPersonal機能は追加していない。既存背景地図の収録範囲外では訪問と軌跡は描画できるが、道路などは不足する。Dayで同じ座標へ複数回訪れた場合、番号が重なる場合がある（一覧では全順序を確認できる）。

## 11. 拡張点・確認

地域境界とArea集計、写真/メモの紐付け、大規模な日次物化集計、重複座標の番号展開を追加できる。UIと集計は分離済み。

検証: 空・1件・同日複数・再訪・複数月・月境界・新規判定・時間欠損・GPS欠損・8,000Visit・利用者分離・キャッシュ無効化・AI不正応答を単体検証。`HISTORY_LIVE=1 pnpm exec vitest run tests/history-live.test.ts` は実Codexに検証用集計のみを送る。画面は390×844で3モードと固定ナビゲーションを確認する。

最終確認: pnpm check（47件）、pnpm build、History E2E3件、月次コメントのCodex実接続1件成功。既存E2Eの入口期待値も新しい有効状態へ更新した。

### Day画面の更新
- 地図上に前日・翌日、日付、カレンダーを配置。今月のDayを開くと今日を表示する。
- 下部の白いシートに訪問順、時刻、カテゴリ、滞在時間を表示。訪問項目を押すと到着・出発時刻を展開する。
- 写真データは保持していないため、カテゴリ別アイコンを使用する。未記録の時間を推測しない。
- 日付変更中は前日の地図や訪問記録を新しい日付として表示しない。

### ローカルのサンプル訪問データ
`node scripts/seed-history-demo.mjs` で、稼働用 `.local/grow-map-nagoya.sqlite` の利用者A/Bに直近3か月の架空訪問を追加する。別DBを指定する場合は第1引数にパスを渡す。実行前にSQLiteバックアップを作成し、既存記録は変更しない。同じ日のサンプルIDは再実行しても重複しない。
場所名は「（サンプル）」付き。座標はエリアの目安であり、実在店舗の位置や訪問事実を示さない。GPS軌跡は追加せず、Dayでは訪問順を破線で表示する。訪問集計・パーソナル機能にもこの架空訪問が含まれる。閲覧中の場合は再読み込みする。
2026-09-08投入時: 各利用者26日・104訪問（7月24件、8月48件、9月32件）。
