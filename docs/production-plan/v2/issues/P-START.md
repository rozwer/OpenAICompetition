<!-- task-id: P-START -->
# P-START：準備を終え、同じ環境・契約・UI版から着手できる

[共通受入](../common-acceptance.md)を適用する。完了は当日の操作・保存・再表示で判定する。

## 操作と結果

新しいcloneを用意する → 固定環境を導入する → 同じUI版・契約版・地域入力を確認する → Mac/Windowsの取得・編集・通常merge・finishを再現する。

## 依存と担当範囲

着手依存：
接続時の依存：
必要provider：
実AI受入：False

編集予定パス（当日作成する）：

- `.codex/`
- `.env.example`
- `.githooks/`
- `.gitignore`
- `AGENTS.md`
- `docs/spec/API_ENDPOINTS.csv`
- `docs/spec/DB_COLUMNS.csv`
- `FULL_REQUIREMENT_MATRIX.csv`
- `ISSUE_BACKLOG.csv`
- `POOL_TASKS.csv`
- `README.md`
- `READY_TASKS.csv`
- `TASK_GRAPH.json`
- `bun.lock`
- `contracts/`
- `db/`
- `docs/`
- `examples/`
- `issues/`
- `mise.toml`
- `package.json`
- `scripts/`
- `tools/`

## 読む契約

- `docs/spec/ENTRY_CONTRACT.md`
- `docs/spec/TASK_EXECUTION.md`

実装するoperation：
利用するoperation：
対応要件：OPS-001

## 固有の受入条件

