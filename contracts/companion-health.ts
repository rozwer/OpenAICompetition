/** Optional module contracts. These are interfaces, not provider implementations. */
import type * as D from './domain';
import type { ReadPort, RequestScope } from './ports';
export type CompanionUiSlot = 'companion-overlay'|'settings-panel'|'health-panel';
export interface CompanionEventsPort {
  subscribe(listener:(event:D.CompanionEvent)=>void):()=>void;
  publish(event:D.CompanionEvent):void;
}
export interface PetRendererPort<View> {
  render(input:{pet:D.PetPackage;profile:D.CompanionPreferences;event:D.CompanionEvent|null;
    reducedMotion:boolean;visible:boolean;onActivate:()=>void}):View;
}
export interface PetPackagePort {
  validate(input:{manifest:D.PetManifestV2;bytes:Uint8Array;contentType:'image/png'|'image/webp'}):Promise<D.PetValidation>;
}
export interface PetImageGenerationPort {
  providers():Promise<readonly D.PetGenerationProvider[]>;
  /** A provider-specific adapter implements generation; the host never executes imported pet code. */
  generate(input:D.PetGenerationInput,references:readonly {assetId:D.Id;bytes:Uint8Array}[],
    signal:AbortSignal,onProgress:(completedRows:readonly number[])=>void):Promise<{
      manifest:D.PetManifestV2;bytes:Uint8Array;contentType:'image/png'|'image/webp';providerRunId:string|null}>;
}
export interface HealthBridgePort {
  availability():Promise<D.HealthBridgeAvailability>;
  /** Completion is not proof of read permission. HealthKit intentionally hides read denial. */
  requestReadAuthorization(metrics:readonly D.HealthMetric[]):Promise<D.HealthBridgeAvailability>;
  readBatch(input:{connectionId:D.Id;metric:D.HealthMetric;window:D.HealthWindow;anchor:string|null},signal:AbortSignal):Promise<D.HealthReadBatch>;
  /** Save an anchor locally only after the server commits the associated batch. */
  acknowledge(input:{connectionId:D.Id;metric:D.HealthMetric;window:D.HealthWindow;anchor:string}):Promise<void>;
  stop(connectionId:D.Id):Promise<void>;
}
export interface HealthFileImportPort {
  /** Parse locally in bounded chunks; no upload/network operation is hidden here. */
  preview(file:Blob,signal:AbortSignal):Promise<{metrics:readonly D.HealthMetric[];window:D.HealthWindow;warnings:readonly string[]}>;
  records(file:Blob,selection:{metrics:readonly D.HealthMetric[];window:D.HealthWindow},signal:AbortSignal):AsyncIterable<readonly D.HealthRecordInput[]>;
}
export interface HealthAggregationPort {
  aggregate(input:{samples:readonly D.HealthSample[];window:D.HealthWindow;metrics:readonly D.HealthMetric[];
    policy:D.HealthAggregationPolicy}):readonly D.HealthAggregateValue[];
}
export interface HealthContextPort {
  /** Verifies actor/namespace, consent revision, provider, expiry and source revisions. */
  resolve(scope:RequestScope,contextId:D.Id,providerId:string,now:D.Timestamp):Promise<D.HealthAiContext>;
  /** Minimal provider payload is derived by this service, never supplied by the client. */
  prepareDisclosure(scope:RequestScope,contextId:D.Id,providerId:string):Promise<{disclosure:D.HealthDisclosure;context:D.HealthAiContext}>;
  recordDispatch(scope:RequestScope,disclosureId:D.Id,status:'sent'|'failed'|'canceled',at:D.Timestamp):Promise<void>;
}
export interface PrivateDataSessionPort {
  /** Real data requires an authenticated/pairing-bound actor; demo scope headers are insufficient. */
  requireActor(input:{authorization:string|null;requestedScope:RequestScope;purpose:'health-read'|'health-write'|'health-ai'}):Promise<RequestScope>;
}
export interface ExportHealthGuardPort {
  /** Evaluate inside the export transaction. Machine-derived records require an exact saved proof. */
  evaluate(tx:ReadPort,input:{scope:RequestScope;recordType:string;recordId:D.Id;recordRevision:number;
    requireProvenance:boolean}):{include:true}|{include:false;reason:D.ExportExclusionCount['reason']};
}
export interface OptionalClientServices {
  healthBridge:HealthBridgePort; healthFileImport:HealthFileImportPort; companionEvents:CompanionEventsPort;
}
export interface OptionalClientServiceLookup {
  get<K extends keyof OptionalClientServices>(key:K):OptionalClientServices[K]|undefined;
}
export type ClientServiceEntry<K extends keyof OptionalClientServices=keyof OptionalClientServices> = {[S in K]: {
  kind:'client-service';id:string;provides:S;platform:'web'|'ios'|'all';
  create():OptionalClientServices[S];
}}[K];
