# 当日に実装する28単位

全件を未着手として開始する。内部の旧IDは作業内容の対応用であり、別の取得単位にしない。

| Task | 完成結果 | 着手依存 |
|---|---|---|
| [P-START](issues/P-START.md) | 準備を終え、同じ環境・契約・UI版から着手できる | なし |
| [P-RUNTIME](issues/P-RUNTIME.md) | 起動し、同じ本人領域でAPI・DB・画像を保存して読み直せる | P-START |
| [P-MAP](issues/P-MAP.md) | 場所を探し、地図・建物・人物を同じ座標と文脈で確認できる | P-RUNTIME |
| [P-RECORD](issues/P-RECORD.md) | 観測や原文を場所へ記録し、本人が確認した体験と成長を再表示できる | P-MAP |
| [P-ROUTE](issues/P-ROUTE.md) | 条件と定期券を設定し、根拠付きの経路を比較して選べる | P-MAP |
| [P-REFLECT](issues/P-REFLECT.md) | 記録を振り返って理由を訂正し、自己理解と候補の変化を確かめられる | P-RECORD, P-ROUTE |
| [P-EXPLORE](issues/P-EXPLORE.md) | 候補から歩く・訪問確認・記録へ進み、次の探索へ戻れる | P-REFLECT |
| [P-DISCOVER](issues/P-DISCOVER.md) | 場所や記録から発見を選び、関心の変化を振り返れる | P-REFLECT |
| [P-SHARE](issues/P-SHARE.md) | 共有範囲を選び、友人と体験を比較・返信し、共有を取り消せる | P-RECORD |
| [P-TOGETHER](issues/P-TOGETHER.md) | 共同の希望と制約を入力し、二人で選べる経路を保存できる | P-ROUTE, P-SHARE |
| [P-TRANSFER](issues/P-TRANSFER.md) | 体験の役割を編集し、別都市へ移して差分と根拠を確認できる | P-ROUTE, P-SHARE |
| [P-AI](issues/P-AI.md) | 保存した根拠を使ってAIへ相談し、取消・回答・採否を再入場後も辿れる | P-RECORD, P-ROUTE |
| [P-EXTENSIONS](issues/P-EXTENSIONS.md) | 機能を生成・試用・修正して導入し、三つのテーマを実際に使える | P-AI |
| [P-REPAIR](issues/P-REPAIR.md) | 地域情報を取り込み、出典と差分を見て修復し、再計算を確認できる | P-ROUTE |
| [P-DIARY](issues/P-DIARY.md) | 写真と日記を保存・編集し、再起動後に同じ内容を読める | P-RECORD, P-WORKSPACE |
| [P-COMPANION](issues/P-COMPANION.md) | 相棒を取り込み・生成して採否と選択を決め、一緒に地図を歩ける | P-MAP |
| [P-HEALTH-CORE](issues/P-HEALTH-CORE.md) | 本人確認・健康の許可と集計をXML・HealthKit・AIから共通に使える | P-RUNTIME |
| [P-HEALTH](issues/P-HEALTH.md) | 健康情報を許可して取り込み、統計とAI提案を確認・採用・失効できる | P-AI, P-HEALTH-CORE |
| [P-NATIVE](issues/P-NATIVE.md) | iPhoneで本人のHealthKit情報を読み、同じアプリの統計へ反映できる | P-HEALTH-CORE |
| [P-WORKSPACE](issues/P-WORKSPACE.md) | デモと本人設定を保存・再開・resetし、本人データを出力できる | P-RUNTIME |
| [P-RELEASE](issues/P-RELEASE.md) | 全対象操作を通して確認し、再現可能な動作版を渡せる | P-COMPANION, P-DIARY, P-DISCOVER, P-EXPLORE, P-EXTENSIONS, P-NATIVE, P-REPAIR, P-TOGETHER, P-TRANSFER, P-HEALTH |
| [P-DEPLOY](issues/P-DEPLOY.md) | 本人認証・共同利用・永続化を備えた非公開環境を運用できる | P-AI, P-TOGETHER, P-WORKSPACE |
| [P-MOBILE](issues/P-MOBILE.md) | 実機の背景位置・立体地図・実交通情報から移動を続けられる | P-RECORD, P-ROUTE |
| [P-SOURCES](issues/P-SOURCES.md) | OpenUASと追加形式の情報を取り込み、意味の変化を修復できる | P-REPAIR, P-TRANSFER |
| [P-LEARNING](issues/P-LEARNING.md) | 写真と利用履歴からの提案を評価し、継続価値と費用を確かめられる | P-AI, P-DISCOVER, P-TRANSFER |
| [P-PLUGIN-STUDIO](issues/P-PLUGIN-STUDIO.md) | 隔離した追加機能を作成・公開し、画面と処理を組み替えられる | P-EXTENSIONS |
| [P-APP-STUDIO](issues/P-APP-STUDIO.md) | 本人のAIへ改造依頼を渡し、previewからデータを保って戻せる | P-EXTENSIONS |
| [P-THEMES](issues/P-THEMES.md) | 防災・バイク・聖地巡礼を実データの出典と制約に従って使える | P-EXTENSIONS, P-REPAIR |
