<!-- task-id: P-NATIVE -->
# P-NATIVE：iPhoneで本人のHealthKit情報を読み、同じアプリの統計へ反映できる

[共通受入](../common-acceptance.md)を適用する。完了は当日の操作・保存・再表示で判定する。

## 操作と結果

iPhoneアプリを起動する → 本人sessionと端末を結び付ける → HealthKit読取りを許可する → 差分を取り込む → 再入場で統計とscope付きanchorを確認する。

## 依存と担当範囲

着手依存：P-HEALTH-CORE
接続時の依存：
必要provider：healthkit, private-data-session
実AI受入：False

編集予定パス（当日作成する）：

- `.env.example`
- `capacitor.config.ts`
- `docs/evidence/INT-021/`
- `docs/setup/healthkit.md`
- `native/ios/health/`
- `native/ios/shell/`
- `server/index.ts`
- `server/integrations/int-021/`
- `src/api/client.ts`
- `src/app/App.tsx`
- `src/client/platform/`
- `src/client/services/health-bridge/`
- `src/integrations/int-021/`

## 読む契約

- `contracts/ai-task-entry.ts`
- `contracts/companion-health.ts`：HealthBridgePort

実装するoperation：
利用するoperation：
対応要件：HLT-REQ-001, HLT-REQ-002, HLT-REQ-004, HLT-REQ-009, HLT-REQ-010

## 固有の受入条件

- 許可結果を過信せず、追加/削除とanchor再送を扱い、Webはunsupportedを返す。
- HealthKitを接続できるnative shellを作り、Web既存起動を維持。背景GPS全体を待たない。
- native/ios/healthのSwift 2ファイルをshell targetへ追加しSodateruHealthBridge plugin instanceを登録。capacitor://localhostからrelative /apiへ誤送信せず、固定の未確認hostを埋め込まずに明示base URL/TLS・本人認証・限定CORSまたは採用native transportを設定/再現し、実APIへ到達する。demo headerを本人認証と扱わず、無制限CORSを許可しない。実機で読取り→commit→anchor→再起動→追加/削除同期を確認。connectionIdがactor+namespace+paired deviceに一意で、別actor/namespace/deviceのanchor再利用を拒否し、再接続/削除後のanchor初期化を確認。本人session/端末bindingはHLT-009を使用する。requiredProviders=healthkit,private-data-session。XMLもAIも完成待ちにしない。

## 同じ担当が実装・接続する内容

- HLT-004：iOS HealthKitの読取りadapter。該当する機能仕様とentry登録形式に従う。
- NAT-001：Web UIを載せるiOS shellとnative service登録。該当する機能仕様とentry登録形式に従う。
- INT-021：iPhone HealthKitを取込み・統計へ接続。該当する機能仕様とentry登録形式に従う。

## 該当する再発防止

- R25：connectionIdをactor/namespace/paired deviceに一意に結び、INT-021でplugin target登録・API URL/TLS・本人認証・限定CORSまたはnative transportを接続する。
  - 拒否例：別scope/deviceのanchor再利用を拒否し、DB commit前にackしない。Xcode/署名/実機なしを完了にしない。
