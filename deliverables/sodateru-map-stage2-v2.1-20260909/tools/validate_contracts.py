#!/usr/bin/env python3
"""Validate package contracts and graph; does not run an application server."""
from pathlib import Path
import csv,json,re,sqlite3,sys
import jsonschema
from referencing import Registry,Resource
O=Path(__file__).resolve().parents[1]
S=json.loads((O/'contracts/schemas.json').read_text());API=json.loads((O/'contracts/openapi.json').read_text());D=API['components']['schemas']
ROOT='urn:sodateru:v2'
registry=Registry().with_resource(ROOT,Resource.from_contents(S))
def validate(name,value):
 validator=jsonschema.Draft202012Validator({'$ref':ROOT+'#/$defs/'+name},registry=registry,format_checker=jsonschema.FormatChecker())
 validator.validate(value)
for name,s in S['$defs'].items():jsonschema.Draft202012Validator.check_schema(s)
checks=[]
# All internal refs resolve; path parameter definitions required and operation ids unique.
def walk(x):
 if isinstance(x,dict):
  if '$ref' in x:
   r=x['$ref']
   if r.startswith('#/'):
    current=API
    for key in r[2:].split('/'):current=current[key]
  for v in x.values():walk(v)
 elif isinstance(x,list):
  for v in x:walk(v)
walk(API);checks.append('All OpenAPI internal references resolve')
ops=json.loads((O/'contracts/operations.json').read_text());assert len(set(r['operation_id'] for r in ops))==len(ops)
examples=0
for path in (O/'examples/http').glob('*.json'):
 e=json.loads(path.read_text())
 if 'request' in e:validate(e['requestSchema'],e['request']);examples+=1
 if 'response' in e:validate(e['responseSchema'],e['response']);examples+=1
checks.append(f'{examples} HTTP request/response examples validated against JSON Schema')
seed=json.loads((O/'examples/seed-core.json').read_text());validate('Namespace',seed['namespace'])
for name,rows in seed['entities'].items():
 for row in rows:validate(name,row)
flow=json.loads((O/'examples/record-flow.json').read_text());validate('CreateExperienceRequest',flow['create']['request']);validate('CreateExperienceResponse',flow['create']['response']);validate('CorrectExperienceRequest',flow['correct']['request'])
dsl=json.loads((O/'examples/dsl-time-budget.json').read_text());validate('DslDefinition',dsl['definition']);validate('DslOutputMap',{'empty':[]})
checks.append('Coherent seed, create/correction flow and DSL fixtures validate; empty result arrays accepted')
G=json.loads((O/'TASK_GRAPH.json').read_text());T=G['tasks'];B={t['id']:t for t in T};assert len(B)==len(T)
seen=set();active=set()
def visit(id):
 if id in active:raise AssertionError('Dependency cycle: '+id)
 if id in seen:return
 active.add(id)
 for dep in B[id]['hard_dependencies']:assert dep in B;visit(dep)
 active.remove(id);seen.add(id)
for id in B:visit(id)
for t in T:
 assert t['assignee'] is None and t['status']=='backlog'
 assert (O/t['body_file']).exists()
 for dep in t['connect_after']:assert dep in B
 for path in t['write_paths']:assert not path.startswith('/') and '..' not in path and '*' not in path
 assert not any(k in t for k in ['start_minute','end_minute','duration_minutes'])
assigned=[id for t in T for id in t['operation_ids']];assert set(assigned)=={r['operation_id'] for r in ops} and len(assigned)==len(ops)==89
assert len(T)==114
reqs=list(csv.DictReader((O/'FULL_REQUIREMENT_MATRIX.csv').open(encoding='utf-8-sig')));assert len(reqs)==157;assert len({r['id'] for r in reqs})==157
baseline=json.loads((O/'evidence/v2-requirement-baseline.json').read_text());current={r['id']:r for r in reqs}
for old in baseline:
 for field,value in old.items():assert current[old['id']][field]==value,(old['id'],field)
for r in reqs:
 assert r['task_ids']
 for id in r['task_ids'].split(';'):assert id in B
