"""Generate counterexamples for the new route-fact boundary. No network or actual routing."""
from pathlib import Path
import copy,json
P=Path(__file__).resolve().parents[1]
read=lambda n:json.loads((P/n).read_text())
route=read('examples/http/planRoute.json')['request']['payload']
# PlanRoute wraps RouteInput in the existing payload schema.
if 'input' in route:route=route['input']
route=copy.deepcopy(route)
route['originPlaceId']='place_a';route['destinationPlaceId']='place_b'
route['departureAt']='2026-09-09T01:00:00Z';route['hard']['vehicleClass']='motorcycle-large'
prov={'sourceMode':'sample','sourceIds':['source_sample'],'executionMode':'rules','retrievedAt':'2026-09-09T00:00:00Z','validUntil':'2026-09-10T00:00:00Z'}
def known(value):return {'status':'known','value':value,'sourceIds':['source_sample']}
unknown={'status':'unknown','value':None,'reason':'sample missing fact','sourceIds':['source_sample']}
money={'status':'known','amountJPY':0,'sourceIds':['source_sample']}
edge={'edgeId':'edge_one','stairs':known(False),'covered':known(True),'vehicleAccess':[{'vehicleClass':'motorcycle-large','allowed':known(True)}],'provenance':prov}
leg={'fromPlaceId':'place_a','toPlaceId':'place_b','mode':'walk','distanceMeters':100,'durationSeconds':90,'geometry':{'type':'LineString','coordinates':[[136.9,35.17],[136.901,35.17]]},'instructions':[],'cost':money,'provenance':prov,'edgeCoverage':'complete','edgeFacts':[edge],'transit':None,'passAssessments':[]}
cases=[]
def case(name,condition,expected,modify=lambda l:None):
 l=copy.deepcopy(leg);modify(l);r=copy.deepcopy(route);r['hard']['avoidStairs']=condition=='avoidStairs';r['hard']['requireCovered']=condition=='requireCovered'
 cases.append({'name':name,'input':r,'legs':[l],'condition':condition,'expected':expected})
case('all route edges covered','requireCovered','pass')
case('destination covered but road uncovered','requireCovered','fail',lambda l:l['edgeFacts'][0].update(covered=known(False)))
case('road cover unknown','requireCovered','unknown',lambda l:l['edgeFacts'][0].update(covered=unknown))
case('partial edge coverage','requireCovered','unknown',lambda l:l.update(edgeCoverage='partial'))
case('missing all edge facts','requireCovered','unknown',lambda l:l.update(edgeFacts=[]))
case('stale road information','requireCovered','unknown',lambda l:l['edgeFacts'][0]['provenance'].update(validUntil='2026-09-08T00:00:00Z'))
case('stairs on selected road','avoidStairs','fail',lambda l:l['edgeFacts'][0].update(stairs=known(True)))
case('all selected roads step free','avoidStairs','pass')
case('large motorcycle forbidden','vehicleClass','fail',lambda l:l['edgeFacts'][0]['vehicleAccess'][0].update(allowed=known(False)))
case('vehicle class not supplied','vehicleClass','unknown',lambda l:l['edgeFacts'][0].update(vehicleAccess=[]))
transit=copy.deepcopy(leg);transit.update(mode='transit',transit={'operatorCode':'sample-operator','lineCode':'sample-line','boardingStationCode':'sample-a','alightingStationCode':'sample-b','viaStationCodes':[],'departureAt':'2026-09-09T01:00:00Z','arrivalAt':'2026-09-09T01:02:00Z','provenance':prov},passAssessments=[{'passId':'pass_sample','applicable':known(True),'additionalFare':money,'provenance':prov}])
unpriced=copy.deepcopy(transit);unpriced['cost']={'status':'unknown','amountJPY':None,'reason':'fare adapter unavailable','sourceIds':[]};unpriced['passAssessments']=[]
result={'note':'Sample graph facts only; geographic coordinates do not establish a walkable or safe route. Endpoint covered=true is held fixed across the first cases.','endpointCovered':known(True),'cases':cases,'fareCases':[{'leg':transit,'expected':0},{'leg':unpriced,'expected':None}]}
(P/'examples/route-constraint-cases.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print('Route counterexamples:',len(cases)+2)
