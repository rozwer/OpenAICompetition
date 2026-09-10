#!/usr/bin/env python3
"""Generate TypeScript DTOs from the shipped OpenAPI schemas; no network access."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def typ(s):
 if '$ref' in s:return s['$ref'].rsplit('/',1)[-1]
 if 'const' in s:return json.dumps(s['const'],ensure_ascii=False)
 if 'enum' in s:return ' | '.join(json.dumps(x,ensure_ascii=False) for x in s['enum'])
 for key in ('oneOf','anyOf'):
  if key in s:return '('+' | '.join(typ(x) for x in s[key])+')'
 if 'allOf' in s:return '('+' & '.join(typ(x) for x in s['allOf'])+')'
 t=s.get('type')
 if isinstance(t,list):return '('+' | '.join(typ({'type':x}) for x in t)+')'
 if t in ('integer','number'):return 'number'
 if t=='string':return 'string'
 if t=='boolean':return 'boolean'
 if t=='null':return 'null'
 if t=='array':
  if 'prefixItems' in s:return '['+', '.join(typ(x) for x in s['prefixItems'])+']'
  return 'Array<'+typ(s['items'])+'>'
 if t=='object':
  ps=s.get('properties',{});required=s.get('required',[])
  if not ps and isinstance(s.get('additionalProperties'),dict):return 'Record<string, '+typ(s['additionalProperties'])+'>'
  return '{\n'+''.join('  '+json.dumps(k,ensure_ascii=False)+('' if k in required else '?')+': '+typ(v)+';\n' for k,v in ps.items())+'}'
 raise ValueError('Unsupported schema '+str(s))
def main():
 api=json.loads((ROOT/'contracts/openapi.json').read_text());d=api['components']['schemas']
 content='// Generated from openapi.json. Edit schema first, then regenerate.\n'
 content+='\n\n'.join('export type '+k+' = '+typ(v)+';' for k,v in d.items())+'\n'
 (ROOT/'contracts/domain.ts').write_text(content)
 generate_operations(api)
 print('Generated',len(d),'types')

def qualified(s):
 if isinstance(s,dict):
  return {k:('#/D.'+v.rsplit('/',1)[-1] if k=='$ref' else qualified(v)) for k,v in s.items()}
 if isinstance(s,list):return [qualified(x) for x in s]
 return s

def generate_operations(api):
 lines=['// Generated from OpenAPI. Operation ID determines path/query/body/response.','import type * as D from "./domain";','export interface OperationMap {']
 http={}
 for path,methods in api['paths'].items():
  for method,spec in methods.items():
   if method not in ('get','post','put','patch','delete'):continue
   ps={'path':{},'query':{}};required={'path':[],'query':[]}
   for raw in spec.get('parameters',[]):
    par=api['components']['parameters'][raw['$ref'].rsplit('/',1)[-1]] if '$ref' in raw else raw
    where=par['in']
    if where not in ps:continue
    ps[where][par['name']]=par['schema']
    if par.get('required'):required[where].append(par['name'])
   fields=[]
   for where in ('path','query'):
    if ps[where]:
     schema={'type':'object','properties':ps[where],'required':required[where]}
     fields.append(where+('' if where=='path' or required[where] else '?')+': '+typ(qualified(schema)))
    else:fields.append(where+'?: never')
   content=spec.get('requestBody',{}).get('content',{})
   if 'application/json' in content:fields.append('body: '+typ(qualified(content['application/json']['schema'])))
   elif 'multipart/form-data' in content:fields.append('body: {opId: D.Id; file: Blob}')
   else:fields.append('body?: never')
   status=next(k for k in spec['responses'] if k.startswith('2'))
   response=spec['responses'][status].get('content',{})
   out=typ(qualified(response['application/json']['schema'])) if 'application/json' in response else 'Uint8Array'
   id=spec['operationId'];lines.append('  '+json.dumps(id)+': { request: { '+ '; '.join(fields)+' }; response: '+out+'; successStatus: '+status+' };')
   http[id]={'method':method.upper(),'path':path,'successStatus':int(status),'bodyKind':'json' if 'application/json' in content else 'multipart' if content else 'none'}
 lines+=['}','export type OperationId = keyof OperationMap;','export type OperationRequest<K extends OperationId> = OperationMap[K]["request"];','export type OperationResponse<K extends OperationId> = OperationMap[K]["response"];','export const OPERATION_HTTP = '+json.dumps(http,ensure_ascii=False,indent=2)+' as const;']
 (ROOT/'contracts/operations.ts').write_text('\n'.join(lines)+'\n')
if __name__=='__main__':main()
