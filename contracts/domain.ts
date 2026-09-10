// Generated from openapi.json. Edit schema first, then regenerate.
export type Id = string;

export type Timestamp = string;

export type SourceMode = "live" | "user" | "sample" | "imported";

export type ExecutionMode = "live-codex" | "rules" | "manual" | "replay";

export type Provenance = {
  "sourceMode": SourceMode;
  "sourceIds": Array<Id>;
  "executionMode": ExecutionMode;
  "retrievedAt": (string | null);
  "validUntil": (string | null);
};

export type LngLat = {
  "longitude": number;
  "latitude": number;
};

export type Position = [number, number];

export type LineString = {
  "type": "LineString";
  "coordinates": Array<Position>;
};

export type Polygon = {
  "type": "Polygon";
  "coordinates": Array<Array<Position>>;
};

export type Context = {
  "weather": ("clear" | "rain" | "snow" | "other" | null);
  "companion": ("alone" | "friend" | "family" | "colleague" | "other" | null);
  "timeBudgetMinutes": (number | null);
  "timeBand": ("morning" | "day" | "evening" | "night" | null);
  "notes": (string | null);
};

export type TimeRange = {
  "startAt": (string | null);
  "endAt": (string | null);
  "precision": "exact" | "approximate" | "unknown";
  "label": (string | null);
  "timeZone": string;
};

export type KnownBool = ({
  "status": "known";
  "value": boolean;
  "sourceIds": Array<Id>;
} | {
  "status": "unknown";
  "value": null;
  "reason": string;
  "sourceIds": Array<Id>;
});

export type KnownMoney = ({
  "status": "known";
  "amountJPY": number;
  "sourceIds": Array<Id>;
} | {
  "status": "unknown";
  "amountJPY": null;
  "reason": string;
  "sourceIds": Array<Id>;
});

export type KnownText = ({
  "status": "known";
  "value": string;
  "sourceIds": Array<Id>;
} | {
  "status": "unknown";
  "value": null;
  "reason": string;
  "sourceIds": Array<Id>;
});

export type VersionRef = {
  "type": string;
  "id": Id;
  "revision": number;
};

export type Scope = {
  "actorId": Id;
  "namespaceId": Id;
  "placeId": (Id | null);
  "experienceId": (Id | null);
  "peerId": (Id | null);
  "candidateSetId": (Id | null);
  "dateRange": (TimeRange | null);
  "entityVersions": Array<VersionRef>;
  "grantVersions": Array<VersionRef>;
  "settingsRevision": number;
};

export type Camera = {
  "center": LngLat;
  "zoom": number;
  "bearing": number;
  "pitch": number;
};

export type AppContextData = {
  "tab": "map" | "social" | "extensions" | "self";
  "selectedPlaceId": (Id | null);
  "selectedExperienceId": (Id | null);
  "date": (string | null);
  "peerId": (Id | null);
  "activeRouteId": (Id | null);
  "lens": "physical" | "mine" | "peer";
  "dimension": "2d" | "3d";
  "livePosition": (LngLat | null);
  "replayPosition": (LngLat | null);
  "camera2d": Camera;
  "camera3d": Camera;
  "draftIds": Array<Id>;
};

export type Namespace = {
  "id": Id;
  "kind": "user" | "demo";
  "canonicalRevision": number;
  "seedVersion": (string | null);
};

export type DemoSession = {
  "namespace": Namespace;
  "actorId": Id;
};

export type Actor = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "displayName": string;
  "isDemo": boolean;
};

export type Settings = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "discoveryEnabled": boolean;
  "proactiveSuggestions": boolean;
  "exploreUnfamiliar": boolean;
  "blockedConceptIds": Array<string>;
  "preferredEntry": "map" | "home";
  "locationEnabled": boolean;
  "aiEnabled": boolean;
};

export type AppContextEntity = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "context": AppContextData;
};

export type Source = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "name": string;
  "provider": string;
  "url": (string | null);
  "license": (string | null);
};

export type Building = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "cityId": Id;
  "footprint": Polygon;
  "heightMeters": (number | null);
  "heightSourceId": (Id | null);
  "levelLabels": Array<string>;
};

export type PlaceFacts = {
  "covered": KnownBool;
  "stepFree": KnownBool;
  "quiet": KnownBool;
  "seats": KnownBool;
  "openNow": KnownBool;
  "cost": KnownMoney;
};

export type ProviderRef = {
  "provider": string;
  "externalId": string;
};

export type Place = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "cityId": Id;
  "name": string;
  "location": LngLat;
  "buildingId": (Id | null);
  "levelLabel": (string | null);
  "categories": Array<string>;
  "roleTags": Array<string>;
  "providerRefs": Array<ProviderRef>;
  "facts": PlaceFacts;
  "provenance": Provenance;
  "address"?: KnownText;
  "entrance"?: KnownText;
};

export type Evidence = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "kind": "utterance" | "observation" | "public";
  "text": string;
  "sourceId": (Id | null);
  "assetId": (Id | null);
};

export type Observation = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "sourceId": Id;
  "sourceRecordId": string;
  "observedAt": string;
  "receivedAt": string;
  "position": LngLat;
  "accuracyMeters": (number | null);
  "motionMode": "walk" | "rail" | "vehicle" | "unknown";
  "importHash": string;
};

export type Visit = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "placeId": Id;
  "levelLabel": (string | null);
  "time": TimeRange;
  "status": "candidate" | "confirmed" | "rejected" | "deleted";
  "observationIds": Array<Id>;
};

export type Experience = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "placeId": Id;
  "visitId": (Id | null);
  "originalEvidenceId": Id;
  "evidenceIds": Array<Id>;
  "purpose": (string | null);
  "reason": (string | null);
  "context": Context;
  "explicitPreference": "like" | "dislike" | "neutral" | "unspecified";
  "outcome": (string | null);
  "status": "active" | "deleted";
};

export type CorrectionPatch = ({
  "field": "purpose";
  "replacement": (string | null);
} | {
  "field": "reason";
  "replacement": (string | null);
} | {
  "field": "context";
  "replacement": Context;
} | {
  "field": "explicitPreference";
  "replacement": "like" | "dislike" | "neutral" | "unspecified";
} | {
  "field": "outcome";
  "replacement": (string | null);
});

export type Correction = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "experienceId": Id;
  "patch": CorrectionPatch;
  "previousPatch": CorrectionPatch;
  "reasonEvidenceId": (Id | null);
  "scopeKind": "experience" | "context" | "global";
  "affectedVersions": Array<VersionRef>;
};

export type CorrectionPreview = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "scopeKind": "context" | "global";
  "contextFilter": (Context | null);
  "patch": CorrectionPatch;
  "targetVersions": Array<VersionRef>;
  "status": "proposed" | "applied" | "stale";
};

export type Interpretation = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "experienceId": Id;
  "jobId": Id;
  "purpose": (string | null);
  "reason": (string | null);
  "context": Context;
  "evidenceIds": Array<Id>;
  "status": "proposed" | "accepted" | "rejected";
};

export type QuestionProposal = {
  "topic": "purpose" | "reason" | "context" | "alternative";
  "text": string;
};

export type FollowUpQuestion = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "experienceId": Id;
  "jobId": (Id | null);
  "topic": "purpose" | "reason" | "context" | "alternative";
  "text": string;
  "dedupKey": string;
  "inputVersions": Array<VersionRef>;
  "status": "open" | "answered" | "deferred" | "skipped" | "stale";
};

