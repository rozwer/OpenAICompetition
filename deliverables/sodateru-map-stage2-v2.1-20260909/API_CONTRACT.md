# HTTP API仕様 v2.1.0

OpenAPI 3.1.1形式を採用する。[V2-S3] 全field、required、null、enum、配列要素、path/query/headerは `contracts/openapi.yaml` が機械可読の正本。下表の名称だけから推測して実装しない。89操作は構想全体の契約であり、全endpointを一斉に完成させる要求ではない。未実装operationはcapabilityから除外し、呼出時は501 `DEPENDENCY_UNAVAILABLE`を返す。

## 1. HTTP境界
既定local API `http://127.0.0.1:8787`、ブラウザはVite proxy越し同一originで `/api/v1` を使う。public公開しない。GET health以外は `X-Namespace-Id: ns_demo` と `X-Actor-Id: actor_self` を要求する。ヘッダはローカルで対象を選ぶ仕組みであり認証ではない。serverは少なくともactorがnamespace内に存在すること、対象の所有/ShareGrantを検査する。公開時の認証はFUT01/02/18。

JSONの未知fieldは拒否する。JSON mutationは `{opId,payload}`、既存対象更新は `{opId,expectedRevision,payload}`。GETにbodyはない。DELETEも本版ではopIdとexpectedRevisionをJSON bodyに置く。body非対応の中間基盤を導入するなら新契約へ移行し、密かに省略しない。multipart uploadだけ同名form fields＋file。

IDはnamespace内で一意な識別子。サーバーがentity IDを生成し、clientは操作の `opId` を生成する。時刻はUTCのRFC3339文字列、日付はYYYY-MM-DD、元のzoneはtimeZoneへ。位置は `{longitude,latitude}`、GeoJSON座標配列は `[lng,lat]`。金額はJPY、時間はfield名にSeconds/Minutesを明記する。

## 2. 成功・失敗

```json
{"data":{},"meta":{"requestId":"req_example","namespaceId":"ns_demo","canonicalRevision":8,"nextCursor":null},"changed":[{"type":"Experience","id":"exp_example","revision":2,"action":"updated"}],"invalidated":["meaning:actor_self:place_a","hypotheses:actor_self"]}
```

上のdataは共通形の説明用。実際にはoperationごとのResponse schemaのdata型が必要。GETも同じenvelopeでchanged/invalidatedは空。asset/contentだけバイナリ。作成201、更新/計算結果200、AI開始202はOpenAPIの各operationに固定する。

| Status | error.code | 意味 / 次の動作 |
|---|---|---|
| 400 | VALIDATION_ERROR | JSON/形式/必須項目を直す |
| 403 | UNAUTHORIZED_SCOPE | actor/namespace/共有範囲が合わない |
| 404 | NOT_FOUND | 対象が存在しないか非公開 |
| 409 | REVISION_CONFLICT | 最新を読み、保持した草稿を再確認 |
| 409 | IDEMPOTENCY_CONFLICT | 同じopIdで別操作を送った。新規操作なら新ID |
| 409 | STALE_INPUT | preview/AIの参照元や権限が変化。再計算 |
| 413 | UPLOAD_TOO_LARGE | サイズを減らす |
| 422 | VALIDATION_ERROR | fieldErrorsに従って内容を修正 |
| 501 | DEPENDENCY_UNAVAILABLE | 未実装機能。固定成功に置換しない |
| 503 | PROVIDER_UNAVAILABLE / DB_BUSY | 草稿保持、明示再試行 |

エラーbodyは `ApiError` の厳密な型を使用する。独自文字列だけのレスポンスを返さない。内部例外/secret/生SQLをUIへ流さない。

## 3. 二重送信・競合・並列保存
request_dedupのキーは(namespaceId,actorId,opId)。method・正規化path・bodyをキー順canonical JSONにしてSHA-256を取り、同一opId/同一hashなら保存済みstatus/bodyを返す。二度目のtransaction、changed、revision増加は発生しない。hashが異なる場合409。handlerはmutate呼出前に現在の所有/共有可視性を確認し、権限失効後の古い保存済みbodyも無条件には返さない。正常commitだけを保存する。requestIdも初回のものを再返却する。

