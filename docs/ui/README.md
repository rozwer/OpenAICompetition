# UI画像の受領と実装対応

2026-09-09にユーザーのDownloadsから12 PNGを受領した。11画面例とスタート背景素材1点。
原本はreference/へバイト列を変えずコピーし、元ファイル名・寸法・SHA-256をmanifest.jsonへ記録した。
画像を確認した結果と、この後の会話で合意した差分を本書にまとめる。
画像は見た目の参考であり、写真・人物・店舗・日付・集計値が実データであることや、外部ログイン/地図/健康連携の稼働を示さない。

## 画面から実装へ

| 画面ID / 見本 | 主な操作 | 正本となる保存・読取り | 担当 |
|---|---|---|---|
| [S-START](reference/start.png) | 地図をのぞく、アカウントで続ける | previewはdemo namespace。実sessionの入口は接続済みproviderだけ | UI-001、DEMO-001、PREP-007 |
| [ASSET-START](reference/start-background.png) | 背景素材 | 装飾用。図中の点線を実経路として利用しない | UI-001 |
| [S-MAP-3D](reference/map-3d.png) | 検索、レンズ、2D/3D、記録、AIへ | putContext、createExperience、getMeaning。地図UIはMAP-001〜004 | MAP-001〜004、REC-001、UI-002 |
| [S-MAP-MINE](reference/map-mine.png) | 本人の意味で育つ建物を選ぶ | getMeaningと元Experience/Evidence。もやの追加はdocs/spec/MIST_EXPLORATION.md | MAP-002、EXP-003、EXP-004 |
| [S-MAP-AI](reference/map-ai.png) | 気分/時間/距離/同行者と入力 | 既存AI job・CandidateSet・planRoute。候補を見てから相談もできる | AI-007、RTE-004、EXP-004 |
| [S-MAP-2D](reference/map-2d.png) | 2D表示と同じ相談入口 | putContext。ファイル名は記録だが画像内の選択はAIモード | MAP-004、AI-007 |
| [S-SOCIAL](reference/social.png) | 体験/人、条件、地図で見る、共有範囲 | listSharedExperiences、createShareGrant/revokeShareGrant。未許可の本人候補は含めない | SOC-001〜004 |
| [S-EXTENSIONS](reference/extensions.png) | ストア/導入済み、詳細、導入、開発ガイド | listExtensions/listInstalls、previewExtension/installExtension、createDevelopmentRequest | EXT-003〜006、DEV-001 |
| [S-SELF-HISTORY](reference/self-history.png) | 日付、訪問確認/却下、記録訂正、振り返る | getHistory、listVisits/updateVisit、correctExperience | SELF-001、REC-003、REC-007 |
| [S-SELF-REFLECT](reference/self-reflect.png) | 一問ずつ回答、後で、スキップ、根拠 | listExperienceQuestions/respondToQuestion。未訪問を質問回答だけで訪問確定しない | AI-008/009、INT-016 |
| [S-SELF-TRENDS](reference/self-trends.png) | 期間、根拠、違う/条件を直す | listHypotheses/reviewHypothesis、元の記録。期間・欠測・暫定解釈を分ける | SELF-002/003 |
| [S-SELF-STATS](reference/self-stats.png) | 日/週/月/年、連携管理、元データ | listHealthSummaries、保存済み訪問集計。取得元を混ぜない | HLT-003/005、SELF-001 |

## 共通の見た目とコンポーネント

4タブは「地図を育てる」「みんなで育てる」「アプリを育てる」「自分を知る」。選択状態は青緑の面とラベルで示す。
白いカード、淡い背景、丸い操作面、濃い本文、柔らかな地図造形を共通とする。
地図は主要な表示面として残し、詳細は下から開くsheetで重ねる。
共通部品はBottomNav、SegmentedControl、Sheet、PlaceCard、EvidenceLink、SourceBadge、PendingState、DateRangeControl、ConfirmVisitActionをUI-001/002で用意する。
具体的な文字サイズ・余白は画像の縮小率を固定せず、狭い画面・文字拡大・キーボード表示でも操作を保つ値にする。
選択中・loading・empty・error・disabled・staleを持ち、loadingをもやもや候補の意味に流用しない。
見本の半透明面でも、本文と操作の識別を保つ。もやはdocs/spec/MIST_EXPLORATION.mdの静止表示・一覧操作を併設する。

## 画像間の差分と採用規則

- 自分画面の上段は、後の統計画像に合わせ「振り返り・傾向・統計」を常設とし、プロフィールは右上の設定から到達できる。プロフィール機能は削除しない。
- 地図画像の「自分」は本人視点、「自分レンズ」は意味の表示という違いをAppContextのpeerId/lensへ正しく対応付ける。ラベルだけで同じ内部状態に潰さない。
- Mapboxロゴは画像に含まれる見本。現行のMapLibre/Threeという技術選定を画像だけで変更しない。実providerが要求する帰属表示を実装する。
- Google/Apple/OpenAIのログインボタンは接続を裏付けない。接続済み認証だけ有効にし、認証未提供でもdemo previewを使える。PREP-007で接続状況を扱う。
- 統計画像の階段数・走行距離・年集計は、既存health契約の対象metricと一致する範囲だけ表示する。歩行距離を走行を含む値と呼ばない。未対応metricは数値を偽装せず、追加時に契約から拡張する。
- 日付と曜日、件数、タイプ名、グラフの目盛り、人物や場所は説明用。保存データから生成し、画像の文字や数値を実行結果として固定しない。
- ペット管理・健康同意・探索候補詳細等の全状態画像は未提供。docs/spec/PET_COMPANION.md、docs/spec/HEALTH_INTEGRATION.md、docs/spec/MIST_EXPLORATION.mdと共通部品から実装できる。未提供画面の見た目をユーザー確認済みと報告しない。

## 今回合意した地図の追加

[S-MAP-MINE](reference/map-mine.png)の育った建物と同じ地理空間へ、未形成の探索候補を中立のもやもやモデルとして置く。
「もや → 気になる → 訪れて記録 → 本人の意味の形 → 次の候補」をdocs/spec/MIST_EXPLORATION.mdのS-EXP-01〜05で実装する。
元画像を描き換えた完成見本は今回の受領には含まれない。参考記事の放射状店舗数グラフは採用していない。

## 受領確認と実装の確認

12点の存在、画像の読み取り、原本とのhash一致、上表の操作と保存の対応をPREP-006の受領証拠とする。
画面を実装して動作確認した証拠ではない。UI-001/002と各featureで実画面を検査し、INTでAPI・保存・復帰を通す。
