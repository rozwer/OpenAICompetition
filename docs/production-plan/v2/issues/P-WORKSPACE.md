<!-- task-id: P-WORKSPACE -->
# P-WORKSPACE：デモと本人設定を保存・再開・resetし、本人データを出力できる

[共通受入](../common-acceptance.md)を適用する。完了は当日の操作・保存・再表示で判定する。

## 操作と結果

デモを複製する → 停止・探索設定を保存する → 再開して同じ状態を読む → 本人JSONと除外理由を出力する → resetして旧行の消去とseedを確認する。

## 依存と担当範囲

着手依存：P-RUNTIME
接続時の依存：
必要provider：
実AI受入：False

編集予定パス（当日作成する）：

- `docs/spec/DB_COLUMNS.csv`
- `contracts/companion-health.ts`
- `contracts/domain.ts`
- `contracts/entries.ts`
- `contracts/openapi.json`
- `contracts/openapi.yaml`
- `contracts/operations.json`
- `contracts/operations.ts`
- `contracts/ports.ts`
- `contracts/schemas.json`
- `db/dto-map.json`
- `db/migrations/005_health-export-provenance.sql`
- `db/schema.sql`
- `docs/evidence/DEMO-001/`
- `docs/evidence/PREF-001/`
- `docs/evidence/PREF-002/`
- `docs/spec/API_CONTRACT.md`
- `docs/spec/ENTRY_CONTRACT.md`
- `docs/spec/HEALTH_INTEGRATION.md`
- `examples/http/exportOwnData.json`
- `server/ai/health-guards/`
- `server/features/demo/`
- `server/features/export/`
- `server/features/settings/`
- `server/index.ts`
- `src/app/`
- `src/features/demo/`
- `src/features/settings/`
- `tools/build_contracts.py`

## 読む契約

- `contracts/companion-health.ts`：ExportHealthGuardPort
- `contracts/domain.ts`：CloneDemoRequest, CloneDemoResponse, ExportOwnDataResponse, GetBootstrapResponse, GetSettingsResponse, ResetDemoRequest, ResetDemoResponse, UpdateSettingsRequest, UpdateSettingsResponse
- `contracts/entries.ts`
- `contracts/operations.ts`：cloneDemo, exportOwnData, getBootstrap, getSettings, resetDemo, updateSettings
- `contracts/ports.ts`：ApiPort, DbPort
- `db/schema.sql`
- `docs/spec/HEALTH_INTEGRATION.md`

実装するoperation：cloneDemo, exportOwnData, getSettings, resetDemo, updateSettings
利用するoperation：getBootstrap
対応要件：DATA-004, DATA-008, DATA-011, DISC-007, EVAL-008, HLT-REQ-007, HLT-REQ-008, NAV-009, OPS-008, REC-009, SELF-012

## 固有の受入条件

- actor、settings context、seedが揃って再mountできる。reset後は同一scopeでも再読込する。
- schemaのnamespace対象行をresetしseedだけ復元する。別namespaceは不変、変更通知は保持する。
- 409でも入力を失わず、停止後に遅れて返るAI結果を適用しない。
- 一般exportはPREF-002へ移管。設定APIを二重実装しない。
- 健康由来と判定不明は除外し、既知非健康を出力する。件数・機械可読理由・partialを表示する。
- namespace対象テーブルの出力/除外宣言に漏れがない。他者データを出さない。
- HLT guardの実接続なしでは完了不可。新namespaceへのimportはFUT02の独立操作として扱い、exportの完了条件に実装を追加しない。

## 同じ担当が実装・接続する内容

- DEMO-001：デモを複製・再開・リセットし、同じ領域で初期状態へ戻れる
- PREF-001：本人の停止・探索設定が保存され、次の操作にも効く
- PREF-002：本人JSONを出力し、除外と不完全な範囲を画面で確認できる

## 該当する再発防止

- R04：C2の共通ケースを基盤で検証し、各UIは現在scope・request identity・abortを既存境界で照合する。 草稿保存を持つUIは、保存開始時のtext snapshotと成功時の最新draftが一致する場合だけclearし、待機中の追記は未送信のまま再入場後も選択・コピーできる。
  - 拒否例：A→B→A、reset、unmount後の旧応答を表示・保存しない。 保存待ち中に追記して成功させても新しい原文を消さない。遅着テストは旧Promiseが実際にresolveして処理を完了したことまで確認する。
- R20：実在actorと設定contextをseedし、C3の表宣言・除外理由・同scope resetを操作として確認する。
  - 拒否例：原文/provenance表のreset漏れ、空actor、unknown health-derivedのexport混入を拒否する。
- R21：apply直前に本人namespaceのsettings revision/ai_enabledを再読込する。停止は保存データ削除とは分ける。
  - 拒否例：全停止保存後に届いたAI結果をapplyしない。
