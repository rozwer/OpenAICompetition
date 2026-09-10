# 依存関係・編集ロックによるプル型実装

## 1. 4人を4本の直列レーンにしない
人は同時に複数Codexを監督してよい。**1 agent × 1 task × 1 branch/worktree**を基本単位とする。得意分野やMac/Windowsは助言であり、取得権ではない。既定assigneeは全件null。人が不在だからfeature全体が止まる状態を作らない。

着手条件は `status=backlog AND 全hard_dependenciesがdone AND 必要pathsと他claimが非重複`。提供済みv2.1契約が入力である。`connect_after` の実装は、型・fixture・Port fakeを使うmodule開発の着手条件ではない。local fixtureは画面で明示し、ライブ接続確認と混同しない。

取得順は effective_priority（下流のP0を開放するtaskもP0相当）→高優先度の依存を多く解放する→自分のcapability→小さく受入できる単位。P2/P3を取る前にP0/P1のREADYを確認する。全taskの完了待ちや全員の集合はしない。規模S/M/L/XLは分割の目安であり所要時間ではない。

## 2. 着手依存と接続依存の例

| Task | 単体で始めるために必要 | live接続で必要 | 待たずに進めるもの |
|---|---|---|---|
| MAP-002 建物本体 | v2 Meaning DTO | MAP-001・REC-005をINT-001で結合 | 形状、用途切替、再訪の装飾 |
| REC-003 訂正UI | CorrectExperienceRequest/Response | REC-004をINT-002で結合 | 元文、対象、入力、409の表示 |
| REC-004 訂正API | DbPortとDDL | FND-002をINT-002で使用 | validation、transaction callback、単体SQL |
| EXT-001 DSL | DslDefinition/DslPort | 経路/制約PortをINT-008で結合 | 参照検査、有限op、入力依存計算 |
| INT-001 記録と地図 | graphのhard依存がmainに存在 | 本物の保存を使用 | 依存完了と同時に任意の人が取得 |

統合タスクも無関係な地図造形の完成へ連鎖させない。例えばINT-003（AI実接続）とINT-010（日記/写真）は、共通基盤と対象moduleが揃えばINT-001の完了を待たず進める。

ソース生成の便宜だけで「まず全backend、その後全frontend」という依存を追加しない。反対に、統合・配備・実データ評価の実在する前提はhard依存にする。

## 3. 同時取得の競合を防ぐ正本
`TASK_GRAPH.json`は計画、`coord/task-board`のGit参照に保存したstateが実行中の正本。GitHubのassignee/labelは表示用のミラーにできるが、4人が同時にIssueを見て「空いている」と判断するだけでは排他にならない。

同梱 `tools/taskctl.py` はstateの旧commit OIDを指定した `--force-with-lease=<ref>:<expected>` によりcompare-and-swapする。[V2-S4] 取得対象は **coord/task-boardだけ**。mainをforce-pushしない。競合時は最新stateから再判定し、失敗を成功と見なさない。全pathsの取得は1更新で成功するか、何も取得しないかの二択。通信不能時は新規claimをしない。

ロックpathはrepo相対POSIX表記。末尾`/`のディレクトリは全子孫、末尾なしはそのファイルだけ。`src/map/`は`src/map/forms/book.ts`と競合するが、`src/map/forms/`と`src/map/avatar/`は競合しない。大きい親フォルダを気軽に取らない。Gitの別worktreeでも同じ将来merge対象のpathなら競合する。

`claimed`だけでなく`submitted`も編集ロックを保持する。PRがmainへ取り込まれ、そのcommitがmainから到達可能になったら`land`でdoneと解放を同時に更新する。提出した人は、別agent/worktreeで他の空きtaskを取れる。統合担当者を恒久固定しない。

## 4. 実行コマンド

最初に1人が共有repoに文書・契約・TASK_GRAPH・toolsを置き、通常のmain commitとして共有する。アプリ空repoでも契約はこの時点から読める。認証、既存資産利用許可は各チームの条件に従う。

