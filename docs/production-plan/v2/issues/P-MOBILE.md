# P-MOBILE：実機の背景位置・立体地図・実交通情報から移動を続けられる

[共通受入](../common-acceptance.md)を適用する。完了は当日の操作・保存・再表示で判定する。

## 操作と結果

実機で背景位置と許可された地図を使う → フロア・ランドマークを確認する → 実交通情報と定期控除で寄り道を選ぶ → 復帰後も記録と根拠を読む。

## 依存と担当範囲

着手依存：P-RECORD, P-ROUTE
接続時の依存：
必要provider：
実AI受入：False

編集予定パス（当日作成する）：

- `future/fut03/`
- `future/fut04/`
- `future/fut05/`

## 読む契約

- `docs/spec/TASK_EXECUTION.md`

実装するoperation：
利用するoperation：
対応要件：EVAL-005, EXT-018, MAP-001, MAP-003, MAP-006, MAP-007, MAP-010, MAP-011, MAP-014, NAV-008, NAV-009, OPS-002, OPS-010, REC-009, REC-010, ROUTE-001, ROUTE-003, ROUTE-004, ROUTE-005, ROUTE-006, ROUTE-007, ROUTE-010

## 固有の受入条件

- 画面off区間と実観測を区別し、圏外で保存した1記録だけ同期する。
- 地下と上層の同一平面座標を異なるPlaceLevelで扱い、unknownを埋めない。
- 鉄道定期の適用/期限切れ/経由違いを実provider応答で比較し、非対応を0円にしない。

## 同じ担当が実装・接続する内容

- FUT03：前景GPSを実機HTTPSで確認→Capacitor等native bridgeまたはMapLibre Native選定→OS権限と背景life cycle→オンデバイス記録queue→許可済みtile bundle→復帰同期。
- FUT04：PLATEAU等の権利/座標/LOD確認→建物外殻/入口/階接続を別データ→手動階確認→GLBは少数→混合用途の実体形状→記録/物理モデル分離を維持。
- FUT05：駅すぱあと等の契約/料金/対応交通を確認→provider courseを保持→鉄道定期区間控除→バス等は別対応確認→最終到着時刻/運休/再検索→fixtureと区別。

## 該当する再発防止

- R26：隔離PoCと製品接続を分け、製品化前に外殻・入口・垂直接続・用途volumeの共有契約と保存を決める。
  - 拒否例：unknown高さを実測にせず、PoCだけでMAP/INT接続完了としない。
