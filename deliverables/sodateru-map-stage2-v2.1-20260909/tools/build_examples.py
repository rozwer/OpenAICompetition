#!/usr/bin/env python3
"""Generate format-only HTTP fixtures and a coherent record/correction example."""
from pathlib import Path
import copy,json,re
O=Path(__file__).resolve().parents[1]
API=json.loads((O/'contracts/openapi.json').read_text());D=API['components']['schemas'];OPS=json.loads((O/'contracts/operations.json').read_text())
def sample(s,name='example'):
 if '$ref' in s:return sample(D[s['$ref'].split('/')[-1]],name)
 if 'const' in s:return s['const']
 if 'enum' in s:return s['enum'][0]
 if 'anyOf' in s or 'oneOf' in s:
  choices=s.get('anyOf',s.get('oneOf'))
  if any(x.get('type')=='null' for x in choices):return None
  return sample(choices[0],name)
 typ=s.get('type')
 if typ=='object':return {k:sample(v,k) for k,v in s.get('properties',{}).items() if k in s.get('required',[])}
 if typ=='array':
  if 'prefixItems' in s:return [sample(x,name) for x in s['prefixItems']]
  return [sample(s['items'],name) for _ in range(s.get('minItems',0))]
 if typ=='boolean':return False
 if typ in ('integer','number'):return max(0,s.get('minimum',0))
 if typ=='null':return None
 if s.get('format')=='date-time':return '2026-09-09T00:00:00Z'
 if s.get('format')=='date':return '2026-09-09'
 if s.get('format')=='uri':return 'https://example.invalid/source'
 if 'pattern' in s:return 'id_example'
 return name[:s.get('maxLength',80)]

def dump(path,x):path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
for r in OPS:
 spec=API['paths'][r['path']][r['method']]
 parameters={}
 for p in spec['parameters']:
  if '$ref' in p:p=API['components']['parameters'][p['$ref'].split('/')[-1]]
  if p['in']=='query' and not p.get('required'):continue
  parameters.setdefault(p['in'],{})[p['name']]=sample(p['schema'],p['name'])
 ex={'note':'形式の例。ID参照先・店舗・道路が存在することやlive接続を保証しない。','operationId':r['operation_id'],'method':r['method'].upper(),'path':r['path'],'parameters':parameters,'requestSchema':r['request_schema'],'responseSchema':r['response_schema'],'successStatus':r['success_status']}
 if r['request_schema']=='multipart':ex['multipart']={'opId':'op_upload','file':'<binary image; not a JSON string>'}
 elif r['request_schema']:ex['request']=sample(D[r['request_schema']])
 if r['response_schema']!='binary':ex['response']=sample(D[r['response_schema']])
 else:ex['responseContentType']='image/png'
 dump(O/'examples/http'/f"{r['operation_id']}.json",ex)
# Coherent seed: actual DTO rows, with namespace-safe foreign keys.
ns={'id':'ns_demo','kind':'demo','canonicalRevision':0,'seedVersion':'core-v2'}
def entity(schema_name,id,**kwargs):
 x=sample(D[schema_name]);x.update(namespaceId='ns_demo',id=id,revision=1,sourceMode='sample')
 if 'actorId' in x:x['actorId']='actor_self'
 x.update(kwargs);return x
