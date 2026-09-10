/** Stable compile-time ports. Feature implementations may use fakes; DTOs do not change. */
import type * as D from './domain';
import type { OperationId, OperationRequest, OperationResponse } from './operations';
export type SqlValue = string | number | null | Uint8Array;
export type SqlRow = Readonly<Record<string, SqlValue>>;
export interface ReadPort {
  get(sql: string, params: readonly SqlValue[]): SqlRow | undefined;
  all(sql: string, params: readonly SqlValue[]): SqlRow[];
}
export interface TransactionPort extends ReadPort {
  run(sql: string, params: readonly SqlValue[]): { changes: number; lastInsertRowid: number | bigint };
}
export interface MutationContext {
  namespaceId: D.Id; actorId: D.Id; opId: D.Id;
  method: string; path: string; body: object; requestId: D.Id;
}
export interface MutationResult<T> { data: T; changed: D.ChangedRef[]; invalidated: string[] }
export interface DbPort {
  read<T>(fn: (tx: ReadPort) => T): T;
  mutate<T>(context: MutationContext, httpStatus: number,
    fn: (tx: TransactionPort) => MutationResult<T>): {
      status: number; body: MutationResult<T> & {meta: D.Meta}; replayed: boolean
    };
}
export interface RequestScope {namespaceId: D.Id; actorId: D.Id}
export interface ApiPort {
  invoke<K extends OperationId>(operationId: K, request: OperationRequest<K>,
    scope: RequestScope, signal?: AbortSignal): Promise<OperationResponse<K>>;
}
export interface MeaningPort { build(input: { actorId: D.Id; placeId: D.Id; visits: D.Visit[];
  experiences: D.Experience[]; inputRevision: number }): D.Meaning }
export interface HypothesisPort { build(experiences: D.Experience[], evidence: D.Evidence[],
  preference: D.Preference, inputRevision: number): D.Hypothesis[] }
export interface GraphNode {id: D.Id; position: D.LngLat}
export interface GraphEdge {id: D.Id; from: D.Id; to: D.Id; distanceMeters: number;
  durationSeconds: number; stairs: boolean|null; covered: boolean|null;
  vehicleClasses: string[]|null; sourceMode: D.SourceMode; provenance: D.Provenance}
export interface GraphPort { compute(nodes: GraphNode[], edges: GraphEdge[], from: D.Id, to: D.Id):
  {status:'found'; edgeIds:D.Id[]; durationSeconds:number; distanceMeters:number} | {status:'no-route'} }
export interface ConstraintEvaluationContext {
  /** Caller-verified comparable/fresh whole-journey travel time before waypoints; omit/null if unknown. */
  baselineTravelSeconds?: number | null;
}
export interface ConstraintPort { evaluate(input:D.RouteInput, legs:D.RouteLeg[], places:D.Place[], passes:D.Pass[],
  context?:ConstraintEvaluationContext): D.ConstraintResult[] }
export interface TransferPort { assign(recipe:D.Recipe, candidates:D.Place[], mode:'faithful'|'personal',
  preference:D.Preference): D.TransferDiff[] }
export interface SharingPort { project(experience:D.Experience, grant:D.ShareGrant, recipient:D.Id,
  evidence:D.Evidence[], assetIds:D.Id[]): D.SharedExperience | null }
export type AiReadinessDiagnostic =
  | {state:'unregistered'; executable:false; reason:'no-task'}
  | {state:'configuration-missing'; executable:false; reason:'work-directory'|'authentication'|'sdk'|'provider-probe'}
  | {state:'probe-ready'; executable:true; reason:null}
  | {state:'execution-failed'; executable:false; reason:'last-execution'};
/** Local, non-generating probe. It must not send prompts or treat descriptors/receipts as live proof. */
export interface AiReadinessPort { diagnose(signal:AbortSignal):Promise<AiReadinessDiagnostic> }
export interface AiPort { run(input:D.AiInput, scope:D.Scope, signal:AbortSignal):Promise<D.AiOutput> }
export interface DslPort { run(definition:D.DslDefinition, inputs:D.ScalarMap,
  capabilities:{route:GraphPort; constraints:ConstraintPort},
  context:{places:D.Place[]; routeInput:D.RouteInput|null; passes:D.Pass[]; graphNodes:GraphNode[]; graphEdges:GraphEdge[]}):D.DslOutputMap }
/** Called only inside the caller's existing transaction. Does not call AI or HTTP. */
export interface QuestionPort {
  propose(tx: TransactionPort, input: {scope: RequestScope; experience: D.Experience;
    jobId: D.Id|null; proposal: D.QuestionProposal; inputVersions:D.VersionRef[];
    now:D.Timestamp; questionId:D.Id; sourceMode:D.SourceMode}): D.FollowUpQuestion|null;
}
export interface ComparisonPort {
  build(input:{actorId:D.Id;peerId:D.Id;experiences:D.SharedExperience[]}):D.RoleMapping[];
}
export interface JointPort {
  evaluate(participants:D.JointPreference[],routes:D.RoutePlan[]):{candidates:D.JointCandidate[];conflicts:string[]};
}
export interface DiscoveryPort {
  select(input:{anchor:D.DiscoveryAnchor;intent:'normal'|'explore';candidates:D.DiscoveryCard[];
    settings:D.Settings;interests:D.Interest[];knownConceptIds:string[]}):D.DiscoveryCard|null;
}
export interface ObservationCandidateInterval {
  id:D.Id; namespaceId:D.Id; actorId:D.Id; sourceId:D.Id;
  startAt:D.Timestamp; endAt:D.Timestamp; observationIds:D.Id[]; heuristicVersion:string;
}
export interface ObservationsPort {
  normalize(input:{format:'json'|'gpx';rawText:string;sourceId:D.Id;namespaceId:D.Id;actorId:D.Id;
    receivedAt:D.Timestamp;sourceMode:D.SourceMode;idForRecord(sourceRecordId:string):D.Id}):
    {observations:D.Observation[];warnings:string[];candidateIntervals?:ObservationCandidateInterval[]};
}
export interface SourceNormalizePort {
  normalize(snapshot:D.SourceSnapshot,mappings:D.ColumnMapping[]):{places:D.Place[];warnings:string[]};
}
// Entry/manifest types are in entries.ts. They are intentionally independent of React and Hono.
