# 機能生成・導入・アプリ本体改造

## 1. 到達段階
| 段階 | 提供する価値 | 現在の実装経路 | 受入 |
|---|---|---|---|
| L0 有限DSL | 既存能力の組合せを自然文から作り、入力を変えて使う | AI-006 / EXT-001〜007 / INT-008 | 新definition→preview→validated→install→run→rollback |
| L1 画面/処理組替え | UI/データbinding/トリガーの配置を変える | FUT10 | schemaとcapabilityから組替え、本人state保持 |
| L2 本人AIへの開発依頼 | 環境・許可path・受入付き要求をexport | DEV-001 / FUT11 | 実コード生成/未生成を区別 |
| L3 新規コード拡張 | 現在ない計算を本当に生成して実行 | FUT09 | 別プロセス、型付き入出力、失敗局所化、旧版復帰 |
| L4 アプリ本体改造 | 別worktreeでUI/処理/必要schemaを変更 | FUT12 | DB複製でpreview、承認後切替、code/data復帰分離 |

L0の新しい定義と、L3の新しい演算実装は異なる。機能の説明文を出すだけで作成完了にしない。L4を削除せず、公開deployや汎用ストア完成を不必要な前提にしない。

## 2. v2の厳密なDSL
DslDefinition = schemaVersion:`dsl.v1` / inputs / steps / outputKeys / hostSlot。stepはid,op,inputKeys,outputKey。入力はnumber/boolean/stringの明示フォーム、入力名は重複禁止。出力keyはstepを通じ一意、後続stepからのみ参照できる。任意code、eval、URL fetch、SQL文字列、JS関数は受け付けない。

inputKeys/outputKeysで使える参照は `input.<key>`、`context.places`、`context.routeInput`、`context.passes`、`context.graphNodes`、`context.graphEdges`、`step.<outputKey>`。任意property pathや式文字列は不可。これらは固定名から型付き値へ解決する。循環・未来参照・未知key・入力型不一致をpreview前に拒否する。各stepの実行結果はDslValue（scalar/Place[]/ConstraintResult[]/RouteComputation/DslCard）。

| op | inputKeysの順・型 | 出力と意味 |
|---|---|---|
| filterCandidates | Place[], string(roleTag), boolean(requireCovered), boolean(requireSeats) | Place[]。roleTag一致（空文字は不問）。true条件はknown trueだけ採用。unknownを適合扱いしない |
| checkConstraints | RouteInput, RouteComputation, Place[], Pass[] | ConstraintResult[]。ConstraintPortへlegsを渡しhard/softを判定 |
| computeRoute | RouteInput, GraphNode[], GraphEdge[], Place[], Pass[] | RouteComputation。placeに最寄りgraphnodeを決定、mode/hardで許されるedgeをfilterして各区間をGraphPortで計算。滞在を加算。no-routeはvalidation errorであり成功空routeを返さない |
| sum | 1個以上のnumber | 合計。NaN/Infinity不可 |
| subtract | number, number | 前者−後者。負数も有効、余裕時間が負なら超過 |
| formatCard | string(title), scalarまたはtyped result, string(status:info/pass/fail/unknown) | DslCard。typed resultはhostの固定formatterで文章化。任意HTMLは生成しない |

hostはrun時点のrouteInput/places/passes/graphをschemaから渡す。inputに車種や締切がある場合は、templateに対応する**ホスト側のtyped binding**でRouteInputへ反映してからDSLを実行する。bindingそのものを生成テキストとしてevalしない。各テーマの入力名→DTO field対応は下表。利用者の入力が変わればbind後DTOも変わるので、定義だけ同じでも結果が変わる。

| Theme | 初期入力/binding | 真に変わる結果 | unknown/制限 |
|---|---|---|---|
| 防災 | requireCovered→hard.requireCovered、blocked edge集合/データsourceの更新、資料の鮮度 | 通れるgraphの候補・制約警告・保留 | 実災害での安全保証はしない。古い/不明は案内を保留 |
| バイク | vehicleClass→mode=motorcycleとhard.vehicleClass、通行規制edge | 選べる道路・到達可否 | 排気量/規制はprovider根拠がなければunknown |
| 聖地巡礼 | waypoints[].stayMinutes、ordered waypoints[].placeId、hard.arrivalDeadline | 総滞在＋移動、到着可否 | 固有作品素材/私有地アクセスを勝手に許可扱いしない |

上表の説明名は概念であり、厳密なfield名はRouteInput/HardConstraints/Waypointを使う。用意されていない災害細分条件はsourceのgraph adapterへtyped入力として持ち、DSLのopを追加せず既存graph Portへ正規化する。追加演算が必要ならDevelopmentRequestへ出す。

## 3. 定義・版・導入を分離
Extensionはストア項目、ExtensionVersionは不変definitionとartifactHash、ExtensionInstallはactorごとのactiveVersionId/previousVersionId/enabled/privateState、ExtensionRunは具体入力と出力。生成→draft、previewのschema/型/演算/可変入力確認→validated、本人installで有効化する。preview成功は安全な汎用code実行を証明しない。

同じversionを再導入して二重カードにしない。未検証versionは409/422。rollbackは前版の定義へ戻すが本人stateを削除しない。state型が不適合なら新version用のstateコピーを作り旧stateを保持し、互換なしを明示する。生成job完了だけでインストールを変更しない。

v2の実行hostはruntimeKind=dslのみ。runtimeKind=codeは将来用の予約で、code artifactと隔離プロトコルはFUT09で別versionの契約を追加する。現在のExtensionVersion.definitionを任意code格納先として流用せず、code指定はDEPENDENCY_UNAVAILABLE。

## 4. 情報更新・修復
SourceSnapshotにraw hash/format/parser版と正規化結果を保持する。列名変更は旧新の3行preview、単位や意味変更は別警告。RepairProposalはsnapshotIdと版を固定して本人承認後だけpublish。古いsnapshotへの提案を最新データへ流用しない。JSON/CSV/GeoJSONを初期対応、HTML/PDFはFUT13のadapter。未対応形式は501、架空のparse結果を返さない。

## 5. 新規コードと本体改造の実現仕様
DevelopmentRequestは要求、baseCommit、変更許可paths、受入操作、capability要求、dataはclone-only、生成物path、復帰条件を持つ。本人AIに渡す時はcredentialを含めない。現行appから要求書を作れることと、AIが変更を実施できることを別状態にする。

FUT09はtyped inputをstdin等で受ける別プロセスの演算プラグインから実証する。任意コードを現行serverやbrowserでevalしない。ファイル/ネットワーク/DB capabilityを初期は渡さず、必要な入力のコピーと結果だけを境界にする。失敗・停止・互換違反はそのpluginだけを無効化する。汎用的な隔離強度は公開前の追加課題として残す。

FUT12は別worktreeの変更を生成→依存lock→build→SQLiteの複製を使ったpreview→schema差分/データ損失検査→本人承認→artifact切替。現行実行中appと同じDBへ生成codeを試さない。code rollbackとdata restoreは独立操作で、旧codeに戻しても新schemaのDBが自動で戻るとは考えない。非可逆migrationはbackupと明示承認が必要。
