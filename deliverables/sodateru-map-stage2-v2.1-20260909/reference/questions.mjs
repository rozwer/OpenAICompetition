/** Executable contract example. The application HTTP adapter is AI-008, not this file. */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {mutate,apiError,canonicalJson} from '../db/mutation-reference.mjs';
const mapping=JSON.parse(readFileSync(new URL('../db/dto-map.json',import.meta.url),'utf8'));
const cols=entity=>mapping.filter(c=>c.api_entity===entity);
export function insertEntity(db,entity,row) {
  const cs=cols(entity);db.prepare(`INSERT INTO ${cs[0].table}(${cs.map(c=>c.column).join(',')}) VALUES(${cs.map(()=>'?').join(',')})`)
    .run(...cs.map(c=>row[c.api_field]===null?null:c.column.endsWith('_json')?JSON.stringify(row[c.api_field]):typeof row[c.api_field]==='boolean'?Number(row[c.api_field]):row[c.api_field]));
}
export function readEntity(db,entity,namespaceId,id) {
  const cs=cols(entity),row=db.prepare(`SELECT * FROM ${cs[0].table} WHERE namespace_id=? AND id=?`).get(namespaceId,id);
  if(!row)return null;
  return Object.fromEntries(cs.map(c=>[c.api_field,c.column.endsWith('_json')&&row[c.column]!==null?JSON.parse(row[c.column]):row[c.column]]));
}
function own(row,scope) {
  if(!row || row.actorId!==scope.actorId || row.namespaceId!==scope.namespaceId)throw apiError('NOT_FOUND',404,'Not available in this scope');
  return row;
}
export function proposeQuestion(db,{scope,experience,jobId,proposal,inputVersions,now,questionId,sourceMode}) {
  if(!db.isTransaction)throw new Error('Question proposal must join the existing transaction');
  own(experience,scope);
  const dedupKey=createHash('sha256').update(canonicalJson({namespaceId:scope.namespaceId,actorId:scope.actorId,experienceId:experience.id,originalEvidenceId:experience.originalEvidenceId,topic:proposal.topic})).digest('hex');
  if(db.prepare('SELECT id FROM follow_up_questions WHERE namespace_id=? AND actor_id=? AND dedup_key=?').get(scope.namespaceId,scope.actorId,dedupKey))return null;
  const question={namespaceId:scope.namespaceId,id:questionId,revision:1,createdAt:now,updatedAt:now,sourceMode,actorId:scope.actorId,experienceId:experience.id,jobId,topic:proposal.topic,text:proposal.text,dedupKey,inputVersions,status:'open'};
  insertEntity(db,'FollowUpQuestion',question);return question;
}
export function respondToQuestion(db,context,questionId,body,ids,now) {
  own(readEntity(db,'FollowUpQuestion',context.namespaceId,questionId),context);
  return mutate(db,{...context,body},200,()=>{
    const question=own(readEntity(db,'FollowUpQuestion',context.namespaceId,questionId),context);
    const experience=own(readEntity(db,'Experience',context.namespaceId,question.experienceId),context);
    if(question.revision!==body.expectedRevision)throw apiError('REVISION_CONFLICT',409,'Question changed');
    if(question.status==='answered')throw apiError('REVISION_CONFLICT',409,'Already answered');
    if(question.status==='stale'||experience.status==='deleted'||question.inputVersions.some(v=>v.type==='Experience'&&v.id===experience.id&&v.revision!==experience.revision))throw apiError('STALE_INPUT',409,'Source changed');
    const {action,answerText}=body.payload;
    if(!['answered','deferred','skipped'].includes(action)||
      (action==='answered'?(typeof answerText!=='string'||!answerText.trim()):answerText!==null))
      throw apiError('VALIDATION_ERROR',422,'Answer required only for answered');
    if(question.status==='skipped'&&action!=='answered')throw apiError('REVISION_CONFLICT',409,'Skipped question requires explicit answer');
    const common={namespaceId:context.namespaceId,revision:1,createdAt:now,updatedAt:now,sourceMode:'user',actorId:context.actorId};
    const evidence=action==='answered'?{...common,id:ids.evidenceId,kind:'utterance',text:answerText,sourceId:null,assetId:null}:null;
    if(evidence)insertEntity(db,'Evidence',evidence);
    const response={...common,id:ids.responseId,questionId,experienceId:experience.id,action,answerEvidenceId:evidence?.id??null};
    insertEntity(db,'QuestionResponse',response);
    db.prepare('UPDATE follow_up_questions SET status=?,revision=revision+1,updated_at=? WHERE namespace_id=? AND id=?').run(action,now,context.namespaceId,questionId);
    const changed=[{type:'FollowUpQuestion',id:questionId,revision:question.revision+1,action:'updated'},{type:'QuestionResponse',id:response.id,revision:1,action:'created'}];
    if(evidence) {
      const refs=[...new Set([...experience.evidenceIds,evidence.id])];
      db.prepare('UPDATE experiences SET evidence_ids_json=?,revision=revision+1,updated_at=? WHERE namespace_id=? AND id=?').run(JSON.stringify(refs),now,context.namespaceId,experience.id);
      changed.push({type:'Evidence',id:evidence.id,revision:1,action:'created'},{type:'Experience',id:experience.id,revision:experience.revision+1,action:'updated'});
    }
    return {data:{question:{...question,status:action,revision:question.revision+1,updatedAt:now},response,evidence},changed,invalidated:[`questions:${context.actorId}:${experience.id}`]};
  });
}
export function resolveAnswerEvidence(db,scope,experienceId,responseIds) {
  return responseIds.map(id=>{
    const response=own(readEntity(db,'QuestionResponse',scope.namespaceId,id),scope);
    if(response.experienceId!==experienceId||response.action!=='answered')throw apiError('UNAUTHORIZED_SCOPE',403,'Not an answer for this experience');
    return own(readEntity(db,'Evidence',scope.namespaceId,response.answerEvidenceId),scope);
  });
}
