# P-AI：保存した根拠を使ってAIへ相談し、取消・回答・採否を再入場後も辿れる

[共通受入](../common-acceptance.md)を適用する。完了は当日の操作・保存・再表示で判定する。

## 操作と結果

記録の原文を指定して相談する → 実providerの待ち・取消を操作する → 質問へ回答し提案の採否を選ぶ → 保存する → 再入場で根拠と本人stateを辿る。

## 依存と担当範囲

着手依存：P-RECORD, P-ROUTE
接続時の依存：
必要provider：
実AI受入：True

編集予定パス（当日作成する）：

- `contracts/ai-prompt-task.ts`
- `contracts/ai-task-entry.ts`
- `contracts/entries.ts`
- `contracts/ports.ts`
- `docs/codex-evidence/`
- `docs/evidence/AI-010/`
- `docs/evidence/INT-016/`
- `docs/evidence/TEST-001/`
- `docs/learnings/LRN-AI-010.md`
- `docs/reuse/`
- `docs/spec/ENTRY_CONTRACT.md`
- `examples/ai-prompt-task.typecheck.ts`
- `server/ai/adapter/`
- `server/ai/prompts/compare.ts`
- `server/ai/prompts/diary.ts`
- `server/ai/prompts/discover.ts`
- `server/ai/prompts/extension.ts`
- `server/ai/prompts/extract.ts`
- `server/ai/prompts/recipe.ts`
- `server/ai/prompts/repair.ts`
- `server/features/ai/`
- `server/features/interpretations/`
- `server/features/meaning/entry.test.ts`
- `server/features/questions/`
- `server/index.ts`
- `server/integrations/int-003/`
- `server/integrations/int-016/`
- `shared/logic/graph/graph.test.ts`
- `shared/logic/meaning/meaning.test.ts`
- `src/app/`
- `src/features/ai/`
- `src/features/questions/`
- `src/integrations/int-003/`
- `src/integrations/int-016/`
- `tools/test_ai_prompt_task_contract.py`

## 読む契約

- `contracts/ai-prompt-task.ts`：AiPromptResolvedSource
- `contracts/ai-task-entry.ts`
- `contracts/domain.ts`：ApplyAiJobRequest, ApplyAiJobResponse, CancelAiJobRequest, CancelAiJobResponse, CreateAiJobRequest, CreateAiJobResponse, GetAiJobResponse, GetBootstrapResponse, GetEvidenceResponse, GetExperienceResponse, GetHealthResponse, ListExperienceQuestionsResponse, ListQuestionResponsesResponse, RespondToQuestionRequest, RespondToQuestionResponse, ReviewInterpretationRequest, ReviewInterpretationResponse
- `contracts/entries.ts`
- `contracts/operations.ts`：applyAiJob, cancelAiJob, createAiJob, getAiJob, getBootstrap, getEvidence, getExperience, getHealth, listExperienceQuestions, listQuestionResponses, respondToQuestion, reviewInterpretation
- `contracts/ports.ts`：AiPort, QuestionPort
- `docs/spec/ENTRY_CONTRACT.md`
- `docs/spec/QUESTION_FLOW.md`
- `docs/spec/TASK_EXECUTION.md`

実装するoperation：applyAiJob, cancelAiJob, createAiJob, getAiJob, listExperienceQuestions, listQuestionResponses, respondToQuestion, reviewInterpretation
利用するoperation：getBootstrap, getEvidence, getExperience, getHealth
対応要件：CORE-005, DATA-004, DATA-005, DATA-008, DATA-010, DATA-011, DATA-012, DISC-007, EVAL-003, EVAL-004, EXT-007, EXT-008, EXT-009, EXT-011, EXT-013, EXT-014, EXT-016, EXT-017, EXT-018, EXT-019, NAV-006, NAV-009, NEW-003, NEW-009, OPS-003, OPS-005, OPS-006, OPS-007, OPS-009, REC-002, REC-008, REC-009, SELF-002, SELF-008, SELF-012, SELF-014, SOC-010, TRF-001, TRF-002, TRF-004, TRF-005