expectedRevisionは**対象entityのrevision**であり、namespace全体ではない。別placeの更新で無関係な体験の編集を失敗させない。SQLは `UPDATE ... WHERE namespace_id=? AND id=? AND revision=?`、変更件数0なら409。同時更新の片方が上書き消失しない。複数対象のpreviewではtargetごとのversionRefを固定し、全部一致した時だけ全件適用する。

同期処理はvalidate→scope→BEGIN IMMEDIATE→dedup照合→版照合→正本と関連行更新→namespace canonical_revision増分→change_events→dedup保存→COMMIT。[V2-S2] AI/外部検索中はtransactionを開かない。`db/mutation-reference.mjs`は境界の実行可能な参考実装であり各feature handlerではない。

## 4. ページと変更通知
list系はOpenAPIに定義されたfilter、`limit`、`cursor`だけを受理する。基本は(created_at,id)のkeyset昇順、cursorはその最後の組とfilter fingerprintをbase64url JSONにしたもの。改ざん耐性が必要な公開用署名は後続。フィルタが変わったcursorは400。nextCursor=nullで終端、空配列は有効。

changesはnamespace内のsequence昇順、cursorは最後のsequence。canonicalRevisionは意味/候補の入力版を表す。`invalidated`は `<projection>:<actorId>[:<entityId>]` のkeyで、意味・仮説・候補・履歴等の再取得を促す。UIはresponseに含まれるchanged対象を反映し、他画面の草稿や別namespaceのstateを消さない。通信のpoll間隔は実装上の設定であり作業時間割には使わない。

## 5. 記録・訂正・派生の契約
createExperienceはoriginalTextをEvidenceとして先に正本化し、Visit指定があればconfirmed Visit、Experienceを同一transactionで作成する。purpose/reason/context/preferenceは別field。観測から作ったcandidate Visitを通過だけでconfirmedにしない。

correctExperienceはtarget ExperienceのexpectedRevisionを照合し、originalEvidenceを更新せずCorrectionのbefore/afterを保存してcurrent fieldを更新する。field=reasonだけの変更なら用途と訪問回数が同じ限り建物本体/成長段階を変えない。派生の再計算は同じcandidate IDs・同じhard条件で説明差分を見せ、変わらなければ「変化なし」と表示する。

`scopeKind=context/global`はpreview APIで固定対象を見せ、別apply APIで参照版を照合してから適用する。本人の一言から暗黙に全記録へ適用しない。この複数対象スコープはFUT07の低優先度。

## 6. AI非同期と承認
AiInput/AiOutputはtaskで識別した7種のunion。extract / compare / recipe / discover / extension / diary / repair以外を実行しない。createAiJobで参照entity/grant/settings版とinputHashを保存し202を返す。workerがqueued→running→succeeded/failedへ更新。cancelはcanceled、再起動でrunningはinterrupted。状態はDBへ残す。

`apply`は成功jobであっても、現在のactor・scope・source権限・AI設定と各版を再確認する。変更があればstaleとして適用を拒否する。対象画面が変わっても暗黙の現在地へ適用しない。取消後の遅着やreset後の旧workerは「存在しstatus=runningの同じjob」を条件UPDATEし、レコードをupsertで復活させない。

| AI task | applyが作るもの | 正本への確定 |
|---|---|---|
| extract | proposed Interpretation | reviewInterpretationのacceptで本人承認。rejectでは正本不変 |
| compare | 根拠付きComparison | 許可投影のみ、対応否定はrejectMapping |
| recipe | Recipe草案 | 本人が役割/固定/可変を編集して採用 |
| discover | sourceを確認したDiscoveryCard | 本人操作だけをDiscoveryEvent/Interestへ |
| extension | draft ExtensionVersion | preview→validated→install、勝手に導入しない |
| diary | 未承認Diary草案 | updateDiaryによる本人承認 |
| repair | RepairProposal | approveRepairで現snapshot版を照合 |

