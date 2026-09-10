from pathlib import Path
import json,re,sqlite3,csv
O=Path(__file__).resolve().parents[1]
D=json.loads((O/'contracts/openapi.json').read_text())['components']['schemas'];E=json.loads((O/'contracts/entities.json').read_text())
def resolve(s):
 while '$ref' in s:s=D[s['$ref'].split('/')[-1]]
 null=False
 if 'anyOf' in s and len(s['anyOf'])==2 and any(x.get('type')=='null' for x in s['anyOf']):
  null=True;s=next(x for x in s['anyOf'] if x.get('type')!='null');s=resolve(s)[0]
 return s,null
def snake(s):return re.sub(r'(?<!^)(?=[A-Z])','_',s).lower().replace('j_p_y','jpy')
rows=[];stmts=['-- 育てる地図 schema v2; real columns for scalars, typed JSON only for nested values.','PRAGMA foreign_keys = ON;','PRAGMA journal_mode = WAL;','PRAGMA busy_timeout = 3000;', '''CREATE TABLE namespaces (
 id TEXT PRIMARY KEY,
 kind TEXT NOT NULL CHECK(kind IN ('user','demo')),
 canonical_revision INTEGER NOT NULL DEFAULT 0 CHECK(canonical_revision >= 0),
 seed_version TEXT
);''']
fkmap={'actorId':'actors','peerId':'actors','recipientActorId':'actors','sourceId':'sources','heightSourceId':'sources','buildingId':'buildings','placeId':'places','visitId':'visits','originalEvidenceId':'evidence','experienceId':'experiences','reasonEvidenceId':'evidence','assetId':'assets','routePlanId':'route_plans','selectedRoutePlanId':'route_plans','recipeId':'recipes','candidateSetId':'candidate_sets','ownExperienceId':'experiences','sourceExperienceId':'experiences','transferPlanId':'transfer_plans','cardId':'discovery_cards','sourceEventId':'discovery_events','extensionId':'extensions','activeVersionId':'extension_versions','previousVersionId':'extension_versions','versionId':'extension_versions','snapshotId':'source_snapshots','jobId':'ai_jobs','questionId':'follow_up_questions','answerEvidenceId':'evidence'}
# A city id is a namespaced dataset key, NOT a row reference. Nested array reference integrity is checked by handlers.
unique={ 'follow_up_questions':[['namespace_id','actor_id','dedup_key']], 'settings':[['namespace_id','actor_id']], 'app_contexts':[['namespace_id','actor_id']], 'preferences':[['namespace_id','actor_id']], 'observations':[['namespace_id','actor_id','source_id','source_record_id']], 'interests':[['namespace_id','actor_id','concept_id']], 'extension_installs':[['namespace_id','actor_id','extension_id']], 'extension_versions':[['namespace_id','extension_id','version_tag']]}
for entity,table in E.items():
 cols=[];fks=[];props=D[entity]['properties']
 for field,raw in props.items():
  s,null=resolve(raw);typ=s.get('type');col=snake(field);isjson=typ in ('object','array') or 'oneOf' in s or 'anyOf' in s or isinstance(typ,list)
  if isjson:col+='_json';sqltype='TEXT'
  elif typ=='boolean':sqltype='INTEGER'
  elif typ=='integer':sqltype='INTEGER'
  elif typ=='number':sqltype='REAL'
  else:sqltype='TEXT'
  bits=[col,sqltype]
  required=field in D[entity]['required'] and not null
  if required:bits.append('NOT NULL')
  checks=[]
  if isjson:checks.append(f'json_valid({col})')
  else:
   if typ=='boolean':checks.append(f'{col} IN (0,1)')
   if 'enum' in s:checks.append(f"{col} IN ({','.join(repr(x) for x in s['enum'])})")
   if 'minimum' in s:checks.append(f"{col} >= {s['minimum']}")
   if 'maximum' in s:checks.append(f"{col} <= {s['maximum']}")
   if 'maxLength' in s:checks.append(f"length({col}) <= {s['maxLength']}")
  if checks:bits.append('CHECK('+ (f'{col} IS NULL OR ('+' AND '.join(checks)+')' if null else ' AND '.join(checks))+')')
  cols.append('  '+' '.join(bits))
  if field in fkmap and not isjson:
   fks.append(f'  FOREIGN KEY(namespace_id,{col}) REFERENCES {fkmap[field]}(namespace_id,id) DEFERRABLE INITIALLY DEFERRED')
  rows.append({'table':table,'column':col,'sqlite_type':sqltype,'nullable':not required,'api_entity':entity,'api_field':field,'json_schema':raw.get('$ref','inline:'+entity+'.'+field) if isjson else '', 'foreign_key':f"{fkmap[field]}(namespace_id,id)" if field in fkmap and not isjson else '', 'validation':'SQL CHECK + contracts/schemas.json'+ ('; nested ID membership in handler' if isjson else '')})
 cols+=['  PRIMARY KEY(namespace_id,id)','  FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE']+fks
 for uk in unique.get(table,[]):cols.append('  UNIQUE('+','.join(uk)+')')
 stmts.append('CREATE TABLE '+table+' (\n'+',\n'.join(cols)+'\n);')
 if 'actorId' in props:stmts.append(f'CREATE INDEX ix_{table}_actor ON {table}(namespace_id,actor_id);')
 if 'placeId' in props:stmts.append(f'CREATE INDEX ix_{table}_place ON {table}(namespace_id,place_id);')
 if 'status' in props:stmts.append(f'CREATE INDEX ix_{table}_status ON {table}(namespace_id,status);')
