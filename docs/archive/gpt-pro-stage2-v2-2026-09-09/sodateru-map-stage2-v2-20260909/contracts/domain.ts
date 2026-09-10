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
};

export type AiExtractOutput = {
  "purpose": (string | null);
  "reason": (string | null);
  "context": Context;
  "evidenceIds": Array<Id>;
  "question": (string | null);
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

export type ExportBundle = {
  "schemaVersion": 2;
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
  "data": Namespace;
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
  "payload": DemoReset;
  "expectedRevision"?: number;
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
