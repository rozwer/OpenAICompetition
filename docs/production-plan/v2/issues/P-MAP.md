# P-MAP：場所を探し、地図・建物・人物を同じ座標と文脈で確認できる

[共通受入](../common-acceptance.md)を適用する。完了は当日の操作・保存・再表示で判定する。

## 操作と結果

地図を開く → 場所を検索する → 詳細と出典を確認する → 2D/3D・人物・レンズを切り替える → 同じ場所と文脈へ復帰する。

## 依存と担当範囲

着手依存：P-RUNTIME
接続時の依存：
必要provider：
実AI受入：False

編集予定パス（当日作成する）：

- `server/features/places/`
- `src/features/place/`
- `src/map/avatar/`
- `src/map/forms/`
- `src/map/host/`
- `src/map/materials/`
- `src/map/state/`

## 読む契約

- `contracts/domain.ts`：GetPlaceResponse, ListBuildingsResponse, ListPlacesResponse
- `contracts/map-ports.ts`：AvatarPort, FormsPort, MapDependencies, MapHostFactory, MapStatePort, Primitive
- `contracts/operations.ts`：getPlace, listBuildings, listPlaces
- `docs/spec/ENTRY_CONTRACT.md`
- `docs/spec/TASK_EXECUTION.md`

実装するoperation：getPlace, listBuildings, listPlaces
利用するoperation：
対応要件：CORE-003, EVAL-007, MAP-001, MAP-002, MAP-003, MAP-004, MAP-005, MAP-006, MAP-007, MAP-008, MAP-009, MAP-010, MAP-012, MAP-013, NAV-002, NAV-003, NAV-004, SOC-001, SOC-004, SOC-008

## 固有の受入条件

- 異なるqueryで候補が変わる。知らないfactsはunknown。
- 権限で見えない理由は空欄扱い。場所変更時に前店舗の理由が残らない。
- pan/zoom/回転して建物が同じ場所へ付く。背景不調は明示sampleへ手動移行。
- purposeのみ変えて本体が変わる。訪問増加では装飾だけ変わる。アイコン追加だけで済ませない。
- Replayを閉じると実位置へ戻る。実GPS未取得を取得済みと表示しない。
- peer→physical→mineで本人の造形とカメラが正しく復帰。
- 正面と俯瞰の両方で本・会話・庭が区別できる。

## 同じ担当が実装・接続する内容

- PLC-001：場所/建物をDBから検索。query/city/purpose/limit/cursorを検証。個人の意味をPlaceへ混ぜない。
- PLC-002：一般情報・自分の意味・共有意見を分離した詳細。手動記録・比較・移植へIDを渡す。
- MAP-001：MapLibre custom layerにThree sceneを接続。WGS84とlocal metersを変換。disposeとresizeを実装。
- MAP-002：FormsPort.build(meaning)からメートル単位の本体PrimitiveとMeaning.growthStage由来の装飾を返す。Three型を共有契約へ持ち込まない。
- MAP-003：livePositionとreplayPositionを別々に受ける人物。移動方向・停止を描画し地図座標を使う。
- MAP-004：dimensionとlens、camera2d/3dを独立reducerで保持。位置観測の有無を前提にしない。
- POOL-001：3形状の共通materialと可読性presetを作り、formsへpropsで渡す。

## 該当する再発防止

- R04：C2の共通ケースを基盤で検証し、各UIは現在scope・request identity・abortを既存境界で照合する。 草稿保存を持つUIは、保存開始時のtext snapshotと成功時の最新draftが一致する場合だけclearし、待機中の追記は未送信のまま再入場後も選択・コピーできる。
  - 拒否例：A→B→A、reset、unmount後の旧応答を表示・保存しない。 保存待ち中に追記して成功させても新しい原文を消さない。遅着テストは旧Promiseが実際にresolveして処理を完了したことまで確認する。
- R05：geometryごとY-up基底を変換する。造形はPrimitiveで返し、hostはlive/replay位置と実注入poseを所有する。
  - 拒否例：非等方box・cylinder・非zero回転で高さを照合し、unknown headingを測定値にしない。