actor=entity('Actor','actor_self',displayName='自分（サンプル）',isDemo=True)
settings=entity('Settings','settings_self',aiEnabled=True,discoveryEnabled=True,preferredEntry='map')
ctx=entity('AppContextEntity','context_self');ctx['context']['tab']='map';ctx['context']['lens']='mine';ctx['context']['dimension']='2d'
for k in ['camera2d','camera3d']:ctx['context'][k]={'center':{'longitude':136.9,'latitude':35.1},'zoom':16,'bearing':0,'pitch':0 if k=='camera2d' else 50}
pref=entity('Preference','preference_self')
source=entity('Source','source_seed',name='架空街区seed',provider='sample',url=None,license='Synthetic fixture')
place=entity('Place','place_book',cityId='city_sample',name='サンプルの本の場所',location={'longitude':136.9,'latitude':35.1},categories=['library'],roleTags=['reading','rest'])
place['facts']={k:{'status':'unknown','amountJPY':None,'reason':'サンプルに料金情報なし','sourceIds':[]} if k=='cost' else {'status':'unknown','value':None,'reason':'未取得','sourceIds':[]} for k in place['facts']}
place['provenance']={'sourceMode':'sample','sourceIds':['source_seed'],'executionMode':'rules','retrievedAt':None,'validUntil':None}
seed={'namespace':ns,'entities':{'Actor':[actor],'Settings':[settings],'AppContextEntity':[ctx],'Preference':[pref],'Source':[source],'Place':[place]}}
dump(O/'examples/seed-core.json',seed)
# Create + correction data stay internally linked.
request=sample(D['CreateExperienceRequest']);request['opId']='op_record1'
request['payload'].update(placeId='place_book',originalText='雨を避けて本を読みました。今日は座れる場所が必要でした。',purpose='reading',reason='落ち着いて読みたかった',context={'weather':'rain','companion':'alone','timeBudgetMinutes':45,'timeBand':'day','notes':None},explicitPreference='unspecified')
evidence=entity('Evidence','ev_original',kind='utterance',text=request['payload']['originalText'])
experience=entity('Experience','exp_reading',placeId='place_book',originalEvidenceId='ev_original',evidenceIds=['ev_original'],purpose='reading',reason=request['payload']['reason'],context=request['payload']['context'],explicitPreference='unspecified',status='active')
resp=sample(D['CreateExperienceResponse']);resp['data']={'experience':experience,'evidence':evidence,'visit':None};resp['meta'].update(namespaceId='ns_demo',requestId='req_record1',canonicalRevision=1);resp['changed']=[{'type':n,'id':x['id'],'revision':1,'action':'created'} for n,x in [('Experience',experience),('Evidence',evidence)]];resp['invalidated']=['history:actor_self','meaning:actor_self:place_book']
correction=sample(D['CorrectExperienceRequest']);correction.update(opId='op_correction1',expectedRevision=1);correction['payload']={'patch':{'field':'reason','replacement':'その日は雨を避けて座れたことが理由です。'},'reasonText':'好き嫌いではなく、その日の事情です。'}
flow={'note':'seed-core.jsonのplaceに対する連続操作の契約例。アプリのHTTP実行結果ではない。','headers':{'X-Namespace-Id':'ns_demo','X-Actor-Id':'actor_self'},'create':{'method':'POST','path':'/api/v1/experiences','request':request,'response':resp},'correct':{'method':'POST','path':'/api/v1/experiences/exp_reading/corrections','request':correction},'expectedAfter':{'experienceRevision':2,'originalEvidenceTextUnchanged':True,'purposeUnchanged':'reading','reason':correction['payload']['patch']['replacement'],'confirmedVisitCountUnchanged':True}}
dump(O/'examples/record-flow.json',flow)
# A fully specified finite DSL, not just a title card.
definition={'schemaVersion':'dsl.v1','inputs':[{'key':'budget','label':'使える時間（分）','type':'number','required':True},{'key':'travel','label':'移動時間（分）','type':'number','required':True},{'key':'title','label':'カード名','type':'string','required':True},{'key':'status','label':'表示区分','type':'string','required':True}], 'steps':[{'id':'remaining','op':'subtract','inputKeys':['input.budget','input.travel'],'outputKey':'remaining'},{'id':'card','op':'formatCard','inputKeys':['input.title','step.remaining','input.status'],'outputKey':'card'}],'outputKeys':['step.remaining','step.card'],'hostSlot':'route-panel'}
dump(O/'examples/dsl-time-budget.json',{'definition':definition,'cases':[{'inputs':{'budget':45,'travel':20,'title':'残り時間','status':'info'},'expectedRemaining':25},{'inputs':{'budget':30,'travel':40,'title':'残り時間','status':'info'},'expectedRemaining':-10}],'note':'有限演算の受入用fixture。実行器そのものはEXT-001で実装する。'})
http='''# REST Client形式。APIアプリの実装後に使用する。\n@base = http://127.0.0.1:8787\n\n### 記録を保存\nPOST {{base}}/api/v1/experiences\nContent-Type: application/json\nX-Namespace-Id: ns_demo\nX-Actor-Id: actor_self\n\n'''+json.dumps(request,ensure_ascii=False,indent=2)+'''\n\n### experienceIdは作成responseの実IDへ置換\nPOST {{base}}/api/v1/experiences/exp_reading/corrections\nContent-Type: application/json\nX-Namespace-Id: ns_demo\nX-Actor-Id: actor_self\n\n'''+json.dumps(correction,ensure_ascii=False,indent=2)+'\n'
(O/'examples/record-flow.http').write_text(http)
print('Generated',len(OPS),'HTTP examples, seed, flow, DSL')
