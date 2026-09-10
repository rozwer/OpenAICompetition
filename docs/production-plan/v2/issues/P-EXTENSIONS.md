# P-EXTENSIONS：機能を生成・試用・修正して導入し、三つのテーマを実際に使える

[共通受入](../common-acceptance.md)を適用する。完了は当日の操作・保存・再表示で判定する。

## 操作と結果

ストアまたは生成から機能を選ぶ → 入力を変えて試す → 差分を確認して修正・導入する → host画面で防災・バイク・聖地巡礼を使う → 再入場で版と設定を確認する。

## 依存と担当範囲

着手依存：P-AI
接続時の依存：
必要provider：
実AI受入：True

編集予定パス（当日作成する）：

- `docs/evidence/INT-008/`
- `docs/evidence/INT-013/`
- `docs/evidence/INT-014/`
- `docs/evidence/INT-015/`
- `extensions/disaster/`
- `extensions/motorcycle/`
- `extensions/pilgrimage/`
- `fixtures/extension-cases/`
- `server/features/development/`
- `server/features/extensions/`
- `server/integrations/int-008/`
- `server/integrations/int-013/`
- `server/integrations/int-014/`
- `server/integrations/int-015/`
- `shared/logic/dsl/`
- `src/extension-host/`
- `src/features/development/`
- `src/features/extensions/`
- `src/integrations/int-008/`
- `src/integrations/int-013/`
- `src/integrations/int-014/`
- `src/integrations/int-015/`

## 読む契約

- `contracts/domain.ts`：CreateDevelopmentRequestRequest, CreateDevelopmentRequestResponse, CreateExtensionRequest, CreateExtensionResponse, CreateExtensionVersionRequest, CreateExtensionVersionResponse, GetDevelopmentRequestResponse, InstallExtensionRequest, InstallExtensionResponse, ListExtensionVersionsResponse, ListExtensionsResponse, ListInstallsResponse, PreviewExtensionRequest, PreviewExtensionResponse, RollbackInstallRequest, RollbackInstallResponse, RunExtensionRequest, RunExtensionResponse, UpdateInstallRequest, UpdateInstallResponse
- `contracts/operations.ts`：createDevelopmentRequest, createExtension, createExtensionVersion, getDevelopmentRequest, installExtension, listExtensionVersions, listExtensions, listInstalls, previewExtension, rollbackInstall, runExtension, updateInstall
- `docs/spec/ENTRY_CONTRACT.md`
- `docs/spec/TASK_EXECUTION.md`

実装するoperation：createDevelopmentRequest, createExtension, createExtensionVersion, getDevelopmentRequest, installExtension, listExtensionVersions, listExtensions, listInstalls, previewExtension, rollbackInstall, runExtension, updateInstall
利用するoperation：
対応要件：DATA-004, DATA-012, EVAL-006, EXT-001, EXT-002, EXT-003, EXT-004, EXT-005, EXT-006, EXT-007, EXT-008, EXT-009, EXT-010, EXT-011, EXT-014, EXT-015, EXT-019, NEW-006, NEW-009, OPS-005, OPS-009

## 固有の受入条件

- 同じ定義で入力を変えると計算が変わる。コード文字列をevalしない。
- 未検証版は導入不可。rollbackで定義を戻しても本人状態を失わない。
- ボタンがあるだけでなく、入力変更→preview差分→導入まで確認。
- 他機能のカードを壊さず無効化できる。
- サンプル規制変更で通行候補が変わる。安全保証として実演しない。
- 車種条件変更で候補か可否が変わる。実規制未取得はunknown。
- 滞在増で到着時刻/可否が変わる。許諾なし素材を混ぜない。
- 要求から新定義を生成。入力変更で結果が変わり、再読込後の導入版と状態が保持され、無効化と旧版復帰ができる。
- サンプルであることを表示し、入力→計算→DB保存→再表示→無効化が通る。AI生成は実行した場合だけ表示。
- 固定結果を返すだけの実装を検出できる。
- 出力契約に秘密値なし。ブラウザだけで本体改造済みと称さない。

## 同じ担当が実装・接続する内容

- EXT-001：有限opのデータflow実行。definition/入力を検証しoutputsを返す。
- EXT-002：定義、artifactHash、インストール、privateStateを別保存。preview→validated→install。
- EXT-003：要求文、preview入力、結果、版、導入を1導線にする。
- EXT-004：map/self/route slotへ導入版を表示。disable/rollback/失敗を局所処理。
- EXT-005：covered/障害/情報鮮度/unknownを入力に経路の確認・保留を計算。
- EXT-006：vehicleClass・通行規制・立寄条件をDSLへ入力。
- EXT-007：順序、滞在、締切、出典を入力して全行程を計算。
- INT-008：汎用DSLを実Codexで生成し、計算・保存・導入・無効化・rollbackまで接続する。三つのテーマ完成を待たない。
- INT-013：防災の定義を試用・導入して入力による計算差を実行する。他テーマやAI生成の完成を待たず、登録テンプレートとして使える。
- INT-014：バイクの定義を試用・導入して入力による計算差を実行する。他テーマやAI生成の完成を待たず、登録テンプレートとして使える。
- INT-015：聖地巡礼の定義を試用・導入して入力による計算差を実行する。他テーマやAI生成の完成を待たず、登録テンプレートとして使える。
- POOL-005：規制・排気量区分・滞在/締切を動かす入出力期待値を作る。
- DEV-001：requirement、許可paths、baseCommit、data clone-only、受入を出力。コード生成と区別。

## 該当する再発防止

- R17：hostのtyped bindingから既存RouteInputへ写す。出典・素材利用・立入り許可を分離し、入力差に応じて結果が変わる既存fixtureを使う。
  - 拒否例：未知車種・期限外規制を走行可にせず、任意property/SQL/evalや未知opで拡張しない。
- R27：標準runnerの収集とNode/Bunを明示分離し、テストworkerへ一時DBを注入する。file再open受入は残す。 提出するtestの命名・配置・環境指定が標準runnerの収集対象であることを確認し、独自configだけの成功を提出しない。
  - 拒否例：型cast、suite除外、常時直列化、既定DB事前削除で失敗を隠さない。
