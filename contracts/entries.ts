/** Entry ABI v2.1. No React, Hono, SQL driver or Codex implementation dependency. */
import type * as D from './domain';
import type { ExplorationPort } from './exploration';
import type { PetPackagePort,PetImageGenerationPort,HealthAggregationPort,HealthContextPort,PrivateDataSessionPort,ExportHealthGuardPort,OptionalClientServiceLookup,CompanionUiSlot } from './companion-health';
import type { ApiPort, RequestScope, DbPort, MeaningPort, HypothesisPort, GraphPort,
  ConstraintPort, TransferPort, SharingPort, AiPort, AiReadinessPort, DslPort, QuestionPort,
  ComparisonPort,JointPort,DiscoveryPort,ObservationsPort,SourceNormalizePort } from './ports';
import type { OperationId, OperationRequest, OperationResponse } from './operations';

export type CapabilityId = `api:${OperationId}` | `integration:${string}`;
export type ImplementationMode = 'implementation' | 'fixture';
export interface ServiceMap {
  exploration:ExplorationPort;
  db: DbPort; meaning: MeaningPort; hypotheses: HypothesisPort; graph: GraphPort;
  constraints: ConstraintPort; transfer: TransferPort; sharing: SharingPort;
  /** Existing AI fakes remain valid; runtime health uses diagnose only when the adapter opts in. */
  ai: AiPort & Partial<AiReadinessPort>; dsl: DslPort; questions: QuestionPort;
  comparison:ComparisonPort; joint:JointPort; discovery:DiscoveryPort;
  observations:ObservationsPort; sourceNormalize:SourceNormalizePort;
  petPackages:PetPackagePort; petImageGeneration:PetImageGenerationPort;
  healthAggregation:HealthAggregationPort; healthContext:HealthContextPort; privateDataSession:PrivateDataSessionPort;
  exportHealthGuard:ExportHealthGuardPort;
}
export type ServiceId = keyof ServiceMap;
export interface ServiceLookup { get<K extends ServiceId>(id: K): ServiceMap[K] }
export interface ServiceRegistrar {
  provide<K extends ServiceId>(id: K, value: ServiceMap[K]): void;
}
export type ServiceEntry<K extends ServiceId = ServiceId> = {[S in K]: {
  kind: 'service'; id: string; provides: S; requiresServices: readonly ServiceId[];
  create(services: ServiceLookup): ServiceMap[S];
}}[K];

export interface NavigationPort {
  patchContext(patch: Partial<D.AppContextData>): void;
  openSheet(id: string, target: {placeId:D.Id|null; experienceId:D.Id|null}): void;
  closeSheet(): void;
  /** Replace the selected namespace/actor and remount scope-bound UI state. */
  replaceScope?(scope: RequestScope): void;
}
export interface UIProps {
  context: Readonly<D.AppContextData>; scope: RequestScope; api: ApiPort;
  navigation: NavigationPort; capabilities: ReadonlySet<CapabilityId>;
  /** Optional native/UI services; absence means the corresponding adapter is unavailable. */
  clientServices?:OptionalClientServiceLookup;
}
export interface UIEntry<View> {
  kind: 'ui';
  manifest: { id: string; order: number;
    slots: readonly ('map-sheet'|'self-panel'|'route-panel'|'tab'|CompanionUiSlot)[];
    requiresCapabilities: readonly CapabilityId[] };
  /** React shell mounts this as a component; it must not call a hook component as a plain function. */
  Component(props: UIProps): View;
}
export interface HandlerContext extends RequestScope {
  requestId: D.Id; signal: AbortSignal;
  /** Forwarded only on the server; private-data handlers resolve identity through the auth port. */
  authorization?:string;
}
export type OperationHandler<K extends OperationId> =
  (request: OperationRequest<K>, context: HandlerContext) =>
    OperationResponse<K> | Promise<OperationResponse<K>>;
export interface HandlerRegistrar {
  register<K extends OperationId>(operationId: K, handler: OperationHandler<K>): void;
}
export interface ServerEntry {
  kind: 'server';
  manifest: { id: string; operationIds: readonly OperationId[];
    requiresServices: readonly ServiceId[]; readTables: readonly string[];
    writeTables: readonly string[]; mode: ImplementationMode };
  /** Implementations must register exactly the operations declared above. */
  register(handlers: HandlerRegistrar, services: ServiceLookup): void;
}
export interface WiringPlan {
  uiEntryIds: readonly string[]; serverEntryIds: readonly string[];
}
export interface IntegrationEntry {
  kind: 'integration';
  manifest: { id: `INT-${string}`; requiresCapabilities: readonly CapabilityId[];
    providesCapability: `integration:${string}`; requiresLiveAI:boolean;
    requiredProviders?:readonly ('image-generation'|'healthkit'|'private-data-session')[] };
  /** Pure selection of collected descriptors; no network, DB mutation or verification claim. */
  wire(): WiringPlan;
}
export interface ConnectionReceipt {
  integrationId: `INT-${string}`; buildRevision: string;
  operationIds: readonly OperationId[]; evidencePaths: readonly string[];
  dataMode: D.SourceMode; aiMode: D.ExecutionMode | 'unused';
  providerProofs?:readonly {kind:'image-generation'|'healthkit'|'private-data-session';providerId:string;evidencePath:string}[];
}
// Browser and server collect separate catalogs. UI must never import server entries.
export interface BrowserCatalog<View> { ui: readonly UIEntry<View>[]; integrations: readonly IntegrationEntry[] }
export interface ServerCatalog { server: readonly ServerEntry[]; services: readonly ServiceEntry[];
  integrations:readonly IntegrationEntry[] }
/** Share metadata between catalogs, never executable server/UI descriptors. */
export interface EntryIndex { uiIds:readonly string[]; serverIds:readonly string[];
  integrationIds:readonly string[]; operationIds:readonly OperationId[] }
