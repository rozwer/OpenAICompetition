# 位置記録を取得・保存するためのSDK候補

調査日：2026年9月5日\
対象：[育てる地図の実装仕様書](../spec/implementation.md)

このメモは、Mac上の仮想端末でのデモを完成させた後、実機の位置記録を組み込む際の参考資料とする。
今回のデモは再生入力から始め、SDKの採用と組込みを完成条件に含めない。
今回の優先は、記録と対話が地図・比較・提案へつながるデモであり、省電力性の訴求やSDK間の電池消費の比較は行わない。
日常の移動を操作なしで記録するため、既存の位置情報SDKを利用する案を整理する。
最初の候補は、自分たちのサーバーへの送信と移動検知が公開APIで扱えるTransistorsoft Background Geolocation SDKとする。
ブログウォッチャーのProfile Passport SDK、GoogleとAppleの公開API、Radarも比較した。
これは公開仕様に基づく選定案であり、SDKの組込み、実機での精度・電池測定、契約や購入はまだ行っていない。

## SDKごとに、取得できる情報と導入条件が異なる

| 候補 | 公開資料で確認できた機能 | 導入とデータ利用の確認事項 |
|---|---|---|
| ブログウォッチャー Profile Passport SDK | iOS・Android向けの位置情報取得、ジオフェンス、位置に応じた通知や分析 | 申込みと契約が必要。個人の軌跡を自分たちのDBへ保存するAPIと利用条件は要確認 |
| Google Fused Location Provider＋Activity Recognition | Android上で複数の測位手段を使う位置取得と、移動・静止などの活動検知 | 公開API。記録の切替、端末内の保存、自分たちのDBへの再送などを組み合わせる必要がある |
| Apple Core Location | iOS上の位置更新、訪問、重要な位置変化、領域の出入りなどの検知 | 公開API。使用するサービスに応じた権限と背景動作を設計し、保存・送信を組み合わせる |
| Transistorsoft Background Geolocation | iOS・Androidの移動検知、測位の開始・停止、端末内保存、自分たちのサーバーへのHTTP送信 | v5はDEBUGで評価でき、両OSのRELEASEにはライセンスが必要 |
| Radar SDK | iOS・Androidの背景記録とジオフェンス。移動・停止に応じた記録設定 | Radarのキーとサービスを利用する構成。契約・料金と記録の送信経路を確認する |

### Profile Passport SDKは実在し、導入事業者向けに提供されている

ブログウォッチャーは、アプリへ組み込むProfile Passport SDKを提供している。
対応環境やAPIの提供範囲、導入日程は、採用を検討する際に確認する。[公式サービス](https://www.blogwatcher.co.jp/service/profile-passport-sdk)

位置取得の内部設定や、個人の歩いた道を取り出すコールバック・データ形式は、今回確認した公開資料では特定できなかった。
契約と提供仕様に応じた情報の取扱いが定められているため、本人のアカウントに紐付く履歴として保存・表示できる範囲を確認する必要がある。[SDKサービス約款](https://www.blogwatcher.co.jp/terms_sdk)
既存契約や提供済みSDKの有無は未確認である。既に利用できる条件がある場合は、導入の見込みを再評価する。

### Google系では、位置取得と地図表示のAPIを使い分ける

Fused Location ProviderはGoogle Play servicesのAndroid向けAPIで、GPSやWi-Fiなど複数の信号を組み合わせる。
アプリから求める精度や更新条件を指定できる。[Fused Location Provider](https://developers.google.com/location-context/fused-location-provider)
Activity RecognitionのTransition APIを使うと、歩行や乗車などの活動の開始・終了を受け取れる。
こうしたイベントを記録開始や省電力状態へ戻す判断に使う。[Activity Recognition](https://developers.google.com/location-context/activity-recognition)

Google Maps SDKのMy Locationレイヤーは、地図上の現在位置表示を担う。
位置をプログラムで利用するときは位置取得APIへ接続する。[Maps SDKの位置情報](https://developers.google.com/maps/documentation/android-sdk/location)
この使い分けにより、地図の描画方式と記録用のSDKを個別に選べる。

iOSではCore Locationを使う。
訪問や重要な位置変化を監視するサービスと、より細かい位置更新を使い分けられる。[Appleの位置取得](https://developer.apple.com/documentation/corelocation/getting-the-current-location-of-a-device)
必要な権限と背景で動く条件は、採用するサービスとOSの版に合わせて確認する。[背景での位置更新](https://developer.apple.com/documentation/corelocation/handling-location-updates-in-the-background)

Google Maps Timelineの履歴を第三者アプリから自動取得する公開APIは、今回の公式資料の調査では確認できなかった。
公式ヘルプには、本人がアプリから履歴をファイルへ書き出す方法がある。
この履歴取込みは、これからの行動を収集するSDKの組込みとは別に扱う。[Timelineの公式ヘルプ](https://support.google.com/maps/answer/6258979?co=GENIE.Platform%3DiOS&hl=en)

### Transistorsoftは、自動切替と保存・送信をまとめて評価できる

Background Geolocation SDKには、移動時に測位し、静止時に位置サービスを止める処理がある。
位置の端末内保存、HTTP送信、同期状態や位置更新のイベントをアプリへ渡すAPIもある。[SDKのAPI](https://docs.transistorsoft.com/react-native/BackgroundGeolocation/)
React Native／ExpoとCapacitor等に対応するため、モバイル側の構成を選んだうえで組み込める。[対応環境とライセンス](https://github.com/transistorsoft/react-native-background-geolocation)

現行v5ではDEBUGビルドはライセンス不要で、iOS・AndroidのRELEASEビルドにはライセンスが必要である。
公式にはRELEASEの30日試用も案内されているが、今回は発行していない。
Starterの表示価格は399米ドルで、1アプリ識別子のiOS・Androidを対象にする。料金は調査日の表示である。[販売条件](https://shop.transistorsoft.com/products/background-geolocation-sdk)
評価後の配布形態と費用を決めてから採用を確定する。

Radarにも、移動中は更新し、停止時は測位を抑える設定がある。
React Native向けの公開SDKと、用途ごとの記録設定が提供されている。[RadarのSDK](https://docs.radar.com/sdk/react-native)、[記録設定](https://docs.radar.com/sdk/tracking)
月間API呼出し数や記録対象ユーザー数に応じたサービス料金であるため、自分たちのDBへ直接記録する案と運用条件を比較する。[料金](https://radar.com/pricing)

## 実機での日常利用へ進む際は、自動記録を基本にする

本人が記録を有効にした後は、SDKによる移動・静止の検知を使って測位を調整する。
日々の移動に手動の開始・終了を求めず、記録の一時停止と再開は本人が選べるようにする。
「この散歩を残す」という操作は、体験のまとまりや追加の精度指定に使う。

SDKの取得結果は、時刻と精度を伴う位置記録として保存する。
記録が不十分な区間や判別できない店・階は、不明な状態を保つ。
場所を選んだ理由や記憶は本人の説明から加え、SDKによる活動の推定と区別する。

実機では、画面を消した状態の静止→歩行→滞在→再移動、短い寄り道、屋内、通信断、権限変更を試す。
移動の始端・終端にどのような欠落があるか、再送で重複しないかを確かめる。
電池消費の比較測定や独自の最適化は、継続利用を検証する段階で扱う。
SDKの省電力化の説明を、このアプリと端末での実測結果に置き換えない。

OwnTracksは、ログの取込みや比較に使う補助手段として残す。
通常の利用はSDKを組み込んだモバイルアプリで完結させ、地図、対話、比較が使うデータの形式を共通化する。