apply済みjobにはappliedEntityIdsを保持し、別opIdで再applyされても同じ生成物を返し重複作成しない。AIが返したIDは入力scopeに含まれるものだけ参照可能。provider変更や固定結果への無断fallbackをしない。executionModeでlive/rule/replay等を区別する。

## 7. 共有・削除・asset・reset
相手の非公開原文/写真はserverのSharingPortで落とし、許可されたfieldだけSharedExperienceへ。GET原文・asset/content・export・AI入力にも同じ可視範囲を適用する。revoke後はgrantを参照した派生とAIを再検査し、本人が書いた感想は別所有として残す。

deleteExperienceはstatus=deleted、公開/派生対象から除外し、本人の削除対象に従って原文と関連AI保存textを消去する。必要な参照IDはtombstoneにするが、原文を残して「削除済み」と表示するだけにしない。他人が独立に記録した体験は消さない。アプリ外の既出exportまで回収できるとは表示しない。

画像uploadはmultipart（opId, file）、初期上限5MB、PNG/JPEG/WebPだけ。hash/content type/sizeをAssetへ、相対private保存pathをasset_storageへ。pathはAPI DTOに返さない。data/assets配下で保存し公開staticに置かない。バイナリ保存失敗ならDB行を確定しない。孤児ファイル回収は後続。

demo cloneは新namespace＋新entity IDでseedを複製する。resetはdemo namespaceだけ、expectedRevisionは現在canonicalRevision。canonicalRevision/変更sequenceを巻き戻さない。reset時は対象jobを取消/削除し旧結果をapplyできなくする。本人user namespaceや別demoは触らない。Settings/Preference/AppContextのsingletonはactor作成transactionで作り、GET時の暗黙作成をしない。

