/** Executable reference for FND-002. Not an HTTP server or a completed application. */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

export function canonicalJson(value) {
  if (value === null || ['string','boolean'].includes(typeof value)) return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype)
    return '{' + Object.keys(value).sort().map(k => JSON.stringify(k)+':'+canonicalJson(value[k])).join(',') + '}';
  throw new TypeError('Body must be finite JSON values, without undefined');
}
export function openDatabase(filename=':memory:', {initialize=false}={}) {
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=3000;');
  if (initialize) db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  return db;
}
export function apiError(code, status, message) {return Object.assign(new Error(message),{code,status});}
export function mutate(db, ctx, status, work) {
  const hash=createHash('sha256').update(canonicalJson({method:ctx.method,path:ctx.path,body:ctx.body})).digest('hex');
  db.exec('BEGIN IMMEDIATE');
  try {
    const previous=db.prepare('SELECT * FROM request_dedup WHERE namespace_id=? AND actor_id=? AND op_id=?')
      .get(ctx.namespaceId,ctx.actorId,ctx.opId);
    if (previous) {
      if (previous.payload_hash!==hash) throw apiError('IDEMPOTENCY_CONFLICT',409,'opId already used with another request');
      db.exec('COMMIT');return {status:previous.http_status,body:JSON.parse(previous.response_json),replayed:true};
    }
    const actor=db.prepare('SELECT id FROM actors WHERE namespace_id=? AND id=?').get(ctx.namespaceId,ctx.actorId);
    if (!actor) throw apiError('UNAUTHORIZED_SCOPE',403,'Unknown actor/namespace');
    const result=work(db);
    if (!result || typeof result.then==='function') throw new TypeError('Transaction callback must be synchronous');
    db.prepare('UPDATE namespaces SET canonical_revision=canonical_revision+1 WHERE id=?').run(ctx.namespaceId);
    const revision=db.prepare('SELECT canonical_revision FROM namespaces WHERE id=?').get(ctx.namespaceId).canonical_revision;
    const response={data:result.data,meta:{requestId:ctx.requestId,namespaceId:ctx.namespaceId,canonicalRevision:revision,nextCursor:null},changed:result.changed,invalidated:result.invalidated};
    const now=new Date().toISOString();
    db.prepare('INSERT INTO change_events(namespace_id,actor_id,canonical_revision,changed_json,invalidated_json,created_at) VALUES(?,?,?,?,?,?)')
      .run(ctx.namespaceId,ctx.actorId,revision,JSON.stringify(result.changed),JSON.stringify(result.invalidated),now);
    db.prepare('INSERT INTO request_dedup VALUES(?,?,?,?,?,?,?)')
      .run(ctx.namespaceId,ctx.actorId,ctx.opId,hash,status,JSON.stringify(response),now);
    db.exec('COMMIT');return {status,body:response,replayed:false};
  } catch(error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  }
}