stmts += [ '''CREATE TABLE request_dedup (
 namespace_id TEXT NOT NULL,
 actor_id TEXT NOT NULL,
 op_id TEXT NOT NULL,
 payload_hash TEXT NOT NULL,
 http_status INTEGER NOT NULL,
 response_json TEXT NOT NULL CHECK(json_valid(response_json)),
 created_at TEXT NOT NULL,
 PRIMARY KEY(namespace_id,actor_id,op_id),
 FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE,
 FOREIGN KEY(namespace_id,actor_id) REFERENCES actors(namespace_id,id) DEFERRABLE INITIALLY DEFERRED
);''', '''CREATE TABLE change_events (
 sequence INTEGER PRIMARY KEY AUTOINCREMENT,
 namespace_id TEXT NOT NULL,
 actor_id TEXT NOT NULL,
 canonical_revision INTEGER NOT NULL CHECK(canonical_revision >= 1),
 changed_json TEXT NOT NULL CHECK(json_valid(changed_json)),
 invalidated_json TEXT NOT NULL CHECK(json_valid(invalidated_json)),
 created_at TEXT NOT NULL,
 FOREIGN KEY(namespace_id) REFERENCES namespaces(id) ON DELETE CASCADE
);''', 'CREATE INDEX ix_changes_namespace ON change_events(namespace_id,sequence);', '''CREATE TABLE asset_storage (
 namespace_id TEXT NOT NULL,
 asset_id TEXT NOT NULL,
 relative_path TEXT NOT NULL,
 PRIMARY KEY(namespace_id,asset_id),
 FOREIGN KEY(namespace_id,asset_id) REFERENCES assets(namespace_id,id) ON DELETE CASCADE
);''']
(O/'db/schema.sql').write_text('\n\n'.join(stmts)+'\n')
with (O/'DB_COLUMNS.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
# DTO mapper contract is explicit; not a dynamic SQL endpoint.
(O/'db/dto-map.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
con=sqlite3.connect(':memory:');con.executescript((O/'db/schema.sql').read_text())
print('Tables',len(con.execute("select name from sqlite_master where type='table' and name != 'sqlite_sequence'").fetchall()),'columns',len(rows),'foreign_keys',con.execute('pragma foreign_keys').fetchone())
