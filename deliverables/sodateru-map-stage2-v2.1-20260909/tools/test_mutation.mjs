/** Tests the reference transaction helper only; not app endpoints. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { openDatabase, mutate, apiError } from '../db/mutation-reference.mjs';
const root = new URL('../', import.meta.url);
const read = p => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
const seed=read('examples/seed-core.json'), map=read('db/dto-map.json');
const db=openDatabase(':memory:',{initialize:true});
const checks=[];
function insert(entity, data) {
 const cols=map.filter(c=>c.api_entity===entity);
 const values=cols.map(c=>{
  const v=data[c.api_field];
  return v===null?null:c.column.endsWith('_json')?JSON.stringify(v):typeof v==='boolean'?Number(v):v;
 });
 db.prepare(`INSERT INTO ${cols[0].table}(${cols.map(c=>c.column).join(',')}) VALUES(${cols.map(()=>'?').join(',')})`).run(...values);
}
const ns=seed.namespace;
db.exec('BEGIN');
db.prepare('INSERT INTO namespaces VALUES(?,?,?,?)').run(ns.id,ns.kind,ns.canonicalRevision,ns.seedVersion);
for(const [entity,rows] of Object.entries(seed.entities)) for(const row of rows) insert(entity,row);
db.exec('COMMIT');
const ctx={namespaceId:'ns_demo',actorId:'actor_self',opId:'op_first',method:'POST',path:'/api/v1/experiences',body:{opId:'op_first',payload:{text:'saved'}},requestId:'req_first'};
const flow=read('examples/record-flow.json');let called=0;
const first=mutate(db,ctx,201,()=>{
 called++;insert('Evidence',flow.create.response.data.evidence);insert('Experience',flow.create.response.data.experience);
 return {data:flow.create.response.data,changed:flow.create.response.changed,invalidated:flow.create.response.invalidated};
});
assert.equal(first.body.meta.canonicalRevision,1);assert.equal(db.prepare('SELECT COUNT(*) n FROM experiences').get().n,1);checks.push('Evidence/Experience/change_events/dedup commit atomically');
const again=mutate(db,{...ctx,requestId:'req_retry',body:{payload:{text:'saved'},opId:'op_first'}},201,()=>{throw new Error('must not run');});
assert.equal(again.replayed,true);assert.deepEqual(again.body,first.body);assert.equal(called,1);assert.equal(db.prepare('SELECT canonical_revision r FROM namespaces').get().r,1);checks.push('Same opId and equivalent key ordering replays original response without a second write');
assert.throws(()=>mutate(db,{...ctx,body:{opId:'op_first',payload:{text:'different'}}},201,()=>({})),e=>e.code==='IDEMPOTENCY_CONFLICT');checks.push('Same opId with changed body returns conflict');
let before=db.prepare('SELECT reason,revision FROM experiences WHERE id=?').get('exp_reading');
assert.throws(()=>mutate(db,{...ctx,opId:'op_rollback',body:{}},200,()=>{
 db.prepare('UPDATE experiences SET reason=?,revision=revision+1 WHERE id=?').run('should rollback','exp_reading');throw new Error('intentional');
}),/intentional/);
assert.deepEqual(db.prepare('SELECT reason,revision FROM experiences WHERE id=?').get('exp_reading'),before);assert.equal(db.prepare('SELECT COUNT(*) n FROM request_dedup').get().n,1);checks.push('Exception rolls back entity writes and does not create a dedup receipt');
const update=(expected,opId)=>mutate(db,{...ctx,opId,method:'POST',path:'/api/v1/experiences/exp_reading/corrections',body:{opId,expectedRevision:expected,payload:{reason:'rain'}}},200,()=>{
 const r=db.prepare('UPDATE experiences SET reason=?,revision=revision+1 WHERE namespace_id=? AND id=? AND revision=?').run('rain','ns_demo','exp_reading',expected);
 if(r.changes!==1)throw apiError('REVISION_CONFLICT',409,'changed');
 return {data:{id:'exp_reading',revision:expected+1,status:'updated'},changed:[{type:'Experience',id:'exp_reading',revision:expected+1,action:'updated'}],invalidated:[]};
});
update(1,'op_edit1');assert.throws(()=>update(1,'op_edit2'),e=>e.code==='REVISION_CONFLICT');assert.equal(db.prepare('SELECT revision r FROM experiences').get().r,2);checks.push('Competing expectedRevision updates: first commits, second conflicts');
assert.equal(db.prepare('SELECT text FROM evidence WHERE id=?').get('ev_original').text,flow.create.response.data.evidence.text);checks.push('Example reason update leaves original evidence unchanged');
assert.throws(()=>mutate(db,{...ctx,opId:'op_cross',body:{}},201,()=>{
 insert('Experience',{...flow.create.response.data.experience,id:'exp_bad',placeId:'place_not_in_namespace'});
 return {data:{},changed:[],invalidated:[]};
}));assert.equal(db.prepare('SELECT COUNT(*) n FROM experiences WHERE id=?').get('exp_bad').n,0);checks.push('Missing same-namespace foreign key fails commit and rolls back');
assert.throws(()=>mutate(db,{...ctx,opId:'op_async',body:{}},200,()=>Promise.resolve({})),/synchronous/);checks.push('Async transaction callback rejected');
assert.throws(()=>mutate(db,{...ctx,opId:'op_actor',actorId:'actor_unknown',body:{}},200,()=>({})),e=>e.code==='UNAUTHORIZED_SCOPE');checks.push('Unknown actor/namespace rejected');
assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);assert.equal(db.isTransaction,false);checks.push('No FK violations or dangling open transaction after failure cases');
const result={kind:'node-sqlite-reference-tests',node:process.version,sqlite:db.prepare('SELECT sqlite_version() v').get().v,passed:checks.length,checks,scope:'Reference helper and test callbacks only; runtime version recorded above; not HTTP handlers'};
db.close();mkdirSync(new URL('evidence/',root),{recursive:true});writeFileSync(new URL('evidence/mutation-tests.json',root),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