export type QuestionResponse = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "questionId": Id;
  "experienceId": Id;
  "action": "answered" | "deferred" | "skipped";
  "answerEvidenceId": (Id | null);
};

export type QuestionRespondResult = {
  "question": FollowUpQuestion;
  "response": QuestionResponse;
  "evidence": (Evidence | null);
};

export type Hypothesis = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "condition": Context;
  "claim": string;
  "supportEvidenceIds": Array<Id>;
  "counterEvidenceIds": Array<Id>;
  "alternative": (string | null);
  "status": "proposed" | "confirmed" | "rejected" | "needs_more_data";
  "inputRevision": number;
};

export type Preference = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "currentIntent": (string | null);
  "context": Context;
  "preferredPurposes": Array<string>;
  "avoidPurposes": Array<string>;
};

export type Meaning = {
  "placeId": Id;
  "actorId": Id;
  "inputRevision": number;
  "purposeCounts": Array<{
  "purpose": string;
  "count": number;
}>;
  "confirmedVisitCount": number;
  "growthStage": number;
  "bodyForm": "physical" | "book" | "conversation" | "garden" | "mixed";
  "evidenceIds": Array<Id>;
};

export type SearchInput = {
  "query": string;
  "cityId": (Id | null);
  "purpose": (string | null);
  "peerId": (Id | null);
  "context": Context;
};

export type CandidateSet = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "query": SearchInput;
  "placeIds": Array<Id>;
  "provider": string;
  "inputVersions": Array<VersionRef>;
};

export type HardConstraints = {
  "avoidStairs": boolean;
  "requireCovered": boolean;
  "requireOpen": boolean;
  "arrivalDeadline": (string | null);
  "maxTotalMinutes": (number | null);
  "maxCostJPY": (number | null);
  "vehicleClass": ("pedestrian" | "bicycle" | "motorcycle-small" | "motorcycle-large" | "car" | null);
};

export type SoftConstraints = {
  "preferredPurposes": Array<string>;
  "preferFamiliar": boolean;
  "preferQuiet": boolean;
};

export type ConstraintResult = {
  "key": string;
  "status": "pass" | "fail" | "unknown";
  "actual": (string | null);
  "explanation": string;
  "sourceIds": Array<Id>;
};

export type Waypoint = {
  "placeId": Id;
  "stayMinutes": number;
};

export type RouteInput = {
  "originPlaceId": Id;
  "destinationPlaceId": Id;
  "waypoints": Array<Waypoint>;
  "departureAt": string;
  "mode": "walk" | "transit" | "motorcycle";
  "hard": HardConstraints;
  "soft": SoftConstraints;
  "passIds": Array<Id>;
  "healthContextId"?: Id;
};

export type VehicleAccessFact = {
  "vehicleClass": string;
  "allowed": KnownBool;
};

export type RouteEdgeFacts = {
  "edgeId": Id;
  "stairs": KnownBool;
  "covered": KnownBool;
  "vehicleAccess": Array<VehicleAccessFact>;
  "provenance": Provenance;
};

export type TransitSegment = {
  "operatorCode": string;
  "lineCode": string;
  "boardingStationCode": string;
  "alightingStationCode": string;
  "viaStationCodes": Array<string>;
  "departureAt": (string | null);
  "arrivalAt": (string | null);
  "provenance": Provenance;
};

export type PassAssessment = {
  "passId": Id;
  "applicable": KnownBool;
  "additionalFare": KnownMoney;
  "provenance": Provenance;
};

export type RouteLeg = {
  "fromPlaceId": Id;
  "toPlaceId": Id;
  "mode": "walk" | "transit" | "motorcycle";
  "distanceMeters": number;
  "durationSeconds": number;
  "geometry": (LineString | null);
  "instructions": Array<string>;
  "cost": KnownMoney;
  "provenance": Provenance;
  "edgeCoverage": "complete" | "partial" | "unknown";
  "edgeFacts": Array<RouteEdgeFacts>;
  "transit": (TransitSegment | null);
  "passAssessments": Array<PassAssessment>;
};

export type RoutePlan = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "input": RouteInput;
  "legs": Array<RouteLeg>;
  "constraints": Array<ConstraintResult>;
  "totalTravelSeconds": number;
  "totalStaySeconds": number;
  "cost": KnownMoney;
  "status": "proposed" | "selected" | "deferred" | "rejected" | "stale";
  "feasibility": "pass" | "fail" | "unknown";
  "inputVersions": Array<VersionRef>;
};

export type Pass = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "operatorCodes": Array<string>;
  "stationCodes": Array<string>;
  "viaCodes": Array<string>;
  "validFrom": string;
  "validThrough": string;
  "cardType": string;
  "providerCourse": (string | null);
};

export type Quest = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "routePlanId": Id;
  "status": "planned" | "active" | "completed" | "deferred" | "canceled";
  "completedExperienceIds": Array<Id>;
};

export type ShareFields = {
  "purpose": boolean;
  "reason": boolean;
  "context": boolean;
  "originalText": boolean;
  "photos": boolean;
  "routeGeometry": boolean;
};

export type ShareGrant = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "recipientActorId": (Id | null);
  "targetType": "experience" | "route" | "extension";
  "targetId": Id;
  "fields": ShareFields;
  "visibility": "peer" | "public";
  "status": "active" | "revoked";
};

export type SharedExperience = {
  "id": Id;
  "ownerActorId": Id;
  "placeId": Id;
  "purpose": (string | null);
  "reason": (string | null);
  "context": (Context | null);
  "originalText": (string | null);
  "assetIds": Array<Id>;
  "grantId": Id;
  "grantRevision": number;
  "sourceMode": SourceMode;
};

export type RoleMapping = {
  "fromExperienceId": Id;
  "toExperienceId": Id;
  "relation": "same-place-same-purpose" | "same-place-different-purpose" | "different-place-same-role" | "practical-tip" | "similar-but-different-reason";
  "explanation": string;
  "evidenceIds": Array<Id>;
  "rejected": boolean;
};

export type Comparison = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "peerId": Id;
  "mappings": Array<RoleMapping>;
  "inputVersions": Array<VersionRef>;
  "grantVersions": Array<VersionRef>;
  "status": "current" | "stale";
};

export type RecipeRole = {
  "roleId": Id;
  "order": number;
  "label": string;
  "purpose": string;
  "sourcePlaceId": (Id | null);
  "reason": (string | null);
  "fixed": boolean;
  "mutable": boolean;
  "nonTransferableMemory": (string | null);
  "stayMinutes": number;
};

export type Transition = {
  "fromRoleId": Id;
  "toRoleId": Id;
  "role": string;
  "maxTravelMinutes": (number | null);
};

export type Recipe = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "sourceExperienceIds": Array<Id>;
  "name": string;
  "roles": Array<RecipeRole>;
  "transitions": Array<Transition>;
  "inputVersions": Array<VersionRef>;
};

export type TransferDiff = {
  "roleId": Id;
  "chosenPlaceId": (Id | null);
  "retained": Array<string>;
  "changed": Array<string>;
  "nonTransferable": Array<string>;
  "unknown": Array<string>;
  "fidelity": number;
  "personalFit": number;
};

