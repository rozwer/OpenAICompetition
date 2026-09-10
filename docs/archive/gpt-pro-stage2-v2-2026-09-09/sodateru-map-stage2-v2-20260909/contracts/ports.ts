/** Stable compile-time ports. Feature implementations may use fakes; DTOs do not change. */
import type * as D from './domain';
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
  invoke<TRequest extends object, TResponse>(operationId: string, request: TRequest,
    scope: RequestScope, signal?: AbortSignal): Promise<TResponse>;
}
export interface MeaningPort { build(input: { actorId: D.Id; placeId: D.Id; visits: D.Visit[];
  experiences: D.Experience[]; inputRevision: number }): D.Meaning }
export interface HypothesisPort { build(experiences: D.Experience[], evidence: D.Evidence[],
  preference: D.Preference, inputRevision: number): D.Hypothesis[] }
export interface GraphNode {id: D.Id; position: D.LngLat}
export interface GraphEdge {id: D.Id; from: D.Id; to: D.Id; distanceMeters: number;
  durationSeconds: number; stairs: boolean|null; covered: boolean|null;
  vehicleClasses: string[]; sourceMode: D.SourceMode}
export interface GraphPort { compute(nodes: GraphNode[], edges: GraphEdge[], from: D.Id, to: D.Id):
  {status:'found'; edgeIds:D.Id[]; durationSeconds:number; distanceMeters:number} | {status:'no-route'} }
export interface ConstraintPort { evaluate(input:D.RouteInput, legs:D.RouteLeg[], places:D.Place[], passes:D.Pass[]): D.ConstraintResult[] }
export interface TransferPort { assign(recipe:D.Recipe, candidates:D.Place[], mode:'faithful'|'personal',
  preference:D.Preference): D.TransferDiff[] }
export interface SharingPort { project(experience:D.Experience, grant:D.ShareGrant, recipient:D.Id,
  evidence:D.Evidence[], assetIds:D.Id[]): D.SharedExperience | null }
export interface AiPort { run(input:D.AiInput, scope:D.Scope, signal:AbortSignal):Promise<D.AiOutput> }
export interface DslPort { run(definition:D.DslDefinition, inputs:D.ScalarMap,
  capabilities:{route:GraphPort; constraints:ConstraintPort},
  context:{places:D.Place[]; routeInput:D.RouteInput|null; passes:D.Pass[]; graphNodes:GraphNode[]; graphEdges:GraphEdge[]}):D.DslOutputMap }
export interface UIManifest {id:string; order:number; slots:('map-sheet'|'self-panel'|'route-panel'|'tab')[];
  requiresCapabilities:string[] }
export interface ServerManifest {id:string; operationIds:string[]; readTables:string[]; writeTables:string[]}
// UI actual React components live in feature entry files; manifests carry metadata, not executable text.
