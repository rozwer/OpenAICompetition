# 旧受入条件とレビュー後要件の対応

更新日：2026年9月8日。旧A01〜A55は基線として保持し、最新の[ID付き要件](reviewed-requirements.md)と合わせて確認する。これは文書の対応表であり、実行・合格の記録ではない。

| 旧ID | 操作 | 期待結果 | 対応する要件 | 明確化 |
|---|---|---|---|---|
| A01 | 履歴のない利用者が場所を選び、過ごし方を話す | 訪問ログなしでも関係を保存でき、次の質問がその回答を使う | [CORE-002](reviewed-requirements.md#core-002), [REC-002](reviewed-requirements.md#rec-002), [REC-006](reviewed-requirements.md#rec-006), [REC-007](reviewed-requirements.md#rec-007) | — |
| A02 | 同じsource_record_idを含む記録を2回送る | 原記録が重複せず、訪問数・関係数が増えない | [REC-005](reviewed-requirements.md#rec-005), [MAP-004](reviewed-requirements.md#map-004) | — |
| A03 | 観測順と逆の順序で同じ点を送る | 観測時刻で同じ軌跡を作り、受信時刻を到着時刻にしない | [REC-005](reviewed-requirements.md#rec-005) | — |
| A04 | 120秒超の空白、50m超・不明の精度、12m/s超の速度を個別に含める | 設定版を保持して該当区間を分断し、欠落を実際の通行として補完しない | [REC-003](reviewed-requirements.md#rec-003), [REC-010](reviewed-requirements.md#rec-010) | 12m/sを全モード共通の異常閾値にせず、適用モード・設定版を保持。高速の鉄道記録を一律欠測にしない |
| A05 | 建物の横を通過し、店の近くに短時間だけ留まる | 通過・候補に留まり、建物内や全階を訪問済みにしない | [REC-001](reviewed-requirements.md#rec-001), [REC-004](reviewed-requirements.md#rec-004), [MAP-002](reviewed-requirements.md#map-002) | — |
| A06 | 本人が候補を確認、拒否、別の店へ訂正する | 根拠と新しい版が残り、地図と訪問状態が一致する | [REC-004](reviewed-requirements.md#rec-004), [DATA-001](reviewed-requirements.md#data-001) | — |
| A07 | 位置のない写真とメモを追加する | 無理に場所を推定せず、本人が関連付けられる。再表示できる | [REC-009](reviewed-requirements.md#rec-009) | — |
| A08 | 河川敷の理由を回答し、画面を開き直す | 原文、用途、理由、条件が保持され、次の質問へ反映される | [REC-006](reviewed-requirements.md#rec-006), [SELF-002](reviewed-requirements.md#self-002) | — |
| A09 | 「毎日通る」という記録だけを与える | 好みを本人の説明として確定せず、仮説と根拠を分ける | [MAP-005](reviewed-requirements.md#map-005), [SELF-006](reviewed-requirements.md#self-006) | — |
| A10 | 質問を後回し・スキップし、再度同じ場所を開く | 状態を保持し、根拠の追加なしに同じ質問を迫らない | [REC-007](reviewed-requirements.md#rec-007) | — |
| A11 | 送信直後に地図の選択を別の場所へ変える | 回答と抽出結果は送信時の対象に保存される | [NAV-006](reviewed-requirements.md#nav-006) | — |
| A12 | 原文保存後にAIを失敗させ、再試行する | 原文が残り、二重登録なしで解釈を完了する | [REC-008](reviewed-requirements.md#rec-008), [OPS-004](reviewed-requirements.md#ops-004) | — |
| A13 | 実際の高さがある建物を登場させる | 登場後は取得した高さに固定され、訪問回数で変わらない | [MAP-006](reviewed-requirements.md#map-006) | 現実の建物高さは不変。用途による象徴形状を実測高さと誤認させず、原形へ戻せる |
| A14 | 高さ不明の建物と、地下・上層階・階不明を表示する | 不明な形状を捏造せず、階と本人の訪問根拠を区別する | [MAP-007](reviewed-requirements.md#map-007) | — |
| A15 | 入口と階段・エレベーターを選ぶ | 異なる階の接続として表示・保存され、建物全体の訪問にならない | [MAP-007](reviewed-requirements.md#map-007), [MAP-014](reviewed-requirements.md#map-014) | — |
| A16 | 比較の4類型の素材を読み込む | 同じ場所・同じ用途、同じ場所・違う用途、違う場所・同じ用途、相手だけの知識を区別する | [SOC-006](reviewed-requirements.md#soc-006) | — |
| A17 | 東京の河川敷と名古屋の本屋の比較カードを選ぶ | 双方の場所を確認でき、意味の対応が経路線に見えない | [SOC-008](reviewed-requirements.md#soc-008) | — |
| A18 | 朝の作業と休日の会話を比較する | 時間帯・同行者などの条件を落とさず違いを説明する | [SOC-007](reviewed-requirements.md#soc-007) | — |
| A19 | Aが対応を「違う」と訂正して同じ入力を再計算する | 同じ二つの版だけで却下した対応が復活しない | [SOC-009](reviewed-requirements.md#soc-009) | — |
| A20 | Bが用途のみを共有し、AがAPI・画面・画像URLへアクセスする | 原文、理由、写真、詳細な軌跡が漏れない | [SOC-003](reviewed-requirements.md#soc-003), [DATA-003](reviewed-requirements.md#data-003), [DATA-008](reviewed-requirements.md#data-008) | — |
| A21 | 比較画面を開いたままBが共有を取り消す | 投影と依存結果が失効し、次の取得と画面更新で本文が消える | [SOC-014](reviewed-requirements.md#soc-014), [DATA-003](reviewed-requirements.md#data-003) | — |
| A22 | AI計算中に共有を取り消し、その後AI結果を返す | 古い権限版による結果を公開しない。再計算でも取消済み情報を渡さない | [DATA-004](reviewed-requirements.md#data-004) | — |
| A23 | 共有取消後にキャッシュ・検索・会話継続・保存済み結果を使う | すべて現在の権限で絞られ、古い引用を再表示しない | [DATA-005](reviewed-requirements.md#data-005) | — |
| A24 | 「この日は急いだだけ」と訂正し、同じログを再読込みする | 当該体験の訂正が残り、休日全般へ広げず、元の誤解釈が復活しない | [SELF-003](reviewed-requirements.md#self-003), [DATA-002](reviewed-requirements.md#data-002) | — |
| A25 | 現在の好みを変え、過去の体験と現在の推薦を表示する | 過去の記憶を保持しつつ、新しい条件で推薦する | [SELF-011](reviewed-requirements.md#self-011), [DATA-002](reviewed-requirements.md#data-002) | — |
| A26 | 同じ関係を二つの画面から同時編集する | 片方が409となり、本人の変更を無言で上書きしない | [OPS-004](reviewed-requirements.md#ops-004) | — |
| A27 | 元の体験から役割・順序・理由を抽出し編集する | 本人の説明とAIの解釈を確認でき、編集後の条件で探索する | [TRF-001](reviewed-requirements.md#trf-001), [TRF-002](reviewed-requirements.md#trf-002), [TRF-003](reviewed-requirements.md#trf-003) | — |
| A28 | 同じ街・出発点・候補・時間で二つのモードを切り替える | 忠実さと自分への適合を別々に保存し、条件に沿って順位・説明が変わる | [TRF-004](reviewed-requirements.md#trf-004), [EVAL-002](reviewed-requirements.md#eval-002) | — |
| A29 | 必須の「座れる」が未確認の候補しかない | 満たした候補として採用せず、情報不足と調整案を示す | [ROUTE-009](reviewed-requirements.md#route-009) | — |
| A30 | 時間超過・到達不能・階段回避不能の候補を含む | 不適合を除外し、候補なしでも条件を黙って緩めない | [ROUTE-009](reviewed-requirements.md#route-009), [TRF-003](reviewed-requirements.md#trf-003), [TRF-006](reviewed-requirements.md#trf-006) | — |
| A31 | 経路APIを失敗させる | 直線を歩行経路にせず、再試行か保存済み結果を明示して選べる | [ROUTE-003](reviewed-requirements.md#route-003) | — |
| A32 | 現地の人との思い出を含む体験を移す | 移せない記憶を元の体験へ残し、地形だけで再現できたとしない | [TRF-005](reviewed-requirements.md#trf-005), [TRF-006](reviewed-requirements.md#trf-006) | — |
| A33 | 候補を訪問／見送りにし、感想を返す | 採用・見送り・本人の体験が結び付き、次の候補の評価へ使われる | [TRF-011](reviewed-requirements.md#trf-011), [SELF-013](reviewed-requirements.md#self-013) | — |
| A34 | 既存の条件と色分けで足りる要求を与える | 設定型として生成し、追加前後をプレビューできる | [EXT-008](reviewed-requirements.md#ext-008) | — |
| A35 | 未実装の寄り道時間計算と表示を要求する | Codexがコードを変更し、独立した検証に合格する。実行結果が寄り道時間と境界値の条件を満たす | [EXT-008](reviewed-requirements.md#ext-008), [EXT-009](reviewed-requirements.md#ext-009) | — |
| A36 | 検証が失敗したコード、検証後に変更されたコードを有効化する | 有効化を拒否し、前の利用中の版を維持する | [EXT-002](reviewed-requirements.md#ext-002), [EXT-010](reviewed-requirements.md#ext-010) | — |
| A37 | 無限ループ、過大出力、未許可のネットワーク・DB操作を含める | 実行範囲と上限で停止し、アプリの保存や既存の機能を壊さない | [EXT-011](reviewed-requirements.md#ext-011), [EXT-012](reviewed-requirements.md#ext-012) | — |
| A38 | 新しい表示をフレームで動かす | 許可した描画と選択は動き、親のCookie・DOM・任意通信へアクセスできない | [EXT-011](reviewed-requirements.md#ext-011), [EXT-014](reviewed-requirements.md#ext-014) | — |
| A39 | 機能を無効化・再有効化・以前の版へ復帰する | 利用者の登録と地図が一致し、検証済みの指定版を使う | [EXT-002](reviewed-requirements.md#ext-002) | — |
| A40 | Bの機能をAへ共有・複製し、Aが変更する | Bの非公開データとキーを含まず、Aの入力で実行し、元の機能を上書きしない | [EXT-015](reviewed-requirements.md#ext-015) | — |
| A41 | 機能複製後に元の共有を取り消す | 新規取得・複製を止める。独立した複製は残し、元の非公開入力への参照は失効する | [EXT-015](reviewed-requirements.md#ext-015), [DATA-006](reviewed-requirements.md#data-006) | — |
| A42 | API・CSV・GeoJSON・HTML・PDFの各再現資料を取得する | 共通形式へ変換でき、出典・時刻・ページ等の根拠が追える | [EXT-016](reviewed-requirements.md#ext-016) | — |
| A43 | 普段の道へ工事・雨・浸水想定等を重ねる | 種別と時刻を区別し、慣れと安全性を混同しない。デモ情報を実際の情報と誤認させない | [EXT-004](reviewed-requirements.md#ext-004) | — |
| A44 | 情報源を通信断・古いデータ・解析不能にする | 最終成功値と時刻を保持し、失敗・古さ・空データを区別する | [EXT-017](reviewed-requirements.md#ext-017), [EXT-018](reviewed-requirements.md#ext-018) | — |
| A45 | 座標列の名称を変更し、修復する | Codexが修復候補を作る。元のSuiteで検証に合格した候補を反映すると、通常更新が再開する | [EXT-017](reviewed-requirements.md#ext-017), [EXT-010](reviewed-requirements.md#ext-010) | — |
| A46 | 単位の意味の変更、Suiteの改変、重複した修復要求を与える | 意味の変更は保留、Suite改変では合格不可、同じ修復は一つだけ動く | [EXT-010](reviewed-requirements.md#ext-010), [EXT-017](reviewed-requirements.md#ext-017) | — |
| A47 | Codexの確認要求、中断、認証失敗を再現する | 要求IDに正しく応答し、失敗を機能生成の成功として扱わない | [OPS-005](reviewed-requirements.md#ops-005) | — |
| A48 | SSE切断後に連番から再接続する | イベントの重複反映がなく、現在の保存状態へ追い付く | [OPS-003](reviewed-requirements.md#ops-003) | — |
| A49 | ワーカーを再起動する | leaseから復帰し、AI・Codexのターンと保存結果を二重作成しない | [OPS-003](reviewed-requirements.md#ops-003), [OPS-004](reviewed-requirements.md#ops-004) | — |
| A50 | 同じIdempotency-Keyで同じ本文／異なる本文を送る | 同じ結果／409を返す | [OPS-004](reviewed-requirements.md#ops-004) | — |
| A51 | 6場面をそれぞれ途中から開始する | 新しいspaceで必要な前段が揃い、別のrunや実データを上書きしない | [OPS-007](reviewed-requirements.md#ops-007) | 旧6場面に加えSC01〜11の分離再開も検証 |
| A52 | モデルや外部サービスの認証が未設定、費用上限へ到達した状態で起動する | 未設定・停止理由が分かり、保存済み表示をライブ成功としない | [OPS-006](reviewed-requirements.md#ops-006) | — |
| A53 | 390×844の仮想端末で入力・選択・戻るを通す | パネルとキーボードで必要な操作が隠れず、対象がずれない | [NAV-008](reviewed-requirements.md#nav-008), [OPS-002](reviewed-requirements.md#ops-002) | — |
| A54 | 合成の性能確認用データで地図を操作する | 操作応答・保存時間・描画を測定し、目標未達ならボトルネックを記録して修正する | [OPS-008](reviewed-requirements.md#ops-008) | — |
| A55 | F01からF05までを一つのrunで通す | 同じ回答・関係・体験のIDと版が次の場面へ使われ、訂正後の再提案までつながる | [CORE-001](reviewed-requirements.md#core-001), [OPS-007](reviewed-requirements.md#ops-007), [EVAL-004](reviewed-requirements.md#eval-004) | — |