export type TransferPlan = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "recipeId": Id;
  "candidateSetId": Id;
  "targetCityId": Id;
  "mode": "faithful" | "personal";
  "roles": Array<TransferDiff>;
  "routePlanId": (Id | null);
  "constraints": Array<ConstraintResult>;
  "inputVersions": Array<VersionRef>;
  "status": "proposed" | "selected" | "stale";
};

export type JointPreference = {
  "participantActorId": Id;
  "hard": HardConstraints;
  "soft": SoftConstraints;
};

export type JointCandidate = {
  "routePlanId": Id;
  "participantScores": Array<{
  "actorId": Id;
  "score": number;
  "reasons": Array<string>;
}>;
  "paretoEfficient": boolean;
};

export type JointPlan = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "participants": Array<JointPreference>;
  "candidates": Array<JointCandidate>;
  "conflicts": Array<string>;
  "selectedRoutePlanId": (Id | null);
};

export type Feedback = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "ownExperienceId": Id;
  "sourceExperienceId": (Id | null);
  "transferPlanId": (Id | null);
  "retained": string;
  "changed": string;
  "fit": "fit" | "not-fit" | "mixed" | "not-tried";
  "reason": string;
  "sendToAuthor": boolean;
};

export type DiscoveryAnchor = {
  "kind": "place" | "building" | "photo";
  "targetId": Id;
  "features": Array<string>;
};

export type KnowledgeSource = {
  "url": (string | null);
  "title": string;
  "claimScope": "general" | "place-specific";
  "sourceId": (Id | null);
};

export type DiscoveryCard = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "anchor": DiscoveryAnchor;
  "bridge": string;
  "knowledge": string;
  "observationPrompt": string;
  "conceptIds": Array<string>;
  "sources": Array<KnowledgeSource>;
  "intent": "normal" | "explore";
  "inputVersions": Array<VersionRef>;
  "executionMode": ExecutionMode;
};

export type DiscoveryEvent = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "cardId": Id;
  "event": "opened" | "known" | "interested" | "dismissed" | "blocked";
  "conceptId": (string | null);
};

export type Interest = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "conceptId": string;
  "state": "interested" | "known" | "blocked";
  "sourceEventId": Id;
};

export type Diary = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "date": string;
  "text": string;
  "experienceIds": Array<Id>;
  "assetIds": Array<Id>;
  "status": "draft" | "approved";
  "jobId": (Id | null);
};

export type Asset = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "contentType": "image/jpeg" | "image/png" | "image/webp";
  "byteLength": number;
  "sha256": string;
  "filename": string;
};

export type DslInput = {
  "key": string;
  "label": string;
  "type": "number" | "boolean" | "string";
  "required": boolean;
};

export type DslStep = {
  "id": string;
  "op": "filterCandidates" | "checkConstraints" | "computeRoute" | "sum" | "subtract" | "formatCard";
  "inputKeys": Array<string>;
  "outputKey": string;
};

export type DslDefinition = {
  "schemaVersion": "dsl.v1";
  "inputs": Array<DslInput>;
  "steps": Array<DslStep>;
  "outputKeys": Array<string>;
  "hostSlot": "map-sheet" | "self-panel" | "route-panel";
};

export type ScalarValue = (string | number | boolean | null);

export type ScalarMap = Record<string, ScalarValue>;

export type Extension = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "name": string;
  "description": string;
  "theme": "general" | "disaster" | "motorcycle" | "pilgrimage";
  "visibility": "private" | "shared" | "public";
};

export type ExtensionVersion = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "extensionId": Id;
  "versionTag": string;
  "definition": DslDefinition;
  "artifactHash": string;
  "runtimeKind": "dsl" | "code";
  "status": "draft" | "validated" | "rejected";
};

export type ExtensionInstall = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "extensionId": Id;
  "activeVersionId": Id;
  "previousVersionId": (Id | null);
  "enabled": boolean;
  "privateState": ScalarMap;
};

export type ExtensionRun = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "versionId": Id;
  "inputs": ScalarMap;
  "outputs": DslOutputMap;
  "status": "succeeded" | "failed";
  "errorCode": (string | null);
};

export type SourceSnapshot = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "sourceId": Id;
  "format": "json" | "csv" | "geojson" | "html" | "pdf";
  "rawHash": string;
  "rawText": string;
  "schemaVersion": string;
  "parserVersion": string;
  "fetchedAt": string;
  "validUntil": (string | null);
};

export type ColumnMapping = {
  "from": string;
  "to": "name" | "longitude" | "latitude" | "covered" | "stepFree" | "openNow" | "costJPY";
  "transform": "identity" | "to-number" | "to-bool" | "meters-to-kilometers";
  "sourceUnit": (string | null);
  "targetUnit": (string | null);
};

export type RepairProposal = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "sourceId": Id;
  "snapshotId": Id;
  "oldParserVersion": string;
  "newParserVersion": string;
  "mappings": Array<ColumnMapping>;
  "status": "proposed" | "approved" | "rejected" | "stale";
  "warnings": Array<string>;
};

export type AiExtractInput = {
  "experienceId": Id;
  "questionResponseIds": Array<Id>;
};

export type AiExtractOutput = {
  "purpose": (string | null);
  "reason": (string | null);
  "context": Context;
  "evidenceIds": Array<Id>;
  "question": (QuestionProposal | null);
};

export type AiCompareInput = {
  "peerId": Id;
  "experienceIds": Array<Id>;
};

export type AiCompareOutput = {
  "mappings": Array<RoleMapping>;
};

export type AiRecipeInput = {
  "experienceIds": Array<Id>;
  "name": string;
};

export type AiRecipeOutput = {
  "name": string;
  "roles": Array<RecipeRole>;
  "transitions": Array<Transition>;
};

export type AiDiscoverInput = {
  "anchor": DiscoveryAnchor;
  "intent": "normal" | "explore";
};

export type AiDiscoverOutput = {
  "anchor": DiscoveryAnchor;
  "bridge": string;
  "knowledge": string;
  "observationPrompt": string;
  "conceptIds": Array<string>;
  "sources": Array<KnowledgeSource>;
};

export type AiExtensionInput = {
  "requirement": string;
  "extensionId": (Id | null);
  "sampleInputs": ScalarMap;
};

export type AiExtensionOutput = {
  "name": string;
  "definition": DslDefinition;
  "unsupportedRequirements": Array<string>;
};

export type AiDiaryInput = {
  "date": string;
  "experienceIds": Array<Id>;
};

export type AiDiaryOutput = {
  "text": string;
  "evidenceIds": Array<Id>;
};

export type AiRepairInput = {
  "sourceId": Id;
  "snapshotId": Id;
};

export type AiRepairOutput = {
  "mappings": Array<ColumnMapping>;
  "warnings": Array<string>;
};

export type AiInput = ({
  "task": "extract";
  "input": AiExtractInput;
} | {
  "task": "compare";
  "input": AiCompareInput;
} | {
  "task": "recipe";
  "input": AiRecipeInput;
} | {
  "task": "discover";
  "input": AiDiscoverInput;
} | {
  "task": "extension";
  "input": AiExtensionInput;
} | {
  "task": "diary";
  "input": AiDiaryInput;
} | {
  "task": "repair";
  "input": AiRepairInput;
} | {
  "task": "wellbeing";
  "input": AiWellbeingInput;
});

