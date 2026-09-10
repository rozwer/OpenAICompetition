/** Reference registry checks for FND-001. No network, application boot or receipt creation. */
import type { UIEntry, ServerEntry, IntegrationEntry, ConnectionReceipt, ServiceLookup,
  HandlerRegistrar, OperationHandler, CapabilityId } from '../contracts/entries';
import type { OperationId } from '../contracts/operations';
import { OPERATION_HTTP } from '../contracts/operations';

export function inspectEntries<View>(input:{ui:readonly UIEntry<View>[];server:readonly ServerEntry[];
  integrations:readonly IntegrationEntry[];receipts:readonly ConnectionReceipt[];
  buildRevision:string;services:ServiceLookup}) {
  const ids=new Set<string>();
  for(const entry of [...input.ui,...input.server,...input.integrations]) {
    if(ids.has(entry.manifest.id)) throw new Error('Duplicate entry ID: '+entry.manifest.id);
    ids.add(entry.manifest.id);
  }
  const operations=new Map<OperationId,{handler:unknown;mode:ServerEntry['manifest']['mode']}>();
  const capabilities=new Set<CapabilityId>();
  for(const entry of input.server) {
    for(const service of entry.manifest.requiresServices) input.services.get(service);
    const staged=new Map<OperationId,unknown>();
    const registrar:HandlerRegistrar={register<K extends OperationId>(id:K,handler:OperationHandler<K>) {
      if(!(id in OPERATION_HTTP)) throw new Error('Unknown operation: '+id);
      if(operations.has(id)||staged.has(id)) throw new Error('Duplicate operation: '+id);
      staged.set(id,handler);
    }};
    entry.register(registrar,input.services);
    if(new Set(entry.manifest.operationIds).size!==entry.manifest.operationIds.length ||
      staged.size!==entry.manifest.operationIds.length || entry.manifest.operationIds.some(id=>!staged.has(id)))
      throw new Error('Registered operations differ from manifest: '+entry.manifest.id);
    for(const [id,handler] of staged) {
      operations.set(id,{handler,mode:entry.manifest.mode});
      if(entry.manifest.mode==='implementation')capabilities.add(`api:${id}`);
    }
  }
  const uiIds=new Set(input.ui.map(x=>x.manifest.id)),serverIds=new Set(input.server.map(x=>x.manifest.id));
  for(const entry of input.integrations) {
    const plan=entry.wire();
    for(const id of plan.uiEntryIds)if(!uiIds.has(id))throw new Error('Unknown UI entry: '+id);
    for(const id of plan.serverEntryIds)if(!serverIds.has(id))throw new Error('Unknown server entry: '+id);
  }
  // Ordering is dependency based, never the order returned by a filesystem glob.
  const pending=[...input.integrations];let progress=true;
  while(progress) {
    progress=false;
    for(let i=pending.length-1;i>=0;i--) {
      const entry=pending[i];
      if(!entry.manifest.requiresCapabilities.every(c=>capabilities.has(c)))continue;
      const receipt=input.receipts.find(r=>r.integrationId===entry.manifest.id && r.buildRevision===input.buildRevision);
      if(!receipt || receipt.evidencePaths.length===0 ||
        receipt.operationIds.some(id=>operations.get(id)?.mode!=='implementation'))continue;
      if(entry.manifest.requiresLiveAI&&receipt.aiMode!=='live-codex')continue;
      // A fixture-only handler must never become production-ready via a receipt.
      const servers=entry.wire().serverEntryIds.map(id=>input.server.find(e=>e.manifest.id===id)!);
      if(servers.some(s=>s.manifest.mode!=='implementation'))continue;
      const needed=servers.flatMap(s=>s.manifest.operationIds);
      if(needed.some(id=>!receipt.operationIds.includes(id)))continue;
      capabilities.add(entry.manifest.providesCapability);pending.splice(i,1);progress=true;
    }
  }
  return {capabilities,operations,enabledUI:input.ui.filter(e=>e.manifest.requiresCapabilities.every(c=>capabilities.has(c))).map(e=>e.manifest.id)};
}