```bash
# mainを同期した通常のcloneで一度だけ。既存boardは上書きしない。
python tools/taskctl.py init --manifest TASK_GRAPH.json
python tools/taskctl.py ready

# 4人の誰でも取得。出力のtokenとbase_commitを保存する。
python tools/taskctl.py claim REC-003 --actor person2-agentB
# 出力されたbase_commitから専用worktreeを作る（値は実際の出力で置換）。
git worktree add ../wt-rec003 -b task/REC-003 <base_commit>

# 必要な追加pathは書く前に原子的取得。失敗したら新pathに書かない。
python tools/taskctl.py add-lock REC-003 --token <token> --path src/integrations/rec-fix/
# task worktreeでcommit後。変更pathを検査して提出。
python tools/taskctl.py submit REC-003 --token <token> --commit HEAD --evidence '契約fixtureで訂正と409を確認'
# レビュアーが通常merge/fast-forwardしmainへpush後に実行。
python tools/taskctl.py land REC-003 --token <token> --main main
```

同梱helperの`land`はcommit到達性を検証するため、**通常mergeまたはfast-forwardを使い、squash mergeしない**。最初のclaim時baseから提出commitまでの変更pathを検査する。無関係なmainの更新をtask branchへmergeして差分を増やす前に、taskを提出し、統合側がmainでmergeする。追加修正が必要なら同じtokenで再submitできる。squash/rebaseした別commitを自動で同一視する機能は入れない。

## 5. lock解放・引継ぎ・停止

`release --token ... --note ...` は未完了で返す。branch/commit、動作したこと、残件をnoteに残す。hard依存は解放されない。`handoff --to ...` は同じtaskとpathを次のagentへ渡し、token世代を更新する。旧tokenでsubmit/land/releaseは失敗する。

止まったagentを時刻だけで自動解放しない。人が停止と未push作業を確認してから `recover TASK --confirm-stopped --note ...`。これもtoken世代を更新しbacklogへ戻す。ネットワーク分断で動いているagentがいる可能性を排除する前にロックを奪わない。helperは任意協調の仕組みであり、Git権限を持つ人の悪意あるpushを防ぐセキュリティ機構ではない。

追加pathが取れないまま互いに待つ場合は、同時に要求する全pathを洗い出し、片方がhandoff/releaseする。親pathを小分けにして担当を分離できるなら契約変更taskとして分割する。複数ロックを一つずつ待ち続ける方式を採らない。

## 6. 空きタスク
全taskが未割当poolだが、`POOL_TASKS.csv`の8件は特に独立して取得しやすい。建物material、空状態文言、根拠付き発見カード、移植例、拡張可変ケース、表示確認、Codex利用証拠、実演カード。単なる雑務ではなく受入と編集pathを持つ。POOL-006の画面確認に実画面がない場合は、fixture確認か別poolを選ぶ。実画面の修正は元ファイルのlockを追加取得する。

## 7. 統合と完了
moduleの受入は個別契約で成立するが、利用可能な製品機能として表示するのはINT taskでlive接続を確認してから。`capabilities`により未接続のボタンを操作可能にしない。P0のGATE-001は全P1を待たない。完成したP1枝は対応INTの証拠付きで追加する。UIの存在だけを機能数に算入しない。

コード排他、DBのtransaction、利用者の共有許可は別物。編集ロックを持っても本人データへの無制限アクセス権は得ない。SQLite transactionを短く保つことは開発timeboxではない。

共有Git参照が使えない場合は、1人の受付がclaim/releaseを直列に処理して台帳を返す手動運用へ明示切替する。複数人が独立にlabel更新する方式は代替にしない。GitHub Issue自体は同梱import scriptで作成可能だが、この納品では未登録。

## v2.1：統合と質問の分割

各moduleはENTRY_CONTRACT.mdに従う。収集可能なdescriptorを提供しただけでは利用可能にせず、対象buildの実接続receiptでintegration capabilityを解放する。INT-003/INT-008/INT-016はrequiresLiveAI=trueを宣言する。

INT-005/011/012は比較/移植/返信、INT-008/013/014/015は汎用生成導入/防災/バイク/聖地巡礼。それぞれが受入を満たせば使える。最後にT4/T5を通す確認は残すが、他の枝が未完成だから実接続済みの枝を一律に閉じない。

INT/GATEの未接続をfakeで完了にする指示は撤去した。使用データがsampleでもAPIとDBが本当に動いたならその範囲の実接続として記録できる。live AIを含む受入はreplayでは達成しない。
