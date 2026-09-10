import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { RouteInput, RouteLeg } from '../contracts/domain';
import { edgeCondition,knownAdditionalFare } from '../reference/route-constraints';
const file=process.argv[2];if(!file)throw new Error('Pass route-constraint-cases.json');
const cases=JSON.parse(readFileSync(file,'utf8')) as {cases:{name:string;input:RouteInput;legs:RouteLeg[];condition:'avoidStairs'|'requireCovered'|'vehicleClass';expected:'pass'|'fail'|'unknown'}[];fareCases:{leg:RouteLeg;expected:number|null}[]};
for(const test of cases.cases)assert.equal(edgeCondition(test.input,test.legs,test.condition).status,test.expected,test.name);
for(const test of cases.fareCases)assert.equal(knownAdditionalFare(test.leg),test.expected);
console.log(JSON.stringify({kind:'selected-edge-contract',passed:cases.cases.length+cases.fareCases.length,scope:'Sample edge facts and fare state, not live routing'}));