export type AiOutput = ({
  "task": "extract";
  "output": AiExtractOutput;
} | {
  "task": "compare";
  "output": AiCompareOutput;
} | {
  "task": "recipe";
  "output": AiRecipeOutput;
} | {
  "task": "discover";
  "output": AiDiscoverOutput;
} | {
  "task": "extension";
  "output": AiExtensionOutput;
} | {
  "task": "diary";
  "output": AiDiaryOutput;
} | {
  "task": "repair";
  "output": AiRepairOutput;
} | {
  "task": "wellbeing";
  "output": AiWellbeingOutput;
});

export type AiJob = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "request": AiInput;
  "scope": Scope;
  "inputHash": string;
  "status": "queued" | "running" | "succeeded" | "failed" | "canceled" | "interrupted" | "stale";
  "executionMode": ExecutionMode;
  "result": (AiOutput | null);
  "errorCode": (string | null);
  "appliedEntityIds": Array<Id>;
};

export type DevelopmentRequest = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "requirement": string;
  "targetLevel": "compose" | "local-bridge" | "code-plugin" | "app-modification";
  "baseCommit": (string | null);
  "allowedPaths": Array<string>;
  "dataPolicy": "clone-only" | "backward-compatible";
  "acceptance": Array<string>;
  "status": "draft" | "exported" | "preview" | "approved" | "reverted";
};

export type ChangedRef = {
  "type": string;
  "id": Id;
  "revision": number;
  "action": "created" | "updated" | "deleted";
};

export type Meta = {
  "requestId": Id;
  "namespaceId": (Id | null);
  "canonicalRevision": number;
  "nextCursor": (string | null);
};

export type ApiError = {
  "error": {
  "code": "VALIDATION_ERROR" | "UNAUTHORIZED_SCOPE" | "NOT_FOUND" | "REVISION_CONFLICT" | "IDEMPOTENCY_CONFLICT" | "INVALID_STATE" | "STALE_INPUT" | "DEPENDENCY_UNAVAILABLE" | "PROVIDER_UNAVAILABLE" | "AI_UNAVAILABLE" | "UPLOAD_TOO_LARGE" | "UNSUPPORTED_MEDIA_TYPE" | "DB_BUSY" | "INTERNAL_ERROR";
  "message": string;
  "retryable": boolean;
  "fieldErrors": Array<{
  "path": string;
  "message": string;
}>;
  "currentRevision": (number | null);
};
  "requestId": Id;
};

export type Receipt = {
  "id": Id;
  "revision": number;
  "status": string;
};

export type Health = {
  "status": "ok" | "degraded";
  "apiVersion": "v1";
  "ai": "available" | "unavailable" | "unknown";
  "db": "ready" | "unavailable";
  "capabilities": Array<string>;
};

export type Bootstrap = {
  "actor": Actor;
  "settings": Settings;
  "context": AppContextEntity;
  "preference": Preference;
  "capabilities": Array<string>;
  "schemaVersion": 2;
};

export type History = {
  "visits": Array<Visit>;
  "experiences": Array<Experience>;
  "observations": Array<Observation>;
};

export type RecordCreated = {
  "experience": Experience;
  "evidence": Evidence;
  "visit": (Visit | null);
};

export type CorrectionApplied = {
  "experience": Experience;
  "correction": Correction;
  "meaning": Meaning;
  "staleJobIds": Array<Id>;
};

export type ImportResult = {
  "insertedCount": number;
  "duplicateCount": number;
  "candidateVisitIds": Array<Id>;
  "warnings": Array<string>;
};

export type ApplyAiResult = {
  "jobId": Id;
  "entities": Array<VersionRef>;
};

export type ExportExclusionCount = {
  "reason": "missing-provenance" | "stale-provenance" | "health-derived" | "unknown-provenance" | "missing-input" | "stale-input" | "unsupported-input" | "cyclic-input" | "dependency-depth-exceeded" | "excluded-dependency";
  "count": number;
};

export type ExportReport = {
  "status": "complete" | "partial";
  "excludedCount": number;
  "reasons": Array<ExportExclusionCount>;
};

export type ExportBundle = {
  "schemaVersion": 2;
  "report": ExportReport;
  "namespace": Namespace;
  "context": AppContextEntity;
  "places": Array<Place>;
  "buildings": Array<Building>;
  "extensions": Array<Extension>;
  "actor": Actor;
  "settings": Settings;
  "experiences": Array<Experience>;
  "visits": Array<Visit>;
  "evidence": Array<Evidence>;
  "corrections": Array<Correction>;
  "diaries": Array<Diary>;
  "preferences": Array<Preference>;
  "interests": Array<Interest>;
  "passes": Array<Pass>;
  "installations": Array<ExtensionInstall>;
  "definitions": Array<ExtensionVersion>;
  "assets": Array<Asset>;
  "sources": Array<Source>;
  "questions": Array<FollowUpQuestion>;
  "questionResponses": Array<QuestionResponse>;
};