## 8. 全endpoint一覧
| Method / URI | operationId | Request → Response | 成功 | 実装task |
|---|---|---|---|---|
| GET /api/v1/health | getHealth | path/query/header → GetHealthResponse | 200 | FND-001 |
| GET /api/v1/bootstrap | getBootstrap | path/query/header → GetBootstrapResponse | 200 | UI-002 |
| GET /api/v1/settings | getSettings | path/query/header → GetSettingsResponse | 200 | PREF-001 |
| PATCH /api/v1/settings | updateSettings | UpdateSettingsRequest → UpdateSettingsResponse | 200 | PREF-001 |
| PUT /api/v1/context | putContext | PutContextRequest → PutContextResponse | 200 | UI-002 |
| GET /api/v1/places | listPlaces | path/query/header → ListPlacesResponse | 200 | PLC-001 |
| GET /api/v1/places/{placeId} | getPlace | path/query/header → GetPlaceResponse | 200 | PLC-001 |
| GET /api/v1/buildings | listBuildings | path/query/header → ListBuildingsResponse | 200 | PLC-001 |
| GET /api/v1/places/{placeId}/meaning | getMeaning | path/query/header → GetMeaningResponse | 200 | REC-005 |
| POST /api/v1/experiences | createExperience | CreateExperienceRequest → CreateExperienceResponse | 201 | REC-002 |
| GET /api/v1/experiences | listExperiences | path/query/header → ListExperiencesResponse | 200 | REC-002 |
| GET /api/v1/experiences/{experienceId} | getExperience | path/query/header → GetExperienceResponse | 200 | REC-002 |
| GET /api/v1/evidence/{evidenceId} | getEvidence | path/query/header → GetEvidenceResponse | 200 | REC-002 |
| POST /api/v1/experiences/{experienceId}/corrections | correctExperience | CorrectExperienceRequest → CorrectExperienceResponse | 200 | REC-004 |
| DELETE /api/v1/experiences/{experienceId} | deleteExperience | DeleteExperienceRequest → DeleteExperienceResponse | 200 | REC-002 |
| POST /api/v1/correction-previews | previewCorrections | PreviewCorrectionsRequest → PreviewCorrectionsResponse | 201 | FUT07 |
| POST /api/v1/correction-previews/{previewId}/apply | applyCorrections | ApplyCorrectionsRequest → ApplyCorrectionsResponse | 200 | FUT07 |
| POST /api/v1/observations/import | importObservations | ImportObservationsRequest → ImportObservationsResponse | 201 | REC-007 |
| GET /api/v1/visits | listVisits | path/query/header → ListVisitsResponse | 200 | REC-007 |
| PATCH /api/v1/visits/{visitId} | updateVisit | UpdateVisitRequest → UpdateVisitResponse | 200 | REC-007 |
| GET /api/v1/history | getHistory | path/query/header → GetHistoryResponse | 200 | SELF-003 |
| GET /api/v1/hypotheses | listHypotheses | path/query/header → ListHypothesesResponse | 200 | SELF-003 |
| PUT /api/v1/preferences | putPreference | PutPreferenceRequest → PutPreferenceResponse | 200 | SELF-003 |
| PATCH /api/v1/hypotheses/{hypothesisId} | reviewHypothesis | ReviewHypothesisRequest → ReviewHypothesisResponse | 200 | SELF-003 |
| POST /api/v1/diaries | createDiary | CreateDiaryRequest → CreateDiaryResponse | 201 | MEDIA-002 |
| GET /api/v1/diaries | listDiaries | path/query/header → ListDiariesResponse | 200 | MEDIA-002 |
| PATCH /api/v1/diaries/{diaryId} | updateDiary | UpdateDiaryRequest → UpdateDiaryResponse | 200 | MEDIA-002 |
| POST /api/v1/assets | uploadAsset | multipart → UploadAssetResponse | 201 | MEDIA-001 |
| GET /api/v1/assets/{assetId} | getAsset | path/query/header → GetAssetResponse | 200 | MEDIA-001 |
| GET /api/v1/assets/{assetId}/content | getAssetContent | path/query/header → binary | 200 | MEDIA-001 |
| GET /api/v1/export | exportOwnData | path/query/header → ExportOwnDataResponse | 200 | PREF-001 |
| POST /api/v1/candidate-sets | createCandidateSet | CreateCandidateSetRequest → CreateCandidateSetResponse | 201 | RTE-003 |
| GET /api/v1/candidate-sets/{candidateSetId} | getCandidateSet | path/query/header → GetCandidateSetResponse | 200 | RTE-003 |
| POST /api/v1/routes | planRoute | PlanRouteRequest → PlanRouteResponse | 201 | RTE-003 |
| GET /api/v1/routes/{routeId} | getRoute | path/query/header → GetRouteResponse | 200 | RTE-003 |
| PATCH /api/v1/routes/{routeId} | setRouteState | SetRouteStateRequest → SetRouteStateResponse | 200 | RTE-003 |
| POST /api/v1/quests | createQuest | CreateQuestRequest → CreateQuestResponse | 201 | RTE-003 |
| PATCH /api/v1/quests/{questId} | updateQuest | UpdateQuestRequest → UpdateQuestResponse | 200 | RTE-003 |
| GET /api/v1/passes | listPasses | path/query/header → ListPassesResponse | 200 | RTE-005 |
| POST /api/v1/passes | createPass | CreatePassRequest → CreatePassResponse | 201 | RTE-005 |
| PATCH /api/v1/passes/{passId} | updatePass | UpdatePassRequest → UpdatePassResponse | 200 | RTE-005 |
| DELETE /api/v1/passes/{passId} | deletePass | DeletePassRequest → DeletePassResponse | 200 | RTE-005 |
| GET /api/v1/shared-experiences | listSharedExperiences | path/query/header → ListSharedExperiencesResponse | 200 | SOC-002 |
| POST /api/v1/share-grants | createShareGrant | CreateShareGrantRequest → CreateShareGrantResponse | 201 | SOC-002 |
| POST /api/v1/share-grants/{grantId}/revoke | revokeShareGrant | RevokeShareGrantRequest → RevokeShareGrantResponse | 200 | SOC-002 |
| POST /api/v1/comparisons | createComparison | CreateComparisonRequest → CreateComparisonResponse | 201 | SOC-005 |
| GET /api/v1/comparisons/{comparisonId} | getComparison | path/query/header → GetComparisonResponse | 200 | SOC-005 |
| PATCH /api/v1/comparisons/{comparisonId} | rejectMapping | RejectMappingRequest → RejectMappingResponse | 200 | SOC-005 |
| POST /api/v1/recipes | createRecipe | CreateRecipeRequest → CreateRecipeResponse | 201 | TRF-001 |
| GET /api/v1/recipes/{recipeId} | getRecipe | path/query/header → GetRecipeResponse | 200 | TRF-001 |
| PATCH /api/v1/recipes/{recipeId} | updateRecipe | UpdateRecipeRequest → UpdateRecipeResponse | 200 | TRF-001 |
| POST /api/v1/transfers | planTransfer | PlanTransferRequest → PlanTransferResponse | 201 | TRF-003 |
| GET /api/v1/transfers/{transferId} | getTransfer | path/query/header → GetTransferResponse | 200 | TRF-003 |
| POST /api/v1/joint-plans | createJointPlan | CreateJointPlanRequest → CreateJointPlanResponse | 201 | SOC-007 |
| GET /api/v1/joint-plans/{jointPlanId} | getJointPlan | path/query/header → GetJointPlanResponse | 200 | SOC-007 |
| POST /api/v1/feedback | createFeedback | CreateFeedbackRequest → CreateFeedbackResponse | 201 | SOC-008 |
| GET /api/v1/feedback | listFeedback | path/query/header → ListFeedbackResponse | 200 | SOC-008 |
| POST /api/v1/discoveries | openDiscovery | OpenDiscoveryRequest → OpenDiscoveryResponse | 201 | DISC-003 |
| GET /api/v1/discoveries/{cardId} | getDiscovery | path/query/header → GetDiscoveryResponse | 200 | DISC-003 |
| POST /api/v1/discoveries/{cardId}/events | recordDiscoveryEvent | RecordDiscoveryEventRequest → RecordDiscoveryEventResponse | 201 | DISC-003 |
| GET /api/v1/interests | listInterests | path/query/header → ListInterestsResponse | 200 | DISC-003 |
| GET /api/v1/extensions | listExtensions | path/query/header → ListExtensionsResponse | 200 | EXT-002 |
| POST /api/v1/extensions | createExtension | CreateExtensionRequest → CreateExtensionResponse | 201 | EXT-002 |
| POST /api/v1/extensions/{extensionId}/versions | createExtensionVersion | CreateExtensionVersionRequest → CreateExtensionVersionResponse | 201 | EXT-002 |
| GET /api/v1/extensions/{extensionId}/versions | listExtensionVersions | path/query/header → ListExtensionVersionsResponse | 200 | EXT-002 |
| POST /api/v1/extension-versions/{versionId}/preview | previewExtension | PreviewExtensionRequest → PreviewExtensionResponse | 201 | EXT-002 |
| POST /api/v1/extension-installs | installExtension | InstallExtensionRequest → InstallExtensionResponse | 201 | EXT-002 |
| GET /api/v1/extension-installs | listInstalls | path/query/header → ListInstallsResponse | 200 | EXT-002 |
| PATCH /api/v1/extension-installs/{installId} | updateInstall | UpdateInstallRequest → UpdateInstallResponse | 200 | EXT-002 |
| POST /api/v1/extension-installs/{installId}/rollback | rollbackInstall | RollbackInstallRequest → RollbackInstallResponse | 200 | EXT-002 |
| POST /api/v1/extension-installs/{installId}/run | runExtension | RunExtensionRequest → RunExtensionResponse | 201 | EXT-002 |
| POST /api/v1/sources | createSource | CreateSourceRequest → CreateSourceResponse | 201 | DATA-002 |
| POST /api/v1/sources/{sourceId}/snapshots | createSnapshot | CreateSnapshotRequest → CreateSnapshotResponse | 201 | DATA-002 |
| POST /api/v1/repairs | createRepair | CreateRepairRequest → CreateRepairResponse | 201 | DATA-002 |
| GET /api/v1/repairs/{repairId} | getRepair | path/query/header → GetRepairResponse | 200 | DATA-002 |
| POST /api/v1/repairs/{repairId}/approve | approveRepair | ApproveRepairRequest → ApproveRepairResponse | 200 | DATA-002 |
| POST /api/v1/ai/jobs | createAiJob | CreateAiJobRequest → CreateAiJobResponse | 202 | AI-002 |
| GET /api/v1/ai/jobs/{jobId} | getAiJob | path/query/header → GetAiJobResponse | 200 | AI-002 |
| POST /api/v1/ai/jobs/{jobId}/cancel | cancelAiJob | CancelAiJobRequest → CancelAiJobResponse | 200 | AI-002 |
| POST /api/v1/ai/jobs/{jobId}/apply | applyAiJob | ApplyAiJobRequest → ApplyAiJobResponse | 200 | AI-002 |
| POST /api/v1/interpretations/{interpretationId}/review | reviewInterpretation | ReviewInterpretationRequest → ReviewInterpretationResponse | 200 | AI-002 |
| GET /api/v1/experiences/{experienceId}/questions | listExperienceQuestions | path/query/header → ListExperienceQuestionsResponse | 200 | AI-008 |
| GET /api/v1/experiences/{experienceId}/question-responses | listQuestionResponses | path/query/header → ListQuestionResponsesResponse | 200 | AI-008 |
| POST /api/v1/questions/{questionId}/responses | respondToQuestion | RespondToQuestionRequest → RespondToQuestionResponse | 200 | AI-008 |
| POST /api/v1/development-requests | createDevelopmentRequest | CreateDevelopmentRequestRequest → CreateDevelopmentRequestResponse | 201 | DEV-001 |
| GET /api/v1/development-requests/{requestId} | getDevelopmentRequest | path/query/header → GetDevelopmentRequestResponse | 200 | DEV-001 |
| POST /api/v1/demo/namespaces | cloneDemo | CloneDemoRequest → CloneDemoResponse | 201 | DEMO-001 |
| POST /api/v1/demo/reset | resetDemo | ResetDemoRequest → ResetDemoResponse | 201 | DEMO-001 |
| GET /api/v1/changes | getChanges | path/query/header → GetChangesResponse | 200 | FND-002 |

