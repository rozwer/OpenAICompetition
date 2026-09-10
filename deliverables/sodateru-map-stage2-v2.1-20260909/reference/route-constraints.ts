/** Counterexample evaluator for the added route facts; not the full RTE-002 implementation. */
import type { KnownBool, RouteLeg, ConstraintResult, RouteInput } from '../contracts/domain';
function fresh(validUntil:string|null,at:string):boolean {return validUntil===null || Date.parse(validUntil)>=Date.parse(at);}
export function edgeCondition(input:RouteInput,legs:RouteLeg[],condition:'avoidStairs'|'requireCovered'|'vehicleClass'):ConstraintResult {
  const sourceIds=new Set<string>();let unknown=legs.length===0,failed=false;
  for(const leg of legs) {
    if(leg.edgeCoverage!=='complete' || (leg.distanceMeters>0&&leg.edgeFacts.length===0))unknown=true;
    for(const edge of leg.edgeFacts) {
      const fact:KnownBool|undefined=condition==='avoidStairs'?edge.stairs:
        condition==='requireCovered'?edge.covered:
        edge.vehicleAccess.find(a=>a.vehicleClass===input.hard.vehicleClass)?.allowed;
      for(const id of [...edge.provenance.sourceIds,...(fact?.sourceIds??[])])sourceIds.add(id);
      if(!fact || fact.status==='unknown' || !fresh(edge.provenance.validUntil,input.departureAt)) {unknown=true;continue;}
      if(condition==='avoidStairs'?fact.value:!fact.value)failed=true;
    }
  }
  const status=failed?'fail':unknown?'unknown':'pass';
  return {key:condition,status,actual:null,explanation:`Selected edge facts: ${status}`,sourceIds:[...sourceIds]};
}
export function knownAdditionalFare(leg:RouteLeg):number|null {
  if(leg.mode==='transit'&&leg.transit===null)return null;
  return leg.cost.status==='known'?leg.cost.amountJPY:null;
}
