<!-- task-id: P-HEALTH-CORE -->
# P-HEALTH-CORE：本人確認・健康の許可と集計をXML・HealthKit・AIから共通に使える

[共通受入](../common-acceptance.md)を適用する。完了は当日の操作・保存・再表示で判定する。

## 操作と結果

同じ本人領域のsession・端末bindingを解決する → 許可と保存を操作する → 日境界・欠測・出典を保って統計を読む → 別本人の利用と古いbindingを拒否する。XML入力、HealthKit plugin、AIの完成を待たない。

## 依存と担当範囲

着手依存：P-RUNTIME
接続時の依存：
必要provider：
実AI受入：False

編集予定パス（当日作成する）：

- `server/auth/private-data/`
- `server/features/health-data/`
- `server/features/health-summaries/`
- `shared/logic/health-aggregation/`
- `src/features/health/`

## 読む契約

- `contracts/ai-task-entry.ts`
- `contracts/companion-health.ts`：PrivateDataSessionPort
- `contracts/domain.ts`：BuildHealthSummaryRequest, BuildHealthSummaryResponse, CreateHealthConnectionRequest, CreateHealthConnectionResponse, GetHealthDataStateResponse, ImportHealthBatchRequest, ImportHealthBatchResponse, ListHealthSummariesResponse, PurgeHealthDataRequest, PurgeHealthDataResponse, PutHealthConsentRequest, PutHealthConsentResponse, RevokeHealthConsentRequest, RevokeHealthConsentResponse, UpdateHealthConnectionRequest, UpdateHealthConnectionResponse
- `contracts/operations.ts`：buildHealthSummary, createHealthConnection, getHealthDataState, importHealthBatch, listHealthSummaries, purgeHealthData, putHealthConsent, revokeHealthConsent, updateHealthConnection

実装するoperation：buildHealthSummary, createHealthConnection, getHealthDataState, importHealthBatch, listHealthSummaries, purgeHealthData, putHealthConsent, revokeHealthConsent, updateHealthConnection
利用するoperation：
対応要件：HLT-REQ-001, HLT-REQ-002, HLT-REQ-003, HLT-REQ-004, HLT-REQ-005, HLT-REQ-006, HLT-REQ-008, HLT-REQ-009, HLT-REQ-010

## 固有の受入条件

- 本人sessionと許可版を検査し、再送/更新/削除と派生失効を同じtransactionで処理。
- single-source-per-day-v1、DST、区間按分、睡眠和集合、欠測と0を反例で確認。
- S-HLT-01/02/03/05、情報源・未取得・同期日時・取消/削除を表示する。
- PrivateDataSessionPortで本人を解決し、demo header/他人scope/失効tokenの実データ操作を拒否。認証方式と接続設定をdocsへ残す。

## 同じ担当が実装・接続する内容

- HLT-002：健康データの許可・batch保存・失効・削除API。該当する機能仕様とentry登録形式に従う。
- HLT-003：情報源・日境界・欠測を扱う健康集計とAPI。該当する機能仕様とentry登録形式に従う。
- HLT-005：ヘルスケアの取込設定・同意・統計UI。該当する機能仕様とentry登録形式に従う。
- HLT-009：実健康データの本人session・端末binding adapter。該当する機能仕様とentry登録形式に従う。

## 該当する再発防止

- R24：本番のZIP内export.xmlはstream展開adapterと圧縮/展開上限を同じ操作の実装範囲に含める。batch進捗をUIへ渡す。
  - 拒否例：raw XML限定を本番ZIP受入の完了にせず、DTD方針を実Apple exportの構造で確認する。
- R25：connectionIdをactor/namespace/paired deviceに一意に結び、INT-021でplugin target登録・API URL/TLS・本人認証・限定CORSまたはnative transportを接続する。
  - 拒否例：別scope/deviceのanchor再利用を拒否し、DB commit前にackしない。Xcode/署名/実機なしを完了にしない。
