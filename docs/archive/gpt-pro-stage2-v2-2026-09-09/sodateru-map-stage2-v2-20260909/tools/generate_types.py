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
 d=json.loads((ROOT/'contracts/openapi.json').read_text())['components']['schemas']
 content='// Generated from openapi.json. Edit schema first, then regenerate.\n'
 content+='\n\n'.join('export type '+k+' = '+typ(v)+';' for k,v in d.items())+'\n'
 (ROOT/'contracts/domain.ts').write_text(content)
 print('Generated',len(d),'types')
if __name__=='__main__':main()