具体的field例は `examples/http/*.json`、連続操作例は `examples/record-flow.json`。endpointの実装taskは担当者ではなく取得可能なタスクIDである。API契約を分割してもDB全体の新規設計を各人にやり直させない。

## 9. Exportの復元境界
ExportBundleはnamespace/contextと参照先Place/Building/Extension定義も含む。本人以外のprivate entityは投影で除外する。Assetはメタデータでありバイナリそのものではない。端末外で写真まで復元する完全backupはFUT02でバイナリを同梱した別archiveを作る。JSON単体を完全な写真backupとは表示しない。

## v2.1：経路と任意の質問

RouteLegにedgeCoverage/edgeFacts/transit/passAssessmentsを追加した。ConstraintPortへ道中の情報を渡す。判定規約はROUTE_CONSTRAINT_FLOW.md。

extract inputはexperienceIdとquestionResponseIds、output.questionはQuestionProposalまたはnull。applyはQuestionPortを同じtransactionで呼ぶ。listExperienceQuestions/listQuestionResponses/respondToQuestionの保存・再送・版照合・スキップの規約はQUESTION_FLOW.md。質問回答は正本原文を上書きせず新Evidenceとして保存する。

API clientはOperationMapに従いpath/query/bodyを分離。opIdは論理操作の開始で生成して再送では保持し、expectedRevisionは編集開始時の対象版を使う。再送時に最新revisionへ黙って差し替えない。