- 新規cloneで正本・移植資産・実装対象が分かる。旧アプリ・秘密値を持ち込んでいない。
- 新規cloneで依存導入と運用検査を実行できる。アプリ起動はFND-001で再確認する。
- 二つのcloneで二重取得・範囲外変更・未提出main統合を拒否し、通常の提出・統合・landを許可する。
- Issueの重複がなくTask IDを追跡できる。共有台帳は一度だけ初期化し、二人のREADY取得を確認する。
- 一方のclaimを保って未着手タスクの依存を変更できる。作業中の定義変更と循環は拒否される。
- 画面ID・共通見本・操作と保存結果を対応付ける。未受領のUIを完成扱いしない。
- 採用providerに必要な設定・取得手順・出典を明記し、Codexと地図と経路の成功/未接続を確認する。外部費用の自動有効化はしない。
- 実際の発見を仕様・Issue・受入へ反映した例を残し、完成品を新規cloneで確認する。
- Windowsでmise trust→mise install→mise exec -- bun install --frozen-lockfile→mise run hooks:install→mise run checkが成功する。個人のPYTHONUTF8設定とpython3.exeコピーに依存しない。登録コマンドの許可・拒否とモデル省略拒否を検査し、テスト0件を成功扱いしない。日本語・空白パスの二つの隔離clone/worktreeで二重取得・範囲外変更・未提出main統合を拒否し、claim/submit/merge/landを許可する。台帳state.jsonの名前・UTF-8内容・担当・token・履歴を保持する。OS上未実行の検査、Codexアプリ内の信頼登録・実発火はコマンド単体検査と区別して記録する。
- ペットimport/生成と健康データimport/native/集計/AI連携が独立着手可能な契約を持つ。元要件保持、型・schema・DAGの整合を検証する。製品実装の完了とはしない。
- 主cloneと新規作成した二つのlinked worktreeでhooks:installを実行し、各worktreeが実在する自身のhookを使い、他worktreeと共有configが変化しないことを確認する。新worktreeはmise trustとhook導入を経てtask:verifyへ到達し、branch/path guardの実発火を確認する。途中でtrustまたはhookが失敗したclaimは成功表示せず原子的にreleaseされ、再現手順と安全な復旧をlearningへ残す。
- Windows実操作でclaim・submit等の完了statusと所要を記録し、経過時間だけでabort、retry、lock削除をしない手順を確認する。管理者権限が必要なGitHub保護はAPI証拠を取得し、local guardとGitHub保護を混同しない。管理者証拠が未取得なら未完了として残し、権限待ちを記録しただけでは完了にしない。
- 旧helperとclosed/submittedからland/finishできる。同一clone・linked root・担当・現在receipt/token・develop到達性を検証し、別clone/主checkout/サブdirectory/別担当/不一致token/未mergeを拒否。再実行で台帳更新を重複させない。
- 版directoryを変更する場合は、旧版のlockで覆えると推測せず、新しい全pathを取得してから編集する。
- [リハーサル #220](https://github.com/rozwer/sodateru-map-rehearsal/issues/220): 裸のCODEX_OWNER=... prefixとprefixなしの正式mise task起動を、既存仕様・parserと照合する。必要な修正後も未所有path編集・develop直接書込みを拒否し、失敗claimを成功扱いしない。prefixなしの正規経路で既に取得できた証拠を保持する。
- [リハーサル #233](https://github.com/rozwer/sodateru-map-rehearsal/issues/233): DESTの親directoryが未存在なら、安全に親を用意して通常のclaim/trust/hooks/guardを完了するか、claim前に副作用なしで明示拒否する。親の有無の隔離テストと途中失敗時のbacklog復帰・receipt stage/reason・branch/destination残留を確認する。trustとbranch/per-worktree guardを迂回せず、toolingの推奨DESTを実装に合わせる。

## 同じ担当が実装・接続する内容

- PREP-001：仕様・契約・資産の初期移植を確認する。docs/team/competition-rehearsal.mdの対応項目に従う。
- PREP-002：導入環境と起動・検査の入口を整える。docs/team/competition-rehearsal.mdの対応項目に従う。
- PREP-003：タスク取得に適合するhooksを確認する。docs/team/competition-rehearsal.mdの対応項目に従う。
- PREP-004：Issue登録と共有台帳を開始する。docs/team/competition-rehearsal.mdの対応項目に従う。
- PREP-005：実行中の依存更新を整備する。docs/team/competition-rehearsal.mdの対応項目に従う。
- PREP-006：別セッションのUIを受領し画面契約へ接続する。docs/team/competition-rehearsal.mdの対応項目に従う。
- PREP-007：地域データと実接続の再現手順を整える。docs/team/competition-rehearsal.mdの対応項目に従う。
- PREP-008：知見反映と完成品確認を運用する。docs/team/competition-rehearsal.mdの対応項目に従う。
- PREP-009：WindowsのPowerShellから、同梱miseタスク・Gitフック・Codexフック起動コマンドを実行できるようにする。日本語・空白パス、Python実行名、UTF-8、台帳のCRLF変換、worktreeを検証する。Windows cloneの未push修正案768f9bfを引継ぎ元とし、取得baseへ適用して再検証する。Macの命名規則修復はPREP-003へ残す。現行mainのMac/POSIX向けコマンドを保持し、未統合のMac変更を実装済みとして扱わない。docs/team/tooling.mdとdocs/learnings/LRN-windows-hooks.mdへ再現手順・制限・証拠を残す。
- SPEC-001：利用者の追加依頼を、画面入口・型付き契約・API・DB・native/provider境界・権限・未接続動作・実装タスクとして定義する。既存157要件を保持する。
- OPS-001：hooks:installが実行中worktreeのconfig.worktreeだけを設定し、共有Git configや他worktreeの有効hook pathを上書きしないよう修正する。新linked worktree作成時のmise trust・hook導入・branch guardの順序も再現可能にし、失敗したclaimを成功扱いせずreleaseされた状態と理由を保持する。既存の担当/path guardを無効化しない。
- TOOL-001：OPS-001のhook isolation修正を再実装せず、Windowsで共有Git参照操作の無出力・時間超過を進行中、CAS競合、失敗に区別し、mise PATH継承とGitHub保護確認の再現・証拠・復旧境界を正本化する。
- OPS-LAND-MIGRATION：最新主checkoutのland/finishに対象linked worktreeを明示し、旧toolsやhookを変更せず終了できるようにする。

## 該当する再発防止

- R28：TASK_EXECUTIONとtoolingの一経路を使い、worktree-local hooks、pretrust、UTF-8 bytes、保存receipt、単一processの結果確認、最新helperによるfinishを継承する。親directory作成をCodexが実施する。 担当・Task ID・Issue・worktree・head・必要pathを一度で引き継ぎ、開始時に既知pathを全取得する。失敗した開始の復旧は保存receiptと単一processの最終結果を照合する。
  - 拒否例：失敗claim・CAS競合・他token・未merge・別cloneを成功にせず、時刻だけでlockやbranchを消さない。通常commit/push/finishの遠隔照合を残す。
- R29：受領UIと採用規則、素材/native/健康同意/実接続の前提を該当Issueへ置き、後続に口頭説明を残さない。
  - 拒否例：画像や契約だけで実装/利用者承認済みにせず、外部入力待ちを暗黙の機能削除へ変えない。
