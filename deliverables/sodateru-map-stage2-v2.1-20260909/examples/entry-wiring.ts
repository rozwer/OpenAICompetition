/** Compile/run fixture for the entry ABI. No app HTTP server or live AI is implemented. */
import type { BrowserCatalog, HandlerRegistrar, IntegrationEntry, ServerEntry,
  ServiceLookup, UIEntry, UIProps } from '../contracts/entries';
import type { GetHealthResponse } from '../contracts/domain';

export const healthServer = {
  kind:'server',
  manifest:{id:'core.health',operationIds:['getHealth'],requiresServices:[],
    readTables:[],writeTables:[],mode:'fixture'},
  register(registrar:HandlerRegistrar, _services:ServiceLookup) {
    registrar.register('getHealth', () => healthFixture);
  }
} satisfies ServerEntry;

// Shape fixture only. Its manifest explicitly marks it as fixture, so it cannot unlock a production capability.
export const healthFixture:GetHealthResponse={
  data:{status:'ok',apiVersion:'v1',ai:'available',db:'ready',capabilities:[]},
  meta:{requestId:'req_fixture',namespaceId:null,canonicalRevision:0,nextCursor:null},
  changed:[],invalidated:[]
};

export const healthUI = {
  kind:'ui',
  manifest:{id:'core.health-ui',order:0,slots:['tab'],requiresCapabilities:['api:getHealth']},
  Component(_props:UIProps) { return 'Health fixture'; }
} satisfies UIEntry<string>;

export const integration = {
  kind:'integration',
  manifest:{id:'INT-EXAMPLE',requiresCapabilities:['api:getHealth'],providesCapability:'integration:INT-EXAMPLE',requiresLiveAI:false},
  wire() { return {uiEntryIds:['core.health-ui'],serverEntryIds:['core.health']}; }
} satisfies IntegrationEntry;

export const browserCatalog:BrowserCatalog<string>={ui:[healthUI],integrations:[integration]};
// Actual files default-export exactly one descriptor, e.g.:
export default healthServer;