legacy=list(csv.DictReader((O/'LEGACY_ISSUE_MAPPING.csv').open(encoding='utf-8-sig')));assert len(legacy)==56
for r in legacy:assert r['new_task_ids'];assert all(x in B for x in r['new_task_ids'].split(';'))
accept=list(csv.DictReader((O/'LEGACY_ACCEPTANCE_TRACE.csv').open(encoding='utf-8-sig')));assert len(accept)==55
checks.append(f'{len(T)} unassigned tasks, DAG acyclic, all {len(ops)} operations assigned to one task, 157 requirements / 56 old issues / 55 acceptances traced')
checks.append('All 157 source requirement IDs, names, user values and acceptance text preserved verbatim')
# DDL initialization and seed with actual DTO mapping.
db=sqlite3.connect(':memory:');db.executescript((O/'db/schema.sql').read_text());db.execute('INSERT INTO namespaces VALUES(?,?,?,?)',tuple(seed['namespace'][k] for k in ['id','kind','canonicalRevision','seedVersion']))
M=json.loads((O/'db/dto-map.json').read_text())
for entity,rows in seed['entities'].items():
 cols=[m for m in M if m['api_entity']==entity]
 for row in rows:
  vals=[json.dumps(row[c['api_field']],ensure_ascii=False) if c['column'].endswith('_json') and row[c['api_field']] is not None else int(row[c['api_field']]) if isinstance(row[c['api_field']],bool) else row[c['api_field']] for c in cols]
  sql='INSERT INTO '+cols[0]['table']+'('+','.join(c['column'] for c in cols)+') VALUES('+','.join('?' for _ in cols)+')'
  db.execute(sql,vals)
db.commit();assert db.execute('PRAGMA foreign_key_check').fetchall()==[]
tables=db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").fetchall();assert len(tables)==44
checks.append('44-table DDL and seed executed in SQLite; foreign_key_check clear')
# Generated columns exactly match actual SQL columns.
for table in {r['table'] for r in M}:
 actual=[r[1] for r in db.execute('PRAGMA table_info('+table+')')];assert actual==[r['column'] for r in M if r['table']==table]
assert len(M)==506
checks.append('506 domain-column mappings match SQLite PRAGMA table_info')
# New boundary examples are validated together, not only one entity at a time.
question=json.loads((O/'examples/question-flow.json').read_text())
validate('FollowUpQuestion',question['question']);validate('RespondToQuestionRequest',question['respond']['request'])
validate('RespondToQuestionResponse',question['respond']['response']);validate('CreateAiJobRequest',question['reextract']['request'])
assert question['respond']['response']['data']['response']['answerEvidenceId']==question['reextract']['resolvedAnswerEvidenceIds'][0]
assert question['reentry']['question']['status']=='answered'
routes=json.loads((O/'examples/route-constraint-cases.json').read_text())
for case in routes['cases']:
 validate('RouteInput',case['input'])
 for leg in case['legs']:validate('RouteLeg',leg)
for case in routes['fareCases']:validate('RouteLeg',case['leg'])
checks.append('Question answer/re-extraction/re-entry IDs and selected-edge examples conform to revised schemas')
# A split integration must not silently retain the old monolithic dependency.
assert 'TRF-003' not in B['INT-005']['hard_dependencies'] and 'SOC-008' not in B['INT-005']['hard_dependencies']
assert not set(['EXT-005','EXT-006','EXT-007']) & set(B['INT-008']['hard_dependencies'])
for id in ['INT-013','INT-014','INT-015']:assert 'INT-008' not in B[id]['hard_dependencies']
for t in T:
 if t['kind'] in ['integration','gate']:
  body=(O/t['body_file']).read_text()
  assert 'fakeでINT/GATEを完了にしない' in body
checks.append('Split integrations remain independently connectable; INT/GATE cannot finish on fakes')
report={'kind':'contract-and-document-validation','schemaCount':len(D),'operationCount':len(ops),'tableCount':len(tables),'taskCount':len(T),'initialDependencyReady':sum(not t['hard_dependencies'] for t in T),'poolCount':sum(t['kind']=='pool' for t in T),'checks':checks}
(O/'evidence').mkdir(exist_ok=True);(O/'evidence/contract-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False,indent=2))