## 固有の受入条件

- 実入力の変化で異なる検証済みoutput。ライブ失敗から別モデル/replayへ黙って切替しない。
- 取消後の遅着はapply不能。再起動running→interrupted。acceptでのみ正本へ作用。
- 非公開原文をコンテキストに入れない。
- 訪問していない場所や本人感情を事実として増やさない。
- 未知opをホストで実行しない。単位の意味変更を自動承認しない。
- 画面移動中に成功しても別対象へ自動適用しない。
- CODEX_AI_WORKDIR_ROOT等が不足しても本体は起動しAIをunavailable表示する。登録descriptorや環境変数の存在、過去receiptだけを稼働成功にせず、最小probeの費用/副作用、診断と実AI応答の証拠を分ける。秘密や本人原文をhealthへ出さない。
- IDだけをpromptへ渡さず、検証済み原文と必要Evidenceだけを渡す。余分/未知/別scopeの根拠IDを拒否する。
- 回答保存済みIDが次の実AI入力へ入り、answered/deferred/skippedが再入場で戻る。原文・用途は本人確認なしに上書きしない。
- prepare→認証確認→provider一回→current確認→decode。取消・古いscope・設定/認証/provider/出力異常を区別する。
- SDK/provider準備はAI-001/AI-010、ジョブ制御はAI-002を再利用する。live未確認なら保留し固定出力で完了にしない。
- 回答原文をtrimせず、回答とEvidenceを同一mutationへ一度保存する。deferred/skippedではEvidenceを作らない。同opIdの再送を再生し、別opIdの二重回答を409で拒否する。
- 送信中の追記草稿は成功時にも消さず、再入場で回収できる。settingsRevisionは既存bootstrapから取得し、無関係な設定UIを依存に加えない。
- 対象六エラーとRTE-001所有のgraph fixture一エラーが解消した状態で、該当Bun suiteの件数とmodule結果を記録し、標準product:checkがNodeとBunの両runnerを実行して成功する。Bun型検査だけをruntime成功として扱わない。
- 未実行機能をデモ済みとせず、秘密値を載せない。
- [リハーサル #185](https://github.com/rozwer/sodateru-map-rehearsal/issues/185): 既存の正式AiTaskEntryから既存の原文resolverとCodex SDK境界へ接続する。actor/namespace/revision・許可・原文/回答Evidenceの対応を検査し、必要な原文だけを渡す。自己循環・SDK二重実装を避け、取消・過去scope・provider/認証/設定/出力エラーを確認する。異なる原文による構造化実応答の差は既存証拠を照合し、不足するlive確認は保留指示のまま未完了にする。発見時の案A/Bを新規再実装の指示とはせず、現行の承認済み契約との差分だけを埋める。

## 同じ担当が実装・接続する内容

- AI-001：task+JSONSchema→Codex→構造化結果。専用workdir、認証状態、明示エラー。 v2.2のai-task descriptorをtask IDでdispatchできる入口を用意する。wellbeing未登録は明示未対応、既存taskは維持。
- AI-002：DBにjobを保存。外部待機はtransaction外。apply前にentity/grant/settings版を照合。 extract apply時の質問保存は注入されたQuestionPortを同じtransactionで呼ぶ。再抽出は許可されたquestionResponseIdsから原文を取得する。 健康由来jobのcreate/get/applyに注入可能な許可guardを設ける。health provider不在はその枝だけ閉じる。
- AI-004：許可済み投影のみ渡し、役割と順序と根拠を返す。
- AI-005：発見の一般知識/固有事実を分ける。日記は本人承認前の下書き。
- AI-006：既存opに制限した機能定義と列対応を構造化。未対応は明記する。
- AI-007：JobState componentをタスク画面へ埋め込む。選択scopeを固定表示。
- AI-010：AI adapterの未登録・設定不足・準備確認済み・実行失敗を診断Portで区別し、既存Health.aiへ現在の実行可否を安全側に投影する。OpenAPI/DBは変更しない。
- INT-016：保存済み原文に基づく用途提案と質問へ回答し、再入場後も根拠を辿れる
- TEST-001：Bun runtime分離済みrunnerを維持し、meaning・questionsの六つとgraph fixture一つの計七つの型エラーを型安全なfixtureとregistrationへ修正する。any・unknown cast、SQLite・idempotency・原文・scope受入の弱化、packageやrunnerの変更で代替しない。
- POOL-007：要求→差分→受入の実ログと、再利用できるDSL/投影/訂正契約を整理。

## 該当する再発防止

- R01：health/bootstrapは実catalogの能力を使用する。AIのprobe-ready、実task実行、INT receiptを区別し、未登録AIでも本体を起動する。 HTTPの既知errorは契約statusへ写し、JSON bodyはparameterの型変換と分離して非破壊で検査する。対向catalogのmanifest・wire IDも照合する。
  - 拒否例：fixture handler・古いbuild receipt・未設定AIをavailableへ上げない。 数値originalTextを文字列へ変換して受理せず、REVISION_CONFLICTを一律500へ変えない。
- R02：resolverで認可済み投影を解決し、共通adapterを一度実行する。task別builderは許可fieldとIDだけを使い、応答後のfreshness検査を通す。
  - 拒否例：別actor・余分Evidence・失効grant・根拠のないrepair列をmodel入力やapplyへ通さない。
- R03：採用SDKで非対応のuniqueItems等を登録時に明示拒否し、制約を黙って削らない。$refと隣接keywordを併用し、文字列長はUnicode code pointで検査する。
  - 拒否例：非対応schemaではSDK実行0回。$ref+maxLengthと補助平面文字を反例にし、型castや固定結果で不整合を隠さない。
- R04：C2の共通ケースを基盤で検証し、各UIは現在scope・request identity・abortを既存境界で照合する。 草稿保存を持つUIは、保存開始時のtext snapshotと成功時の最新draftが一致する場合だけclearし、待機中の追記は未送信のまま再入場後も選択・コピーできる。
  - 拒否例：A→B→A、reset、unmount後の旧応答を表示・保存しない。 保存待ち中に追記して成功させても新しい原文を消さない。遅着テストは旧Promiseが実際にresolveして処理を完了したことまで確認する。
- R06：原文保存と再送IDを実OpenAPI decoder・SQLiteで確認し、既送信草稿の再送identityを保つ。 注入なしの既定ID生成・cryptoなしfallback・復元草稿から作るrequestを製品のHTTP decoderへ通す。未送信の旧草稿移行と送信済み再試行を分ける。
  - 拒否例：失敗後再送の重複、別actor削除、原文欠落を拒否する。 型がstringであることや有効なIDを注入したfixtureだけをHTTP適合の証拠にしない。送信済みopIdを再入場時に振り直さない。
- R18：現在snapshotの列/単位previewを確認してから明示承認・実取込・再読込へ進む。
  - 拒否例：承認前のfacts更新、単位推測、失敗時の旧版破壊を拒否する。
- R21：apply直前に本人namespaceのsettings revision/ai_enabledを再読込する。停止は保存データ削除とは分ける。
  - 拒否例：全停止保存後に届いたAI結果をapplyしない。
- R27：標準runnerの収集とNode/Bunを明示分離し、テストworkerへ一時DBを注入する。file再open受入は残す。 提出するtestの命名・配置・環境指定が標準runnerの収集対象であることを確認し、独自configだけの成功を提出しない。
  - 拒否例：型cast、suite除外、常時直列化、既定DB事前削除で失敗を隠さない。
