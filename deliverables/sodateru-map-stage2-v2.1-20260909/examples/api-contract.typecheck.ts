import type { ApiPort } from '../contracts/ports';
import type { GetExperienceResponse } from '../contracts/domain';
declare const api: ApiPort;
const scope={namespaceId:'ns_demo',actorId:'actor_self'};
const valid:Promise<GetExperienceResponse>=api.invoke('getExperience',{path:{experienceId:'exp_one'}},scope);
void valid;
api.invoke('getHealth',{},scope);
// @ts-expect-error unknown operation IDs must fail
api.invoke('notAnOperation',{},scope);
// @ts-expect-error getExperience needs its path parameter
api.invoke('getExperience',{},scope);
// @ts-expect-error GET does not accept a mutation body
api.invoke('getExperience',{path:{experienceId:'exp_one'},body:{opId:'op_wrong'}},scope);
// @ts-expect-error response is determined by operation, not caller-selected
const wrong:Promise<number>=api.invoke('getExperience',{path:{experienceId:'exp_one'}},scope);
// @ts-expect-error arbitrary payload cannot stand in for CreateExperienceRequest
api.invoke('createExperience',{body:{unrelated:true}},scope);
