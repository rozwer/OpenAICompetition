<!-- task-id: P-PLUGIN-STUDIO -->
# P-PLUGIN-STUDIO：隔離した追加機能を作成・公開し、画面と処理を組み替えられる

[共通受入](../common-acceptance.md)を適用する。完了は当日の操作・保存・再表示で判定する。

## 操作と結果

隔離環境で追加機能を作る → データ・画面・処理を組み替えて試す → 公開API/テンプレートとして渡す → 第三者の導入と境界の拒否を確認する。

## 依存と担当範囲

着手依存：P-EXTENSIONS
接続時の依存：
必要provider：
実AI受入：False

編集予定パス（当日作成する）：

- `future/fut09/`
- `future/fut10/`
- `future/fut17/`

## 読む契約

- `docs/spec/TASK_EXECUTION.md`

実装するoperation：
利用するoperation：
対応要件：EVAL-006, EXT-001, EXT-002, EXT-007, EXT-008, EXT-009, EXT-010, EXT-011, EXT-012, EXT-013, EXT-014, EXT-015, EXT-019, NEW-005, NEW-009

## 固有の受入条件

- 未実装の新計算が動き、無限loopは停止、検証後改変artifactは導入されない。workerだけで安全とはしない。
- 人物別タイムライン＋雨の日の条件filterを利用者が組み、既存記録を維持して戻せる。
- 当初4人以外が新入力/計算/表示を導入し再現できる。既存3テンプレ再設定と区別する。

## 同じ担当が実装・接続する内容

- FUT09：DSLで不可能な新関数をDevelopmentRequest→Codexが専用worktreeでTS生成→別に保持したtestで検証→artifact build/hash→networkなしの隔離process/container等で実行→JSON入出力のみhost反映。
- FUT10：screen schema/typed field binding/action DAG→既存機能を再配置→入力型と循環を検査→sample preview→definition版を保存→slotだけ差替→旧版戻し。
- FUT17：schema/SDK/examplesを別packageへ→GitHub Issueテンプレ/サンプル→第三者が未打合せで1拡張を作る→install→互換版/権利/manifest審査。

## 該当する再発防止

