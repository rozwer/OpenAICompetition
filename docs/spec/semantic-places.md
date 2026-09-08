# 場所の意味情報（2026-09-08）

## 統合先とファイル

既存のMapLibreと `Place` の `lat/lng/category` を維持する。`SemanticPlace` が出典・階層分類・ブランド・原タグを追加する。Building はポリゴンを持つ別モデル。既存会話や経路の固定地点を置換しない。

- 変更: `src/app/page.tsx`（組立て）、`src/features/map/MapCanvas.tsx`（共通地図へのレイヤー追加）、`src/app/globals.css`（共通情報カード）。
- 追加: `src/contracts/places.ts`、`src/domain/place-normalization.ts`、`src/domain/place-adapters.ts`。
- 追加: `src/infrastructure/osm-place-provider.ts`、`place-cache.ts`、`bundled-places.ts`、`src/server/places.ts`、`src/app/api/places/route.ts`。
- 追加: `src/features/map/poi-layer.ts`、`src/features/places/PlacesPanel.tsx`、`scripts/prepare-pois.py`、`public/data/pois.osm.json`、単体・E2Eテスト。

## 取得フロー

地図中心 → `/api/places`（セッション・入力検証）→ PlaceService → PlaceProvider → OpenStreetMapProvider → Overpass → osmPlaces → normalizePlaceCategory/normalizeBrand → SemanticPlace → SQLite → 共通MapLibre地図。

地図移動時は500ms待って保存済みデータだけを参照する。「周辺の場所」→「この周辺を更新」で外部問い合わせ。初回はOverpassへの検索座標・半径送信を確認し、利用者ごとに承認を保存する。会話・訪問履歴を送らない。現在地ボタンで地図を移動した後も同じ仕組み。検索半径はUIで1km、契約では100〜1500m。

店舗はGeoJSONソースで描画し、ズーム15以下はクラスタ化する。丸いクラスタをタップすると拡大。カテゴリ別アイコンのタップと周辺一覧の選択は同じ詳細カードへ遷移する。描画上限は近い順600件。静的な出典表示は © OpenStreetMap contributors / ODbL-1.0。

## 正規化

- amenity=cafe → food / cafe / coffee_shop。
- amenity=fast_food + cuisine=burger → food / restaurant / burger_restaurant。
- shop=books → shopping / bookstore。未知のshopはretail、未知の施設はother。
- 用途タグをbuildingより優先。rawTagsは捨てず、normalizationVersion=1を保存。将来分類変更時は原タグから再計算できる。
- brand:wikidata があれば `wikidata:Q…`。既知別名をNFKC・大文字小文字・空白・一部記号の正規化で照合。Q38076（McDonald's）、Q37158（Starbucks）、Q26070（Uniqlo）。コメダ・無印良品の別名は内部ID、タグにWikidataがあればそちらを優先する。
- 店名からのブランド候補にはbrandIdを与えない。operatorをブランドに置換しない。ブランドの自動集計ではbrandMatchも確認する。
- 同じsource/type/idのみ重複排除。同じ座標の別店舗や別階を誤って統合しない。OSM内の異なる要素で二重登録された同一店舗は残る場合がある。

## 建物との関係

同梱buildingポリゴンと同じOSM要素ならsame_feature。nodeが一つだけの建物ポリゴン内にある場合はspatial_candidateとする。穴の内側・複数建物の重なりは除外。way/relationのbbox中心から店舗所属を推定しない。建物IDが共通の複数店舗を持てるが、テナントの網羅性を保証しない。

## キャッシュと制限

同じSQLiteの独立テーブルpoi_cache/poi_consentに保存。提供元・正規化版・0.002度グリッド・半径250m刻みをキーにする。検索漏れを減らすため外側200mも取得し、返却時は元の検索円で距離フィルタ。新鮮なキャッシュは1時間、障害時は最大7日古い結果を返す。保存上限200範囲。同時の同範囲要求は一本化、プロセス全体で一件ずつ・開始間隔30秒。失敗も間隔制限に含む。

Overpassは固定URL、タイムアウト18秒、応答上限4MB。失敗応答やremark付き部分応答は保存しない。新規範囲・期限切れ・障害時は同梱の2026-09-07取得OSMデータ（栄・大須と名古屋大学周辺の一部）を日付・注意文付きで使える。架空のPOIを追加しない。再抽出は `python scripts/prepare-pois.py`。

## Overture追加方法

`PlaceProvider.getPlacesAround` を実装したOvertureProviderを追加し、API組立てで注入する。併用なら提供元別のPlaceServiceを呼び結果を統合する。Overtureの取得基盤（地域抽出済みDB等）は未実装。

Source AdapterでgeometryのPointをlat/lng、names.primaryをname、brand.wikidataをbrandId、names/brand/addresses/websites/operating_statusを共通型とrawTagsへ保持する。`normalizePlaceCategory({source:'overture',basicCategory,taxonomy})` は基本カテゴリとtaxonomy階層を共通分類へ写す入口がある。元階層はsourceCategoryPathに保持し、アプリの3階層に無理に押し込まない。現在の対応語彙は限定的で、実データ導入時に辞書とテストを追加する。

参考: [Overture Places schema](https://docs.overturemaps.org/schema/reference/places/place/)、[Overpass QL](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL)。

## 未対応・精度の限界

営業時間・ブランド・階数はOSMに記載がある範囲のみ。営業時間は原表記で、営業中判定は行わない。建物の形状・所属判定は同梱範囲のみ。住宅の建物モデルは持つが、建物を一律に店舗POIとして登録しない。OSMの登録漏れ・閉店・異なる要素の二重登録はあり得る。同梱relationは抽出範囲のmemberから中心を求めるため境界付近で不完全な場合がある。

公開Overpassの応答や利用制限に依存する。大量ユーザー向けの分散レート制限・自前インスタンス・地域DBへの置換は未実装。Wikidataへの都度問い合わせは行わない。Overtureダウンロード、ユーザー投稿、訪問履歴との突合、嗜好分析への組込みは次段階。

## 検証
単体テスト、型検査、ビルド、モバイルE2Eで確認。2026-09-08のこの環境からのOverpass実通信はPOST/GETともHTTP 406で、オンライン取得成功は未確認。同梱OSMの表示と通信失敗時の継続利用を確認。
