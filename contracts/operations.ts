// Generated from OpenAPI. Operation ID determines path/query/body/response.
import type * as D from "./domain";
export interface OperationMap {
  "getHealth": { request: { path?: never; query?: never; body?: never }; response: D.GetHealthResponse; successStatus: 200 };
  "getBootstrap": { request: { path?: never; query?: never; body?: never }; response: D.GetBootstrapResponse; successStatus: 200 };
  "getSettings": { request: { path?: never; query?: never; body?: never }; response: D.GetSettingsResponse; successStatus: 200 };
  "updateSettings": { request: { path?: never; query?: never; body: D.UpdateSettingsRequest }; response: D.UpdateSettingsResponse; successStatus: 200 };
  "putContext": { request: { path?: never; query?: never; body: D.PutContextRequest }; response: D.PutContextResponse; successStatus: 200 };
  "listPlaces": { request: { path?: never; query?: {
  "query"?: string;
  "cityId"?: D.Id;
  "purpose"?: string;
  "cursor"?: string;
  "limit"?: number;
}; body?: never }; response: D.ListPlacesResponse; successStatus: 200 };
  "getPlace": { request: { path: {
  "placeId": D.Id;
}; query?: never; body?: never }; response: D.GetPlaceResponse; successStatus: 200 };
  "listBuildings": { request: { path?: never; query?: {
  "cityId"?: D.Id;
}; body?: never }; response: D.ListBuildingsResponse; successStatus: 200 };
  "getMeaning": { request: { path: {
  "placeId": D.Id;
}; query?: {
  "peerId"?: D.Id;
}; body?: never }; response: D.GetMeaningResponse; successStatus: 200 };
  "createExperience": { request: { path?: never; query?: never; body: D.CreateExperienceRequest }; response: D.CreateExperienceResponse; successStatus: 201 };
  "listExperiences": { request: { path?: never; query?: {
  "placeId"?: D.Id;
  "cursor"?: string;
  "limit"?: number;
}; body?: never }; response: D.ListExperiencesResponse; successStatus: 200 };
  "getExperience": { request: { path: {
  "experienceId": D.Id;
}; query?: never; body?: never }; response: D.GetExperienceResponse; successStatus: 200 };
  "deleteExperience": { request: { path: {
  "experienceId": D.Id;
}; query?: never; body: D.DeleteExperienceRequest }; response: D.DeleteExperienceResponse; successStatus: 200 };
  "getEvidence": { request: { path: {
  "evidenceId": D.Id;
}; query?: never; body?: never }; response: D.GetEvidenceResponse; successStatus: 200 };
  "correctExperience": { request: { path: {
  "experienceId": D.Id;
}; query?: never; body: D.CorrectExperienceRequest }; response: D.CorrectExperienceResponse; successStatus: 200 };
  "previewCorrections": { request: { path?: never; query?: never; body: D.PreviewCorrectionsRequest }; response: D.PreviewCorrectionsResponse; successStatus: 201 };
  "applyCorrections": { request: { path: {
  "previewId": D.Id;
}; query?: never; body: D.ApplyCorrectionsRequest }; response: D.ApplyCorrectionsResponse; successStatus: 200 };
  "importObservations": { request: { path?: never; query?: never; body: D.ImportObservationsRequest }; response: D.ImportObservationsResponse; successStatus: 201 };
  "listVisits": { request: { path?: never; query?: {
  "status"?: "candidate" | "confirmed" | "rejected";
  "cursor"?: string;
  "limit"?: number;
}; body?: never }; response: D.ListVisitsResponse; successStatus: 200 };
  "updateVisit": { request: { path: {
  "visitId": D.Id;
}; query?: never; body: D.UpdateVisitRequest }; response: D.UpdateVisitResponse; successStatus: 200 };
  "getHistory": { request: { path?: never; query?: {
  "from"?: string;
  "to"?: string;
}; body?: never }; response: D.GetHistoryResponse; successStatus: 200 };
  "listHypotheses": { request: { path?: never; query?: never; body?: never }; response: D.ListHypothesesResponse; successStatus: 200 };
  "putPreference": { request: { path?: never; query?: never; body: D.PutPreferenceRequest }; response: D.PutPreferenceResponse; successStatus: 200 };
  "reviewHypothesis": { request: { path: {
  "hypothesisId": D.Id;
}; query?: never; body: D.ReviewHypothesisRequest }; response: D.ReviewHypothesisResponse; successStatus: 200 };
  "createDiary": { request: { path?: never; query?: never; body: D.CreateDiaryRequest }; response: D.CreateDiaryResponse; successStatus: 201 };
  "listDiaries": { request: { path?: never; query?: never; body?: never }; response: D.ListDiariesResponse; successStatus: 200 };
  "updateDiary": { request: { path: {
  "diaryId": D.Id;
}; query?: never; body: D.UpdateDiaryRequest }; response: D.UpdateDiaryResponse; successStatus: 200 };
  "uploadAsset": { request: { path?: never; query?: never; body: {opId: D.Id; file: Blob} }; response: D.UploadAssetResponse; successStatus: 201 };
  "getAsset": { request: { path: {
  "assetId": D.Id;
}; query?: never; body?: never }; response: D.GetAssetResponse; successStatus: 200 };
  "getAssetContent": { request: { path: {
  "assetId": D.Id;
}; query?: never; body?: never }; response: Uint8Array; successStatus: 200 };
  "exportOwnData": { request: { path?: never; query?: never; body?: never }; response: D.ExportOwnDataResponse; successStatus: 200 };
  "createCandidateSet": { request: { path?: never; query?: never; body: D.CreateCandidateSetRequest }; response: D.CreateCandidateSetResponse; successStatus: 201 };
  "getCandidateSet": { request: { path: {
  "candidateSetId": D.Id;
}; query?: never; body?: never }; response: D.GetCandidateSetResponse; successStatus: 200 };
  "planRoute": { request: { path?: never; query?: never; body: D.PlanRouteRequest }; response: D.PlanRouteResponse; successStatus: 201 };
  "getRoute": { request: { path: {
  "routeId": D.Id;
}; query?: never; body?: never }; response: D.GetRouteResponse; successStatus: 200 };
  "setRouteState": { request: { path: {
  "routeId": D.Id;
}; query?: never; body: D.SetRouteStateRequest }; response: D.SetRouteStateResponse; successStatus: 200 };
  "createQuest": { request: { path?: never; query?: never; body: D.CreateQuestRequest }; response: D.CreateQuestResponse; successStatus: 201 };
  "updateQuest": { request: { path: {
  "questId": D.Id;
}; query?: never; body: D.UpdateQuestRequest }; response: D.UpdateQuestResponse; successStatus: 200 };
  "listPasses": { request: { path?: never; query?: never; body?: never }; response: D.ListPassesResponse; successStatus: 200 };
  "createPass": { request: { path?: never; query?: never; body: D.CreatePassRequest }; response: D.CreatePassResponse; successStatus: 201 };
  "updatePass": { request: { path: {
  "passId": D.Id;
}; query?: never; body: D.UpdatePassRequest }; response: D.UpdatePassResponse; successStatus: 200 };
  "deletePass": { request: { path: {
  "passId": D.Id;
}; query?: never; body: D.DeletePassRequest }; response: D.DeletePassResponse; successStatus: 200 };
  "listSharedExperiences": { request: { path?: never; query?: {
  "query"?: string;
  "peerId"?: D.Id;
  "placeId"?: D.Id;
}; body?: never }; response: D.ListSharedExperiencesResponse; successStatus: 200 };
  "createShareGrant": { request: { path?: never; query?: never; body: D.CreateShareGrantRequest }; response: D.CreateShareGrantResponse; successStatus: 201 };
  "revokeShareGrant": { request: { path: {
  "grantId": D.Id;
}; query?: never; body: D.RevokeShareGrantRequest }; response: D.RevokeShareGrantResponse; successStatus: 200 };
  "createComparison": { request: { path?: never; query?: never; body: D.CreateComparisonRequest }; response: D.CreateComparisonResponse; successStatus: 201 };
  "getComparison": { request: { path: {
  "comparisonId": D.Id;
}; query?: never; body?: never }; response: D.GetComparisonResponse; successStatus: 200 };
  "rejectMapping": { request: { path: {
  "comparisonId": D.Id;
}; query?: never; body: D.RejectMappingRequest }; response: D.RejectMappingResponse; successStatus: 200 };
  "createRecipe": { request: { path?: never; query?: never; body: D.CreateRecipeRequest }; response: D.CreateRecipeResponse; successStatus: 201 };
  "getRecipe": { request: { path: {
  "recipeId": D.Id;
}; query?: never; body?: never }; response: D.GetRecipeResponse; successStatus: 200 };
  "updateRecipe": { request: { path: {
  "recipeId": D.Id;
}; query?: never; body: D.UpdateRecipeRequest }; response: D.UpdateRecipeResponse; successStatus: 200 };
  "planTransfer": { request: { path?: never; query?: never; body: D.PlanTransferRequest }; response: D.PlanTransferResponse; successStatus: 201 };
  "getTransfer": { request: { path: {
  "transferId": D.Id;
}; query?: never; body?: never }; response: D.GetTransferResponse; successStatus: 200 };
  "createJointPlan": { request: { path?: never; query?: never; body: D.CreateJointPlanRequest }; response: D.CreateJointPlanResponse; successStatus: 201 };
  "getJointPlan": { request: { path: {
  "jointPlanId": D.Id;
}; query?: never; body?: never }; response: D.GetJointPlanResponse; successStatus: 200 };
  "createFeedback": { request: { path?: never; query?: never; body: D.CreateFeedbackRequest }; response: D.CreateFeedbackResponse; successStatus: 201 };
  "listFeedback": { request: { path?: never; query?: never; body?: never }; response: D.ListFeedbackResponse; successStatus: 200 };
  "openDiscovery": { request: { path?: never; query?: never; body: D.OpenDiscoveryRequest }; response: D.OpenDiscoveryResponse; successStatus: 201 };
  "getDiscovery": { request: { path: {
  "cardId": D.Id;
}; query?: never; body?: never }; response: D.GetDiscoveryResponse; successStatus: 200 };
  "recordDiscoveryEvent": { request: { path: {
  "cardId": D.Id;
}; query?: never; body: D.RecordDiscoveryEventRequest }; response: D.RecordDiscoveryEventResponse; successStatus: 201 };
  "listInterests": { request: { path?: never; query?: never; body?: never }; response: D.ListInterestsResponse; successStatus: 200 };
  "listExtensions": { request: { path?: never; query?: never; body?: never }; response: D.ListExtensionsResponse; successStatus: 200 };
  "createExtension": { request: { path?: never; query?: never; body: D.CreateExtensionRequest }; response: D.CreateExtensionResponse; successStatus: 201 };
  "createExtensionVersion": { request: { path: {
  "extensionId": D.Id;
}; query?: never; body: D.CreateExtensionVersionRequest }; response: D.CreateExtensionVersionResponse; successStatus: 201 };
  "listExtensionVersions": { request: { path: {
  "extensionId": D.Id;
}; query?: never; body?: never }; response: D.ListExtensionVersionsResponse; successStatus: 200 };
  "previewExtension": { request: { path: {
  "versionId": D.Id;
}; query?: never; body: D.PreviewExtensionRequest }; response: D.PreviewExtensionResponse; successStatus: 201 };
  "installExtension": { request: { path?: never; query?: never; body: D.InstallExtensionRequest }; response: D.InstallExtensionResponse; successStatus: 201 };
  "listInstalls": { request: { path?: never; query?: never; body?: never }; response: D.ListInstallsResponse; successStatus: 200 };
  "updateInstall": { request: { path: {
  "installId": D.Id;
}; query?: never; body: D.UpdateInstallRequest }; response: D.UpdateInstallResponse; successStatus: 200 };
  "rollbackInstall": { request: { path: {
  "installId": D.Id;
}; query?: never; body: D.RollbackInstallRequest }; response: D.RollbackInstallResponse; successStatus: 200 };
  "runExtension": { request: { path: {
  "installId": D.Id;
}; query?: never; body: D.RunExtensionRequest }; response: D.RunExtensionResponse; successStatus: 201 };
  "createSource": { request: { path?: never; query?: never; body: D.CreateSourceRequest }; response: D.CreateSourceResponse; successStatus: 201 };
  "createSnapshot": { request: { path: {
  "sourceId": D.Id;
}; query?: never; body: D.CreateSnapshotRequest }; response: D.CreateSnapshotResponse; successStatus: 201 };
  "createRepair": { request: { path?: never; query?: never; body: D.CreateRepairRequest }; response: D.CreateRepairResponse; successStatus: 201 };
  "getRepair": { request: { path: {
  "repairId": D.Id;
}; query?: never; body?: never }; response: D.GetRepairResponse; successStatus: 200 };
  "approveRepair": { request: { path: {
  "repairId": D.Id;
}; query?: never; body: D.ApproveRepairRequest }; response: D.ApproveRepairResponse; successStatus: 200 };
  "createAiJob": { request: { path?: never; query?: never; body: D.CreateAiJobRequest }; response: D.CreateAiJobResponse; successStatus: 202 };
  "getAiJob": { request: { path: {
  "jobId": D.Id;
}; query?: never; body?: never }; response: D.GetAiJobResponse; successStatus: 200 };
  "cancelAiJob": { request: { path: {
  "jobId": D.Id;
}; query?: never; body: D.CancelAiJobRequest }; response: D.CancelAiJobResponse; successStatus: 200 };
  "applyAiJob": { request: { path: {
  "jobId": D.Id;
}; query?: never; body: D.ApplyAiJobRequest }; response: D.ApplyAiJobResponse; successStatus: 200 };
  "reviewInterpretation": { request: { path: {
  "interpretationId": D.Id;
}; query?: never; body: D.ReviewInterpretationRequest }; response: D.ReviewInterpretationResponse; successStatus: 200 };
  "listExperienceQuestions": { request: { path: {
  "experienceId": D.Id;
}; query?: never; body?: never }; response: D.ListExperienceQuestionsResponse; successStatus: 200 };
  "listQuestionResponses": { request: { path: {
  "experienceId": D.Id;
}; query?: never; body?: never }; response: D.ListQuestionResponsesResponse; successStatus: 200 };
  "respondToQuestion": { request: { path: {
  "questionId": D.Id;
}; query?: never; body: D.RespondToQuestionRequest }; response: D.RespondToQuestionResponse; successStatus: 200 };
  "createDevelopmentRequest": { request: { path?: never; query?: never; body: D.CreateDevelopmentRequestRequest }; response: D.CreateDevelopmentRequestResponse; successStatus: 201 };
  "getDevelopmentRequest": { request: { path: {
  "requestId": D.Id;
}; query?: never; body?: never }; response: D.GetDevelopmentRequestResponse; successStatus: 200 };
  "cloneDemo": { request: { path?: never; query?: never; body: D.CloneDemoRequest }; response: D.CloneDemoResponse; successStatus: 201 };
  "resetDemo": { request: { path?: never; query?: never; body: D.ResetDemoRequest }; response: D.ResetDemoResponse; successStatus: 201 };
  "getChanges": { request: { path?: never; query?: {
  "after"?: number;
  "limit"?: number;
}; body?: never }; response: D.GetChangesResponse; successStatus: 200 };
  "listPets": { request: { path?: never; query?: never; body?: never }; response: D.ListPetsResponse; successStatus: 200 };
  "importPet": { request: { path?: never; query?: never; body: D.ImportPetRequest }; response: D.ImportPetResponse; successStatus: 201 };
  "getPet": { request: { path: {
  "petId": D.Id;
}; query?: never; body?: never }; response: D.GetPetResponse; successStatus: 200 };
  "deletePet": { request: { path: {
  "petId": D.Id;
}; query?: never; body: D.DeletePetRequest }; response: D.DeletePetResponse; successStatus: 200 };
  "exportPet": { request: { path: {
  "petId": D.Id;
}; query?: never; body?: never }; response: D.ExportPetResponse; successStatus: 200 };
  "getCompanionProfile": { request: { path?: never; query?: never; body?: never }; response: D.GetCompanionProfileResponse; successStatus: 200 };
  "putCompanionProfile": { request: { path?: never; query?: never; body: D.PutCompanionProfileRequest }; response: D.PutCompanionProfileResponse; successStatus: 200 };
  "listPetGenerationProviders": { request: { path?: never; query?: never; body?: never }; response: D.ListPetGenerationProvidersResponse; successStatus: 200 };
  "createPetGeneration": { request: { path?: never; query?: never; body: D.CreatePetGenerationRequest }; response: D.CreatePetGenerationResponse; successStatus: 202 };
  "getPetGeneration": { request: { path: {
  "generationId": D.Id;
}; query?: never; body?: never }; response: D.GetPetGenerationResponse; successStatus: 200 };
  "cancelPetGeneration": { request: { path: {
  "generationId": D.Id;
}; query?: never; body: D.CancelPetGenerationRequest }; response: D.CancelPetGenerationResponse; successStatus: 200 };
  "reviewPetGeneration": { request: { path: {
  "generationId": D.Id;
}; query?: never; body: D.ReviewPetGenerationRequest }; response: D.ReviewPetGenerationResponse; successStatus: 200 };
  "getHealthDataState": { request: { path?: never; query?: never; body?: never }; response: D.GetHealthDataStateResponse; successStatus: 200 };
  "createHealthConnection": { request: { path?: never; query?: never; body: D.CreateHealthConnectionRequest }; response: D.CreateHealthConnectionResponse; successStatus: 201 };
  "updateHealthConnection": { request: { path: {
  "connectionId": D.Id;
}; query?: never; body: D.UpdateHealthConnectionRequest }; response: D.UpdateHealthConnectionResponse; successStatus: 200 };
  "putHealthConsent": { request: { path?: never; query?: never; body: D.PutHealthConsentRequest }; response: D.PutHealthConsentResponse; successStatus: 200 };
  "revokeHealthConsent": { request: { path?: never; query?: never; body: D.RevokeHealthConsentRequest }; response: D.RevokeHealthConsentResponse; successStatus: 200 };
  "importHealthBatch": { request: { path?: never; query?: never; body: D.ImportHealthBatchRequest }; response: D.ImportHealthBatchResponse; successStatus: 201 };
  "buildHealthSummary": { request: { path?: never; query?: never; body: D.BuildHealthSummaryRequest }; response: D.BuildHealthSummaryResponse; successStatus: 201 };
  "listHealthSummaries": { request: { path?: never; query?: {
  "startAt"?: string;
  "endAt"?: string;
}; body?: never }; response: D.ListHealthSummariesResponse; successStatus: 200 };
  "createHealthAiContext": { request: { path?: never; query?: never; body: D.CreateHealthAiContextRequest }; response: D.CreateHealthAiContextResponse; successStatus: 201 };
  "getHealthAiContext": { request: { path: {
  "contextId": D.Id;
}; query?: never; body?: never }; response: D.GetHealthAiContextResponse; successStatus: 200 };
  "purgeHealthData": { request: { path?: never; query?: never; body: D.PurgeHealthDataRequest }; response: D.PurgeHealthDataResponse; successStatus: 201 };
  "refreshExplorationCandidates": { request: { path?: never; query?: never; body: D.RefreshExplorationCandidatesRequest }; response: D.RefreshExplorationCandidatesResponse; successStatus: 201 };
  "listExplorationCandidates": { request: { path?: never; query?: {
  "candidateSetId"?: D.Id;
  "includeDismissed"?: boolean;
  "cursor"?: string;
  "limit"?: number;
}; body?: never }; response: D.ListExplorationCandidatesResponse; successStatus: 200 };
  "getExplorationCandidate": { request: { path: {
  "explorationCandidateId": D.Id;
}; query?: never; body?: never }; response: D.GetExplorationCandidateResponse; successStatus: 200 };
  "respondExplorationCandidate": { request: { path: {
  "explorationCandidateId": D.Id;
}; query?: never; body: D.RespondExplorationCandidateRequest }; response: D.RespondExplorationCandidateResponse; successStatus: 200 };
  "getExplorationPreferences": { request: { path?: never; query?: never; body?: never }; response: D.GetExplorationPreferencesResponse; successStatus: 200 };
  "putExplorationPreferences": { request: { path?: never; query?: never; body: D.PutExplorationPreferencesRequest }; response: D.PutExplorationPreferencesResponse; successStatus: 200 };
}
export type OperationId = keyof OperationMap;
export type OperationRequest<K extends OperationId> = OperationMap[K]["request"];
export type OperationResponse<K extends OperationId> = OperationMap[K]["response"];
export const OPERATION_HTTP = {
  "getHealth": {
    "method": "GET",
    "path": "/api/v1/health",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "getBootstrap": {
    "method": "GET",
    "path": "/api/v1/bootstrap",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "getSettings": {
    "method": "GET",
    "path": "/api/v1/settings",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "updateSettings": {
    "method": "PATCH",
    "path": "/api/v1/settings",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "putContext": {
    "method": "PUT",
    "path": "/api/v1/context",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "listPlaces": {
    "method": "GET",
    "path": "/api/v1/places",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "getPlace": {
    "method": "GET",
    "path": "/api/v1/places/{placeId}",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "listBuildings": {
    "method": "GET",
    "path": "/api/v1/buildings",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "getMeaning": {
    "method": "GET",
    "path": "/api/v1/places/{placeId}/meaning",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "createExperience": {
    "method": "POST",
    "path": "/api/v1/experiences",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "listExperiences": {
    "method": "GET",
    "path": "/api/v1/experiences",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "getExperience": {
    "method": "GET",
    "path": "/api/v1/experiences/{experienceId}",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "deleteExperience": {
    "method": "DELETE",
    "path": "/api/v1/experiences/{experienceId}",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "getEvidence": {
    "method": "GET",
    "path": "/api/v1/evidence/{evidenceId}",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "correctExperience": {
    "method": "POST",
    "path": "/api/v1/experiences/{experienceId}/corrections",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "previewCorrections": {
    "method": "POST",
    "path": "/api/v1/correction-previews",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "applyCorrections": {
    "method": "POST",
    "path": "/api/v1/correction-previews/{previewId}/apply",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "importObservations": {
    "method": "POST",
    "path": "/api/v1/observations/import",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "listVisits": {
    "method": "GET",
    "path": "/api/v1/visits",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "updateVisit": {
    "method": "PATCH",
    "path": "/api/v1/visits/{visitId}",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "getHistory": {
    "method": "GET",
    "path": "/api/v1/history",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "listHypotheses": {
    "method": "GET",
    "path": "/api/v1/hypotheses",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "putPreference": {
    "method": "PUT",
    "path": "/api/v1/preferences",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "reviewHypothesis": {
    "method": "PATCH",
    "path": "/api/v1/hypotheses/{hypothesisId}",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "createDiary": {
    "method": "POST",
    "path": "/api/v1/diaries",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "listDiaries": {
    "method": "GET",
    "path": "/api/v1/diaries",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "updateDiary": {
    "method": "PATCH",
    "path": "/api/v1/diaries/{diaryId}",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "uploadAsset": {
    "method": "POST",
    "path": "/api/v1/assets",
    "successStatus": 201,
    "bodyKind": "multipart"
  },
  "getAsset": {
    "method": "GET",
    "path": "/api/v1/assets/{assetId}",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "getAssetContent": {
    "method": "GET",
    "path": "/api/v1/assets/{assetId}/content",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "exportOwnData": {
    "method": "GET",
    "path": "/api/v1/export",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "createCandidateSet": {
    "method": "POST",
    "path": "/api/v1/candidate-sets",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "getCandidateSet": {
    "method": "GET",
    "path": "/api/v1/candidate-sets/{candidateSetId}",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "planRoute": {
    "method": "POST",
    "path": "/api/v1/routes",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "getRoute": {
    "method": "GET",
    "path": "/api/v1/routes/{routeId}",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "setRouteState": {
    "method": "PATCH",
    "path": "/api/v1/routes/{routeId}",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "createQuest": {
    "method": "POST",
    "path": "/api/v1/quests",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "updateQuest": {
    "method": "PATCH",
    "path": "/api/v1/quests/{questId}",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "listPasses": {
    "method": "GET",
    "path": "/api/v1/passes",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "createPass": {
    "method": "POST",
    "path": "/api/v1/passes",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "updatePass": {
    "method": "PATCH",
    "path": "/api/v1/passes/{passId}",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "deletePass": {
    "method": "DELETE",
    "path": "/api/v1/passes/{passId}",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "listSharedExperiences": {
    "method": "GET",
    "path": "/api/v1/shared-experiences",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "createShareGrant": {
    "method": "POST",
    "path": "/api/v1/share-grants",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "revokeShareGrant": {
    "method": "POST",
    "path": "/api/v1/share-grants/{grantId}/revoke",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "createComparison": {
    "method": "POST",
    "path": "/api/v1/comparisons",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "getComparison": {
    "method": "GET",
    "path": "/api/v1/comparisons/{comparisonId}",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "rejectMapping": {
    "method": "PATCH",
    "path": "/api/v1/comparisons/{comparisonId}",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "createRecipe": {
    "method": "POST",
    "path": "/api/v1/recipes",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "getRecipe": {
    "method": "GET",
    "path": "/api/v1/recipes/{recipeId}",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "updateRecipe": {
    "method": "PATCH",
    "path": "/api/v1/recipes/{recipeId}",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "planTransfer": {
    "method": "POST",
    "path": "/api/v1/transfers",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "getTransfer": {
    "method": "GET",
    "path": "/api/v1/transfers/{transferId}",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "createJointPlan": {
    "method": "POST",
    "path": "/api/v1/joint-plans",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "getJointPlan": {
    "method": "GET",
    "path": "/api/v1/joint-plans/{jointPlanId}",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "createFeedback": {
    "method": "POST",
    "path": "/api/v1/feedback",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "listFeedback": {
    "method": "GET",
    "path": "/api/v1/feedback",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "openDiscovery": {
    "method": "POST",
    "path": "/api/v1/discoveries",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "getDiscovery": {
    "method": "GET",
    "path": "/api/v1/discoveries/{cardId}",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "recordDiscoveryEvent": {
    "method": "POST",
    "path": "/api/v1/discoveries/{cardId}/events",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "listInterests": {
    "method": "GET",
    "path": "/api/v1/interests",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "listExtensions": {
    "method": "GET",
    "path": "/api/v1/extensions",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "createExtension": {
    "method": "POST",
    "path": "/api/v1/extensions",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "createExtensionVersion": {
    "method": "POST",
    "path": "/api/v1/extensions/{extensionId}/versions",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "listExtensionVersions": {
    "method": "GET",
    "path": "/api/v1/extensions/{extensionId}/versions",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "previewExtension": {
    "method": "POST",
    "path": "/api/v1/extension-versions/{versionId}/preview",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "installExtension": {
    "method": "POST",
    "path": "/api/v1/extension-installs",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "listInstalls": {
    "method": "GET",
    "path": "/api/v1/extension-installs",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "updateInstall": {
    "method": "PATCH",
    "path": "/api/v1/extension-installs/{installId}",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "rollbackInstall": {
    "method": "POST",
    "path": "/api/v1/extension-installs/{installId}/rollback",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "runExtension": {
    "method": "POST",
    "path": "/api/v1/extension-installs/{installId}/run",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "createSource": {
    "method": "POST",
    "path": "/api/v1/sources",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "createSnapshot": {
    "method": "POST",
    "path": "/api/v1/sources/{sourceId}/snapshots",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "createRepair": {
    "method": "POST",
    "path": "/api/v1/repairs",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "getRepair": {
    "method": "GET",
    "path": "/api/v1/repairs/{repairId}",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "approveRepair": {
    "method": "POST",
    "path": "/api/v1/repairs/{repairId}/approve",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "createAiJob": {
    "method": "POST",
    "path": "/api/v1/ai/jobs",
    "successStatus": 202,
    "bodyKind": "json"
  },
  "getAiJob": {
    "method": "GET",
    "path": "/api/v1/ai/jobs/{jobId}",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "cancelAiJob": {
    "method": "POST",
    "path": "/api/v1/ai/jobs/{jobId}/cancel",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "applyAiJob": {
    "method": "POST",
    "path": "/api/v1/ai/jobs/{jobId}/apply",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "reviewInterpretation": {
    "method": "POST",
    "path": "/api/v1/interpretations/{interpretationId}/review",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "listExperienceQuestions": {
    "method": "GET",
    "path": "/api/v1/experiences/{experienceId}/questions",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "listQuestionResponses": {
    "method": "GET",
    "path": "/api/v1/experiences/{experienceId}/question-responses",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "respondToQuestion": {
    "method": "POST",
    "path": "/api/v1/questions/{questionId}/responses",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "createDevelopmentRequest": {
    "method": "POST",
    "path": "/api/v1/development-requests",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "getDevelopmentRequest": {
    "method": "GET",
    "path": "/api/v1/development-requests/{requestId}",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "cloneDemo": {
    "method": "POST",
    "path": "/api/v1/demo/namespaces",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "resetDemo": {
    "method": "POST",
    "path": "/api/v1/demo/reset",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "getChanges": {
    "method": "GET",
    "path": "/api/v1/changes",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "listPets": {
    "method": "GET",
    "path": "/api/v1/pets",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "importPet": {
    "method": "POST",
    "path": "/api/v1/pets/imports",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "getPet": {
    "method": "GET",
    "path": "/api/v1/pets/{petId}",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "deletePet": {
    "method": "DELETE",
    "path": "/api/v1/pets/{petId}",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "exportPet": {
    "method": "GET",
    "path": "/api/v1/pets/{petId}/export",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "getCompanionProfile": {
    "method": "GET",
    "path": "/api/v1/companion-profile",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "putCompanionProfile": {
    "method": "PUT",
    "path": "/api/v1/companion-profile",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "listPetGenerationProviders": {
    "method": "GET",
    "path": "/api/v1/pet-generation-providers",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "createPetGeneration": {
    "method": "POST",
    "path": "/api/v1/pet-generations",
    "successStatus": 202,
    "bodyKind": "json"
  },
  "getPetGeneration": {
    "method": "GET",
    "path": "/api/v1/pet-generations/{generationId}",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "cancelPetGeneration": {
    "method": "POST",
    "path": "/api/v1/pet-generations/{generationId}/cancel",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "reviewPetGeneration": {
    "method": "POST",
    "path": "/api/v1/pet-generations/{generationId}/review",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "getHealthDataState": {
    "method": "GET",
    "path": "/api/v1/health-data/state",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "createHealthConnection": {
    "method": "POST",
    "path": "/api/v1/health-data/connections",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "updateHealthConnection": {
    "method": "PATCH",
    "path": "/api/v1/health-data/connections/{connectionId}",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "putHealthConsent": {
    "method": "PUT",
    "path": "/api/v1/health-data/consent",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "revokeHealthConsent": {
    "method": "POST",
    "path": "/api/v1/health-data/consent/revoke",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "importHealthBatch": {
    "method": "POST",
    "path": "/api/v1/health-data/batches",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "buildHealthSummary": {
    "method": "POST",
    "path": "/api/v1/health-data/summaries",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "listHealthSummaries": {
    "method": "GET",
    "path": "/api/v1/health-data/summaries",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "createHealthAiContext": {
    "method": "POST",
    "path": "/api/v1/health-data/ai-contexts",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "getHealthAiContext": {
    "method": "GET",
    "path": "/api/v1/health-data/ai-contexts/{contextId}",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "purgeHealthData": {
    "method": "POST",
    "path": "/api/v1/health-data/purge",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "refreshExplorationCandidates": {
    "method": "POST",
    "path": "/api/v1/exploration-candidates/refresh",
    "successStatus": 201,
    "bodyKind": "json"
  },
  "listExplorationCandidates": {
    "method": "GET",
    "path": "/api/v1/exploration-candidates",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "getExplorationCandidate": {
    "method": "GET",
    "path": "/api/v1/exploration-candidates/{explorationCandidateId}",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "respondExplorationCandidate": {
    "method": "POST",
    "path": "/api/v1/exploration-candidates/{explorationCandidateId}/responses",
    "successStatus": 200,
    "bodyKind": "json"
  },
  "getExplorationPreferences": {
    "method": "GET",
    "path": "/api/v1/exploration-preferences",
    "successStatus": 200,
    "bodyKind": "none"
  },
  "putExplorationPreferences": {
    "method": "PUT",
    "path": "/api/v1/exploration-preferences",
    "successStatus": 200,
    "bodyKind": "json"
  }
} as const;