export type GetHealthResponse = {
  "data": Health;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type GetBootstrapResponse = {
  "data": Bootstrap;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type GetSettingsResponse = {
  "data": Settings;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type SettingsPatch = {
  "discoveryEnabled": boolean;
  "proactiveSuggestions": boolean;
  "exploreUnfamiliar": boolean;
  "blockedConceptIds": Array<string>;
  "preferredEntry": "map" | "home";
  "locationEnabled": boolean;
  "aiEnabled": boolean;
};

export type UpdateSettingsRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": SettingsPatch;
};

export type UpdateSettingsResponse = {
  "data": Settings;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type PutContextRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": AppContextData;
};

export type PutContextResponse = {
  "data": AppContextEntity;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type ListPlacesResponse = {
  "data": Array<Place>;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type GetPlaceResponse = {
  "data": Place;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type ListBuildingsResponse = {
  "data": Array<Building>;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type GetMeaningResponse = {
  "data": Meaning;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type RecordCreate = {
  "placeId": Id;
  "originalText": string;
  "purpose": (string | null);
  "reason": (string | null);
  "context": Context;
  "explicitPreference": "like" | "dislike" | "neutral" | "unspecified";
  "outcome": (string | null);
  "visit": ({
  "time": TimeRange;
  "levelLabel": (string | null);
} | null);
};

export type CreateExperienceRequest = {
  "opId": Id;
  "payload": RecordCreate;
};

export type CreateExperienceResponse = {
  "data": RecordCreated;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type ListExperiencesResponse = {
  "data": Array<Experience>;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type GetExperienceResponse = {
  "data": Experience;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type GetEvidenceResponse = {
  "data": Evidence;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type CorrectionCreate = {
  "patch": CorrectionPatch;
  "reasonText": (string | null);
};

export type CorrectExperienceRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": CorrectionCreate;
};

export type CorrectExperienceResponse = {
  "data": CorrectionApplied;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type DeleteExperience = {
  "deleteLinkedVisit": boolean;
};

export type DeleteExperienceRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": DeleteExperience;
};

export type DeleteExperienceResponse = {
  "data": Receipt;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type CorrectionPreviewCreate = {
  "scopeKind": "context" | "global";
  "contextFilter": (Context | null);
  "patch": CorrectionPatch;
};

export type PreviewCorrectionsRequest = {
  "opId": Id;
  "payload": CorrectionPreviewCreate;
};

export type PreviewCorrectionsResponse = {
  "data": CorrectionPreview;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type ApplyPreview = {
  "approve": true;
};

export type ApplyCorrectionsRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": ApplyPreview;
};

export type ApplyCorrectionsResponse = {
  "data": Receipt;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type ObservationImport = {
  "format": "json" | "gpx";
  "sourceId": Id;
  "content": string;
};

export type ImportObservationsRequest = {
  "opId": Id;
  "payload": ObservationImport;
};

export type ImportObservationsResponse = {
  "data": ImportResult;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type ListVisitsResponse = {
  "data": Array<Visit>;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type VisitPatch = {
  "status": "confirmed" | "rejected" | "deleted";
  "placeId": Id;
  "time": TimeRange;
  "levelLabel": (string | null);
};

export type UpdateVisitRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": VisitPatch;
};

export type UpdateVisitResponse = {
  "data": Visit;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type GetHistoryResponse = {
  "data": History;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type ListHypothesesResponse = {
  "data": Array<Hypothesis>;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type PreferencePut = {
  "currentIntent": (string | null);
  "context": Context;
  "preferredPurposes": Array<string>;
  "avoidPurposes": Array<string>;
};

export type PutPreferenceRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": PreferencePut;
};

export type PutPreferenceResponse = {
  "data": Preference;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type HypothesisReview = {
  "status": "confirmed" | "rejected" | "needs_more_data";
};

export type ReviewHypothesisRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": HypothesisReview;
};

export type ReviewHypothesisResponse = {
  "data": Hypothesis;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type DiaryCreate = {
  "date": string;
  "text": string;
  "experienceIds": Array<Id>;
  "assetIds": Array<Id>;
  "status": "draft" | "approved";
};

export type CreateDiaryRequest = {
  "opId": Id;
  "payload": DiaryCreate;
};

export type CreateDiaryResponse = {
  "data": Diary;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type ListDiariesResponse = {
  "data": Array<Diary>;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type DiaryPatch = {
  "text": string;
  "assetIds": Array<Id>;
  "status": "draft" | "approved";
};

export type UpdateDiaryRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": DiaryPatch;
};

export type UpdateDiaryResponse = {
  "data": Diary;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type UploadAssetResponse = {
  "data": Asset;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type GetAssetResponse = {
  "data": Asset;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type ExportOwnDataResponse = {
  "data": ExportBundle;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type CreateCandidateSetRequest = {
  "opId": Id;
  "payload": SearchInput;
};

export type CreateCandidateSetResponse = {
  "data": CandidateSet;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type GetCandidateSetResponse = {
  "data": CandidateSet;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type PlanRouteRequest = {
  "opId": Id;
  "payload": RouteInput;
};

export type PlanRouteResponse = {
  "data": RoutePlan;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type GetRouteResponse = {
  "data": RoutePlan;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type RouteState = {
  "status": "selected" | "deferred" | "rejected";
};

export type SetRouteStateRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": RouteState;
};

export type SetRouteStateResponse = {
  "data": RoutePlan;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type QuestCreate = {
  "routePlanId": Id;
};

export type CreateQuestRequest = {
  "opId": Id;
  "payload": QuestCreate;
};

export type CreateQuestResponse = {
  "data": Quest;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type QuestPatch = {
  "status": "active" | "completed" | "deferred" | "canceled";
  "completedExperienceIds": Array<Id>;
};

export type UpdateQuestRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": QuestPatch;
};

export type UpdateQuestResponse = {
  "data": Quest;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type ListPassesResponse = {
  "data": Array<Pass>;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type PassCreate = {
  "operatorCodes": Array<string>;
  "stationCodes": Array<string>;
  "viaCodes": Array<string>;
  "validFrom": string;
  "validThrough": string;
  "cardType": string;
  "providerCourse": (string | null);
};

export type CreatePassRequest = {
  "opId": Id;
  "payload": PassCreate;
};

export type CreatePassResponse = {
  "data": Pass;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type UpdatePassRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": PassCreate;
};

export type UpdatePassResponse = {
  "data": Pass;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type DeletePassRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": {
};
};

export type DeletePassResponse = {
  "data": Receipt;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type ListSharedExperiencesResponse = {
  "data": Array<SharedExperience>;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type ShareGrantCreate = {
  "recipientActorId": (Id | null);
  "targetType": "experience" | "route" | "extension";
  "targetId": Id;
  "fields": ShareFields;
  "visibility": "peer" | "public";
};

export type CreateShareGrantRequest = {
  "opId": Id;
  "payload": ShareGrantCreate;
};

export type CreateShareGrantResponse = {
  "data": ShareGrant;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type RevokeShareGrantRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": {
};
};

export type RevokeShareGrantResponse = {
  "data": ShareGrant;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type CompareCreate = {
  "peerId": Id;
  "experienceIds": Array<Id>;
};

export type CreateComparisonRequest = {
  "opId": Id;
  "payload": CompareCreate;
};

export type CreateComparisonResponse = {
  "data": Comparison;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type GetComparisonResponse = {
  "data": Comparison;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type MappingReject = {
  "mappingIndex": number;
  "rejected": boolean;
};

export type RejectMappingRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": MappingReject;
};

export type RejectMappingResponse = {
  "data": Comparison;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type RecipeCreate = {
  "sourceExperienceIds": Array<Id>;
  "name": string;
  "roles": Array<RecipeRole>;
  "transitions": Array<Transition>;
};

export type CreateRecipeRequest = {
  "opId": Id;
  "payload": RecipeCreate;
};

export type CreateRecipeResponse = {
  "data": Recipe;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type GetRecipeResponse = {
  "data": Recipe;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type UpdateRecipeRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": RecipeCreate;
};

export type UpdateRecipeResponse = {
  "data": Recipe;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type TransferCreate = {
  "recipeId": Id;
  "candidateSetId": Id;
  "targetCityId": Id;
  "mode": "faithful" | "personal";
  "routeInput": RouteInput;
};

export type PlanTransferRequest = {
  "opId": Id;
  "payload": TransferCreate;
};

export type PlanTransferResponse = {
  "data": TransferPlan;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type GetTransferResponse = {
  "data": TransferPlan;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type JointPlanCreate = {
  "participants": Array<JointPreference>;
  "routePlanIds": Array<Id>;
};

export type CreateJointPlanRequest = {
  "opId": Id;
  "payload": JointPlanCreate;
};

export type CreateJointPlanResponse = {
  "data": JointPlan;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type GetJointPlanResponse = {
  "data": JointPlan;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type FeedbackCreate = {
  "ownExperienceId": Id;
  "sourceExperienceId": (Id | null);
  "transferPlanId": (Id | null);
  "retained": string;
  "changed": string;
  "fit": "fit" | "not-fit" | "mixed" | "not-tried";
  "reason": string;
  "sendToAuthor": boolean;
};

export type CreateFeedbackRequest = {
  "opId": Id;
  "payload": FeedbackCreate;
};

export type CreateFeedbackResponse = {
  "data": Feedback;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type ListFeedbackResponse = {
  "data": Array<Feedback>;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type DiscoveryOpen = {
  "anchor": DiscoveryAnchor;
  "intent": "normal" | "explore";
};

export type OpenDiscoveryRequest = {
  "opId": Id;
  "payload": DiscoveryOpen;
};

export type OpenDiscoveryResponse = {
  "data": DiscoveryCard;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type GetDiscoveryResponse = {
  "data": DiscoveryCard;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type DiscoveryEventCreate = {
  "event": "opened" | "known" | "interested" | "dismissed" | "blocked";
  "conceptId": (string | null);
};

export type RecordDiscoveryEventRequest = {
  "opId": Id;
  "payload": DiscoveryEventCreate;
};

export type RecordDiscoveryEventResponse = {
  "data": DiscoveryEvent;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type ListInterestsResponse = {
  "data": Array<Interest>;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type ListExtensionsResponse = {
  "data": Array<Extension>;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type ExtensionCreate = {
  "name": string;
  "description": string;
  "theme": "general" | "disaster" | "motorcycle" | "pilgrimage";
  "visibility": "private" | "shared" | "public";
};

export type CreateExtensionRequest = {
  "opId": Id;
  "payload": ExtensionCreate;
};

export type CreateExtensionResponse = {
  "data": Extension;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type VersionCreate = {
  "versionTag": string;
  "definition": DslDefinition;
};

export type CreateExtensionVersionRequest = {
  "opId": Id;
  "payload": VersionCreate;
};

export type CreateExtensionVersionResponse = {
  "data": ExtensionVersion;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type ListExtensionVersionsResponse = {
  "data": Array<ExtensionVersion>;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type ExtensionInputs = {
  "inputs": ScalarMap;
};

export type PreviewExtensionRequest = {
  "opId": Id;
  "payload": ExtensionInputs;
};

export type PreviewExtensionResponse = {
  "data": ExtensionRun;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type InstallCreate = {
  "extensionId": Id;
  "versionId": Id;
};

export type InstallExtensionRequest = {
  "opId": Id;
  "payload": InstallCreate;
};

export type InstallExtensionResponse = {
  "data": ExtensionInstall;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type ListInstallsResponse = {
  "data": Array<ExtensionInstall>;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type InstallPatch = {
  "enabled": boolean;
  "activeVersionId": Id;
};

export type UpdateInstallRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": InstallPatch;
};

export type UpdateInstallResponse = {
  "data": ExtensionInstall;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type RollbackInstallRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": {
};
};

export type RollbackInstallResponse = {
  "data": ExtensionInstall;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type RunExtensionRequest = {
  "opId": Id;
  "payload": ExtensionInputs;
};

export type RunExtensionResponse = {
  "data": ExtensionRun;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type SourceCreate = {
  "name": string;
  "provider": string;
  "url": (string | null);
  "license": (string | null);
};

export type CreateSourceRequest = {
  "opId": Id;
  "payload": SourceCreate;
};

export type CreateSourceResponse = {
  "data": Source;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type SnapshotCreate = {
  "format": "json" | "csv" | "geojson" | "html" | "pdf";
  "rawText": string;
  "parserVersion": string;
  "validUntil": (string | null);
};

export type CreateSnapshotRequest = {
  "opId": Id;
  "payload": SnapshotCreate;
};

export type CreateSnapshotResponse = {
  "data": SourceSnapshot;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type RepairCreate = {
  "sourceId": Id;
  "snapshotId": Id;
  "oldParserVersion": string;
  "newParserVersion": string;
  "mappings": Array<ColumnMapping>;
};

export type CreateRepairRequest = {
  "opId": Id;
  "payload": RepairCreate;
};

export type CreateRepairResponse = {
  "data": RepairProposal;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type GetRepairResponse = {
  "data": RepairProposal;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type RepairApprove = {
  "approveSemanticChanges": true;
};

export type ApproveRepairRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": RepairApprove;
};

export type ApproveRepairResponse = {
  "data": RepairProposal;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type AiJobCreate = {
  "request": AiInput;
  "scope": Scope;
  "executionMode": "live-codex" | "replay";
};

export type CreateAiJobRequest = {
  "opId": Id;
  "payload": AiJobCreate;
};

export type CreateAiJobResponse = {
  "data": AiJob;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type GetAiJobResponse = {
  "data": AiJob;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type CancelAiJobRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": {
};
};

export type CancelAiJobResponse = {
  "data": AiJob;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type AiApply = {
  "approve": true;
};

export type ApplyAiJobRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": AiApply;
};

export type ApplyAiJobResponse = {
  "data": ApplyAiResult;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type InterpretationReview = {
  "action": "accept" | "reject";
};

export type ReviewInterpretationRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": InterpretationReview;
};

export type ReviewInterpretationResponse = {
  "data": Interpretation;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type ListExperienceQuestionsResponse = {
  "data": Array<FollowUpQuestion>;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type ListQuestionResponsesResponse = {
  "data": Array<QuestionResponse>;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type QuestionRespond = ({
  "action": "answered";
  "answerText": string;
} | {
  "action": "deferred" | "skipped";
  "answerText": null;
});

export type RespondToQuestionRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": QuestionRespond;
};

export type RespondToQuestionResponse = {
  "data": QuestionRespondResult;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type DevelopmentCreate = {
  "requirement": string;
  "targetLevel": "compose" | "local-bridge" | "code-plugin" | "app-modification";
  "baseCommit": (string | null);
  "allowedPaths": Array<string>;
  "dataPolicy": "clone-only" | "backward-compatible";
  "acceptance": Array<string>;
};

export type CreateDevelopmentRequestRequest = {
  "opId": Id;
  "payload": DevelopmentCreate;
};

export type CreateDevelopmentRequestResponse = {
  "data": DevelopmentRequest;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type GetDevelopmentRequestResponse = {
  "data": DevelopmentRequest;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type DemoClone = {
  "seedVersion": string;
};

export type CloneDemoRequest = {
  "opId": Id;
  "payload": DemoClone;
};

export type CloneDemoResponse = {
  "data": DemoSession;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type DemoReset = {
  "confirmNamespaceId": Id;
  "seedVersion": string;
};

export type ResetDemoRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": DemoReset;
};

export type ResetDemoResponse = {
  "data": Namespace;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type ChangeEvent = {
  "sequence": number;
  "canonicalRevision": number;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type GetChangesResponse = {
  "data": Array<ChangeEvent>;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type RouteComputation = {
  "legs": Array<RouteLeg>;
  "constraints": Array<ConstraintResult>;
  "totalTravelSeconds": number;
  "totalStaySeconds": number;
  "cost": KnownMoney;
};

export type DslCard = {
  "title": string;
  "body": string;
  "status": "info" | "pass" | "fail" | "unknown";
};

export type DslValue = (ScalarValue | Array<Place> | Array<ConstraintResult> | RouteComputation | DslCard);

export type DslOutputMap = Record<string, DslValue>;

export type PetManifestV2 = {
  "id": string;
  "displayName": string;
  "description": string;
  "spriteVersionNumber": 2;
  "spritesheetPath": "spritesheet.webp" | "spritesheet.png";
};

export type PetAtlasSpec = {
  "columns": 8;
  "rows": 11;
  "cellWidth": 192;
  "cellHeight": 208;
  "width": 1536;
  "height": 2288;
  "format": "image/webp" | "image/png";
};

export type PetAnimationState = "idle" | "running-right" | "running-left" | "waving" | "jumping" | "failed" | "waiting" | "running" | "review";

export type PetValidation = {
  "result": "passed" | "failed";
  "validatorVersion": string;
  "issues": Array<{
  "code": string;
  "detail": string;
}>;
  "visualReview": "not-reviewed" | "accepted" | "rejected";
};

export type PetPackage = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "manifest": PetManifestV2;
  "atlasAssetId": Id;
  "atlas": PetAtlasSpec;
  "contentHash": string;
  "origin": "imported" | "generated" | "bundled";
  "validation": PetValidation;
  "status": "candidate" | "ready" | "deleted";
};

export type CompanionPreferences = {
  "enabled": boolean;
  "petPackageId": (Id | null);
  "size": "small" | "medium" | "large";
  "motion": "system" | "reduced" | "animated";
  "placement": "corner" | "chat-header";
  "proactiveReaction": boolean;
};

export type CompanionProfile = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "preferences": CompanionPreferences;
};

export type CompanionEvent = {
  "eventId": Id;
  "sequence": number;
  "kind": "idle" | "processing" | "needs-input" | "reply-ready" | "discovery" | "record-saved" | "failed";
  "jobId": (Id | null);
  "createdAt": string;
  "expiresAt": string;
};

export type PetGenerationProvider = {
  "id": string;
  "state": "available" | "not-configured" | "unsupported";
  "acceptsReferences": boolean;
  "supportsTransparency": boolean;
  "requiresExternalProcessing": boolean;
};

export type PetGenerationInput = {
  "prompt": string;
  "displayName": string;
  "referenceAssetIds": Array<Id>;
  "providerId": string;
  "externalProcessingAccepted": boolean;
};

export type PetGenerationJob = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "input": PetGenerationInput;
  "status": "queued" | "running" | "awaiting-review" | "succeeded" | "failed" | "canceled" | "unsupported";
  "completedRows": Array<number>;
  "candidatePetId": (Id | null);
  "errorCode": (string | null);
  "providerRunId": (string | null);
};

export type PetExport = {
  "manifest": PetManifestV2;
  "atlasAssetId": Id;
  "contentHash": string;
};

export type ListPetsResponse = {
  "data": Array<PetPackage>;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type PetImport = {
  "manifest": PetManifestV2;
  "atlasAssetId": Id;
  "expectedContentHash": string;
};

export type ImportPetRequest = {
  "opId": Id;
  "payload": PetImport;
};

export type ImportPetResponse = {
  "data": PetPackage;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type GetPetResponse = {
  "data": PetPackage;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type ExportPetResponse = {
  "data": PetExport;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type DeletePetRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": {
};
};

export type DeletePetResponse = {
  "data": Receipt;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type GetCompanionProfileResponse = {
  "data": (CompanionProfile | null);
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type PutCompanionProfileRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": CompanionPreferences;
};

export type PutCompanionProfileResponse = {
  "data": CompanionProfile;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type ListPetGenerationProvidersResponse = {
  "data": Array<PetGenerationProvider>;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type CreatePetGenerationRequest = {
  "opId": Id;
  "payload": PetGenerationInput;
};

export type CreatePetGenerationResponse = {
  "data": PetGenerationJob;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type GetPetGenerationResponse = {
  "data": PetGenerationJob;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type CancelPetGenerationRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": {
};
};

export type CancelPetGenerationResponse = {
  "data": PetGenerationJob;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type PetGenerationReview = {
  "decision": "accept" | "reject";
  "candidatePetId": Id;
};

export type ReviewPetGenerationRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": PetGenerationReview;
};

export type ReviewPetGenerationResponse = {
  "data": PetGenerationJob;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type HealthMetric = "steps" | "walking-distance" | "active-energy" | "sleep-duration" | "workout-duration";

export type HealthUnit = "count" | "m" | "kcal" | "s";

export type HealthQuantity = ({
  "metric": "steps";
  "unit": "count";
  "value": number;
} | {
  "metric": "walking-distance";
  "unit": "m";
  "value": number;
} | {
  "metric": "active-energy";
  "unit": "kcal";
  "value": number;
} | {
  "metric": "sleep-duration";
  "unit": "s";
  "value": number;
} | {
  "metric": "workout-duration";
  "unit": "s";
  "value": number;
});

export type HealthWindow = {
  "startAt": string;
  "endAt": string;
  "timeZone": string;
};

export type HealthBridgeAvailability = {
  "platform": "ios" | "web" | "other";
  "state": "available" | "unsupported" | "unavailable";
  "supportedMetrics": Array<HealthMetric>;
  "readAuthorization": "not-requested" | "request-completed" | "unknown";
  "reason": (string | null);
};

export type HealthSourceIdentity = {
  "appId": string;
  "deviceId": (string | null);
  "sourceVersion": string;
};

export type HealthRecordInput = {
  "externalKey": string;
  "recordVersion": string;
  "window": HealthWindow;
  "quantity": HealthQuantity;
  "sleepStage": ("in-bed" | "awake" | "asleep-unspecified" | "asleep-core" | "asleep-deep" | "asleep-rem" | null);
  "source": HealthSourceIdentity;
  "recordHash": string;
};

export type HealthReadBatch = {
  "records": Array<HealthRecordInput>;
  "deletedExternalKeys": Array<string>;
  "nextAnchor": (string | null);
  "hasMore": boolean;
};

export type HealthConnection = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "provider": "healthkit" | "apple-health-xml";
  "deviceLabel": string;
  "status": "enabled" | "paused" | "disconnected";
  "lastSyncedAt": (string | null);
};

export type HealthConsentPolicy = {
  "collectionEnabled": boolean;
  "serverStorageEnabled": boolean;
  "metrics": Array<HealthMetric>;
  "window": HealthWindow;
  "aiEnabled": boolean;
  "aiProviderIds": Array<string>;
  "policyVersion": "health.v1";
};

export type HealthConsent = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "policy": HealthConsentPolicy;
  "status": "active" | "withdrawn";
};

export type HealthSample = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "healthConnectionId": Id;
  "externalKey": string;
  "recordVersion": string;
  "window": HealthWindow;
  "quantity": HealthQuantity;
  "sleepStage": ("in-bed" | "awake" | "asleep-unspecified" | "asleep-core" | "asleep-deep" | "asleep-rem" | null);
  "source": HealthSourceIdentity;
  "recordHash": string;
  "status": "active" | "deleted";
};

export type HealthImportBatch = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "healthConnectionId": Id;
  "consentRevision": number;
  "batchHash": string;
  "insertedCount": number;
  "updatedCount": number;
  "deletedCount": number;
  "duplicateCount": number;
  "warnings": Array<string>;
};

export type HealthAggregationPolicy = {
  "id": "single-source-per-day-v1";
  "preferredSources": Array<string>;
  "dayBoundaryHour": number;
};

export type HealthAggregateValue = {
  "metric": HealthMetric;
  "unit": HealthUnit;
  "value": (number | null);
  "state": "available" | "partial" | "unavailable";
  "reasonCodes": Array<"no-readable-data" | "source-overlap" | "incomplete-window" | "source-deleted" | "consent-withdrawn" | "unsupported-metric" | "prorated-interval">;
  "sourceSelections": Array<{
  "day": string;
  "sourceKey": string;
}>;
  "quality": ("reported" | "estimated" | null);
  "sampleIds": Array<Id>;
};

export type HealthSummary = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "window": HealthWindow;
  "aggregationPolicy": HealthAggregationPolicy;
  "consentRevision": number;
  "values": Array<HealthAggregateValue>;
  "inputVersions": Array<VersionRef>;
  "status": "current" | "stale" | "revoked";
};

export type HealthContextValue = {
  "metric": HealthMetric;
  "unit": HealthUnit;
  "value": number;
  "window": HealthWindow;
  "summaryId": Id;
  "summaryRevision": number;
  "quality": "reported" | "estimated";
};

export type HealthAiContext = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "consentRevision": number;
  "providerId": string;
  "values": Array<HealthContextValue>;
  "expiresAt": string;
  "status": "ready" | "stale" | "revoked";
};

export type HealthDisclosure = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "healthContextId": (Id | null);
  "providerId": string;
  "consentRevision": number;
  "payloadHash": string;
  "metrics": Array<HealthMetric>;
  "sentAt": (string | null);
  "status": "prepared" | "sent" | "failed" | "canceled";
};

export type HealthDataState = {
  "consent": (HealthConsent | null);
  "connections": Array<HealthConnection>;
  "summaryIds": Array<Id>;
};

export type HealthPurgeResult = {
  "deletedSamples": number;
  "deletedSummaries": number;
  "invalidatedJobIds": Array<Id>;
  "retainedAuditIds": Array<Id>;
};

export type GetHealthDataStateResponse = {
  "data": HealthDataState;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type HealthConnectionCreate = {
  "provider": "healthkit" | "apple-health-xml";
  "deviceLabel": string;
};

export type CreateHealthConnectionRequest = {
  "opId": Id;
  "payload": HealthConnectionCreate;
};

export type CreateHealthConnectionResponse = {
  "data": HealthConnection;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type HealthConnectionPatch = {
  "status": "enabled" | "paused" | "disconnected";
};

export type UpdateHealthConnectionRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": HealthConnectionPatch;
};

export type UpdateHealthConnectionResponse = {
  "data": HealthConnection;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type PutHealthConsentRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": HealthConsentPolicy;
};

export type PutHealthConsentResponse = {
  "data": HealthConsent;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type RevokeHealthConsentRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": {
};
};

export type RevokeHealthConsentResponse = {
  "data": HealthConsent;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type HealthBatchImport = {
  "healthConnectionId": Id;
  "consentRevision": number;
  "batchHash": string;
  "records": Array<HealthRecordInput>;
  "deletedExternalKeys": Array<string>;
};

export type ImportHealthBatchRequest = {
  "opId": Id;
  "payload": HealthBatchImport;
};

export type ImportHealthBatchResponse = {
  "data": HealthImportBatch;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type HealthSummaryBuild = {
  "window": HealthWindow;
  "metrics": Array<HealthMetric>;
  "aggregationPolicy": HealthAggregationPolicy;
};

export type BuildHealthSummaryRequest = {
  "opId": Id;
  "payload": HealthSummaryBuild;
};

export type BuildHealthSummaryResponse = {
  "data": HealthSummary;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type ListHealthSummariesResponse = {
  "data": Array<HealthSummary>;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type HealthContextCreate = {
  "summaryIds": Array<Id>;
  "metrics": Array<HealthMetric>;
  "providerId": string;
  "consentRevision": number;
};

export type CreateHealthAiContextRequest = {
  "opId": Id;
  "payload": HealthContextCreate;
};

export type CreateHealthAiContextResponse = {
  "data": HealthAiContext;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type GetHealthAiContextResponse = {
  "data": HealthAiContext;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type HealthPurge = {
  "confirmActorId": Id;
  "consentRevision": number;
};

export type PurgeHealthDataRequest = {
  "opId": Id;
  "payload": HealthPurge;
};

export type PurgeHealthDataResponse = {
  "data": HealthPurgeResult;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type AiWellbeingInput = {
  "healthContextId": Id;
  "objective": string;
  "placeId": (Id | null);
};

export type WellbeingSuggestion = {
  "id": Id;
  "kind": "short-walk" | "regular-walk" | "rest-option" | "reflection";
  "text": string;
  "reason": string;
  "summaryRefs": Array<VersionRef>;
  "proposedDistanceMeters": (number | null);
};

export type AiWellbeingOutput = {
  "suggestions": Array<WellbeingSuggestion>;
  "limitations": Array<string>;
};

export type ExplorationOrigin = {
  "kind": "experience" | "preference";
  "id": Id;
  "revision": number;
};

export type ExplorationReason = {
  "kind": "role-match" | "verified-bridge";
  "originSummary": string;
  "connection": string;
  "placeFact": string;
  "sourceIds": Array<Id>;
  "discoveryCardId": (Id | null);
};

export type ExplorationCandidate = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "placeId": Id;
  "candidateSetId": Id;
  "originKind": "experience" | "preference";
  "originId": Id;
  "originRevision": number;
  "reason": ExplorationReason;
  "policyVersion": string;
  "inputVersions": Array<VersionRef>;
  "provenance": Provenance;
  "status": "current" | "stale" | "withdrawn";
  "disposition": "unmarked" | "interested" | "dismissed";
};

export type ExplorationDisplayPreferences = {
  "enabled": boolean;
  "motion": "system" | "reduced";
};

export type ExplorationPreferences = {
  "namespaceId": Id;
  "id": Id;
  "revision": number;
  "createdAt": string;
  "updatedAt": string;
  "sourceMode": SourceMode;
  "actorId": Id;
  "display": ExplorationDisplayPreferences;
  "dismissedPlaceIds": Array<Id>;
};

export type ExplorationRelation = ({
  "kind": "unformed";
  "meaning": null;
  "experienceIds": Array<Id>;
  "visitIds": Array<Id>;
} | {
  "kind": "visited-unrecorded";
  "meaning": Meaning;
  "experienceIds": Array<Id>;
  "visitIds": Array<Id>;
} | {
  "kind": "formed";
  "meaning": Meaning;
  "experienceIds": Array<Id>;
  "visitIds": Array<Id>;
});

export type ExplorationPlaceDetails = {
  "address": KnownText;
  "entrance": KnownText;
  "sources": Array<Source>;
};

export type ExplorationItem = {
  "candidate": ExplorationCandidate;
  "place": Place;
  "details": ExplorationPlaceDetails;
  "relation": ExplorationRelation;
};

export type ExplorationPage = {
  "items": Array<ExplorationItem>;
  "nextCursor": (string | null);
  "emptyReason": ("no-origin" | "no-supported-role" | "no-candidates" | "disabled" | "stale-input" | null);
};

export type ExplorationRefresh = {
  "candidateSetId": Id;
  "candidateSetRevision": number;
  "origin": ExplorationOrigin;
  "discoveryCardIds": Array<Id>;
};

export type ExplorationResponse = {
  "action": "interested" | "dismiss-place" | "restore-place";
};

export type ExplorationResponseResult = {
  "items": Array<ExplorationItem>;
  "placeId": Id;
  "disposition": "unmarked" | "interested" | "dismissed";
};

export type RefreshExplorationCandidatesRequest = {
  "opId": Id;
  "payload": ExplorationRefresh;
};

export type RefreshExplorationCandidatesResponse = {
  "data": ExplorationPage;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type ListExplorationCandidatesResponse = {
  "data": ExplorationPage;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type GetExplorationCandidateResponse = {
  "data": ExplorationItem;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type RespondExplorationCandidateRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": ExplorationResponse;
};

export type RespondExplorationCandidateResponse = {
  "data": ExplorationResponseResult;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type GetExplorationPreferencesResponse = {
  "data": (ExplorationPreferences | null);
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};

export type PutExplorationPreferencesRequest = {
  "opId": Id;
  "expectedRevision": number;
  "payload": ExplorationDisplayPreferences;
};

export type PutExplorationPreferencesResponse = {
  "data": ExplorationPreferences;
  "meta": Meta;
  "changed": Array<ChangedRef>;
  "invalidated": Array<string>;
};
