# [FUT16] 聖地巡礼の出典・許諾・時間順の体験

| 項目 | 契約 |
|---|---|
| 優先度 / 種別 | P2 / future |
| 担当 | 未割当。claim成功者がこのIssueのみ担当する。人・OSで固定しない |
| 着手の必須依存 | EXT-007, DATA-001 |
| 接続時に必要な実装 | 個別契約と受入操作に従う |
| 共有契約 | v2.0.0 / API_CONTRACT.md / DB_SCHEMA.md / contracts/ports.ts |
| 編集ロック | `future/fut16/` |
| 規模の目安 | XL（時間・期限への換算をしない） |
| 推奨技能 | TypeScript。取得権の制限ではない |
| 元Issue追跡 | FUT16 |
| 対応要件 | EXT-006 |
| 状態 | 未着手。文書/契約でありアプリ実装済みではない |

## 完成させるもの

official/fan/communityの出典を分離→作品/scene/場所の対応証拠→公開可素材だけ→私有地/混雑配慮→順序/営業時間/移動時間検証→本人の写真/感想。

## APIと保存境界

HTTPを新設しない。必要な入力/出力は `contracts/domain.ts` のDTOと `contracts/ports.ts` のinterfaceを使う。

詳しい全field・null・enum・requiredは `../contracts/openapi.yaml`、SQL列/FK/indexは `../db/schema.sql`。名前を独自に短縮しない。nested JSONも `../contracts/schemas.json` の型で検証し、任意blobへ置換しない。

## 実装手順

1. `taskctl.py ready` で依存/ロックを確認し、このIDと全編集pathsを原子的にclaimする。成功tokenを控え、タスク専用branch/worktreeを作る。
2. 対応DTO・Portと例を読み、上記完成物を独立moduleとして実装する。未接続依存は明示fixtureかPort fakeを使い、別担当の機能を再実装しない。
3. official/fan/communityの出典を分離→作品/scene/場所の対応証拠→公開可素材だけ→私有地/混雑配慮→順序/営業時間/移動時間検証→本人の写真/感想。
4. APIを持つ場合は境界schema検証→scope確認→transaction内の正本保存→changed/invalidatedを返す。外部API/AI待機をDB transactionに入れない。純関数/UIはDBを直接触らない。
5. 次の受入操作を実行。接続待ちのmoduleは契約例を使った単体結果を記録し、live統合を済ませたとは書かない。
6. PR/commit、受入証拠、未接続箇所を付けてsubmit。統合者はmainで到達を確認してlandし、その時にlockを解放する。別タスクのロックを無断で解除しない。

## 受入操作

非公式対応を公式と表示せず、無許諾の作品画像を配布しない。

module完了と製品としての接続完了は別。`kind=integration/gate`以外の完了を通し体験の達成として数えない。

## 失敗・引継ぎ

依存未完成なら設計済みPortをfakeで置き換えて本Issueの範囲を完了させる。契約自体に欠落があれば、完成物を破壊せずCONTRACT_CHANGE.mdの手順で追加差分を作る。新ファイル/別moduleを直す必要が出たら追加pathsを全取得してから書く。共有ファイルの待ちで作業が止まる場合は、handoff noteとbranchを保存してreleaseし、別READYタスクを取る。

このpathは隔離PoC用。製品へ反映する変更対象は追加lockを全取得してから編集する。
