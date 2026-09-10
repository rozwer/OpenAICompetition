from pathlib import Path
import json,copy,re,csv
O=Path(__file__).resolve().parents[1]; D={}; ENT={}; OPS=[]
def ref(n): return {'$ref':f'#/components/schemas/{n}'}
def text(maxlen=4000): return {'type':'string','maxLength':maxlen}
def enum(*xs): return {'type':'string','enum':list(xs)}
def nullable(s): return {'anyOf':[s,{'type':'null'}]}
def arr(s,**kw): return {'type':'array','items':s,**kw}
def obj(props,optional=()): return {'type':'object','properties':props,'required':[k for k in props if k not in optional],'additionalProperties':False}
def reg(n,props,optional=()): D[n]=obj(props,optional);return ref(n)
def nint(lo=0):return {'type':'integer','minimum':lo,'maximum':9007199254740991}
def num(lo=None,hi=None):
 d={'type':'number'}
 if lo is not None:d['minimum']=lo
 if hi is not None:d['maximum']=hi
 return d
ID={'type':'string','pattern':'^[a-z][a-z0-9]*_[A-Za-z0-9][A-Za-z0-9_-]{0,63}$','maxLength':80}; TS={'type':'string','format':'date-time'}; B={'type':'boolean'}
D.update(Id=ID,Timestamp=TS,SourceMode=enum('live','user','sample','imported'),ExecutionMode=enum('live-codex','rules','manual','replay'))
reg('Provenance',{'sourceMode':ref('SourceMode'),'sourceIds':arr(ref('Id')),'executionMode':ref('ExecutionMode'),'retrievedAt':nullable(TS),'validUntil':nullable(TS)})
reg('LngLat',{'longitude':num(-180,180),'latitude':num(-90,90)})
D['Position']={'type':'array','prefixItems':[num(-180,180),num(-90,90)],'minItems':2,'maxItems':2,'items':False}
reg('LineString',{'type':{'const':'LineString'},'coordinates':arr(ref('Position'),minItems=2)})
reg('Polygon',{'type':{'const':'Polygon'},'coordinates':arr(arr(ref('Position'),minItems=4),minItems=1)})
reg('Context',{'weather':nullable(enum('clear','rain','snow','other')),'companion':nullable(enum('alone','friend','family','colleague','other')),'timeBudgetMinutes':nullable(nint()),'timeBand':nullable(enum('morning','day','evening','night')),'notes':nullable(text())})
reg('TimeRange',{'startAt':nullable(TS),'endAt':nullable(TS),'precision':enum('exact','approximate','unknown'),'label':nullable(text(120)),'timeZone':text(80)})
D['KnownBool']={'oneOf':[obj({'status':{'const':'known'},'value':B,'sourceIds':arr(ref('Id'))}),obj({'status':{'const':'unknown'},'value':{'type':'null'},'reason':text(200),'sourceIds':arr(ref('Id'))})]}
D['KnownMoney']={'oneOf':[obj({'status':{'const':'known'},'amountJPY':nint(),'sourceIds':arr(ref('Id'))}),obj({'status':{'const':'unknown'},'amountJPY':{'type':'null'},'reason':text(200),'sourceIds':arr(ref('Id'))})]}
reg('VersionRef',{'type':text(80),'id':ref('Id'),'revision':nint(1)})
reg('Scope',{'actorId':ref('Id'),'namespaceId':ref('Id'),'placeId':nullable(ref('Id')),'experienceId':nullable(ref('Id')),'peerId':nullable(ref('Id')),'candidateSetId':nullable(ref('Id')),'dateRange':nullable(ref('TimeRange')),'entityVersions':arr(ref('VersionRef')),'grantVersions':arr(ref('VersionRef')),'settingsRevision':nint(1)})
reg('Camera',{'center':ref('LngLat'),'zoom':num(0,24),'bearing':num(-360,360),'pitch':num(0,85)})
reg('AppContextData',{'tab':enum('map','social','extensions','self'),'selectedPlaceId':nullable(ref('Id')),'selectedExperienceId':nullable(ref('Id')),'date':nullable({'type':'string','format':'date'}),'peerId':nullable(ref('Id')),'activeRouteId':nullable(ref('Id')),'lens':enum('physical','mine','peer'),'dimension':enum('2d','3d'),'livePosition':nullable(ref('LngLat')),'replayPosition':nullable(ref('LngLat')),'camera2d':ref('Camera'),'camera3d':ref('Camera'),'draftIds':arr(ref('Id'))})
base={'namespaceId':ref('Id'),'id':ref('Id'),'revision':nint(1),'createdAt':TS,'updatedAt':TS,'sourceMode':ref('SourceMode')}
def ent(n,table,props,optional=()):
 reg(n,{**base,**props},optional); ENT[n]=table;return ref(n)
reg('Namespace',{'id':ref('Id'),'kind':enum('user','demo'),'canonicalRevision':nint(),'seedVersion':nullable(text(80))})
ent('Actor','actors',{'displayName':text(120),'isDemo':B})
ent('Settings','settings',{'actorId':ref('Id'),'discoveryEnabled':B,'proactiveSuggestions':B,'exploreUnfamiliar':B,'blockedConceptIds':arr(text(80)),'preferredEntry':enum('map','home'),'locationEnabled':B,'aiEnabled':B})
ent('AppContextEntity','app_contexts',{'actorId':ref('Id'),'context':ref('AppContextData')})
ent('Source','sources',{'name':text(200),'provider':text(100),'url':nullable({'type':'string','format':'uri'}),'license':nullable(text(300))})
ent('Building','buildings',{'cityId':ref('Id'),'footprint':ref('Polygon'),'heightMeters':nullable(num(0)),'heightSourceId':nullable(ref('Id')),'levelLabels':arr(text(80))})
reg('PlaceFacts',{'covered':ref('KnownBool'),'stepFree':ref('KnownBool'),'quiet':ref('KnownBool'),'seats':ref('KnownBool'),'openNow':ref('KnownBool'),'cost':ref('KnownMoney')})
reg('ProviderRef',{'provider':text(80),'externalId':text(200)})
ent('Place','places',{'cityId':ref('Id'),'name':text(200),'location':ref('LngLat'),'buildingId':nullable(ref('Id')),'levelLabel':nullable(text(80)),'categories':arr(text(80)),'roleTags':arr(text(120)),'providerRefs':arr(ref('ProviderRef')),'facts':ref('PlaceFacts'),'provenance':ref('Provenance')})
ent('Evidence','evidence',{'actorId':ref('Id'),'kind':enum('utterance','observation','public'),'text':text(12000),'sourceId':nullable(ref('Id')),'assetId':nullable(ref('Id'))})
ent('Observation','observations',{'actorId':ref('Id'),'sourceId':ref('Id'),'sourceRecordId':text(200),'observedAt':TS,'receivedAt':TS,'position':ref('LngLat'),'accuracyMeters':nullable(num(0)),'motionMode':enum('walk','rail','vehicle','unknown'),'importHash':text(64)})
ent('Visit','visits',{'actorId':ref('Id'),'placeId':ref('Id'),'levelLabel':nullable(text(80)),'time':ref('TimeRange'),'status':enum('candidate','confirmed','rejected','deleted'),'observationIds':arr(ref('Id'))})
ent('Experience','experiences',{'actorId':ref('Id'),'placeId':ref('Id'),'visitId':nullable(ref('Id')),'originalEvidenceId':ref('Id'),'evidenceIds':arr(ref('Id')),'purpose':nullable(text(500)),'reason':nullable(text(2000)),'context':ref('Context'),'explicitPreference':enum('like','dislike','neutral','unspecified'),'outcome':nullable(text(2000)),'status':enum('active','deleted')})
# Corrections never overwrite Evidence.text.
D['CorrectionPatch']={'oneOf':[obj({'field':{'const':f},'replacement':s}) for f,s in [('purpose',nullable(text(500))),('reason',nullable(text(2000))),('context',ref('Context')),('explicitPreference',enum('like','dislike','neutral','unspecified')),('outcome',nullable(text(2000)))]]}
ent('Correction','corrections',{'actorId':ref('Id'),'experienceId':ref('Id'),'patch':ref('CorrectionPatch'),'previousPatch':ref('CorrectionPatch'),'reasonEvidenceId':nullable(ref('Id')),'scopeKind':enum('experience','context','global'),'affectedVersions':arr(ref('VersionRef'))})
ent('CorrectionPreview','correction_previews',{'actorId':ref('Id'),'scopeKind':enum('context','global'),'contextFilter':nullable(ref('Context')),'patch':ref('CorrectionPatch'),'targetVersions':arr(ref('VersionRef')),'status':enum('proposed','applied','stale')})
ent('Interpretation','interpretations',{'actorId':ref('Id'),'experienceId':ref('Id'),'jobId':ref('Id'),'purpose':nullable(text(500)),'reason':nullable(text(2000)),'context':ref('Context'),'evidenceIds':arr(ref('Id')),'status':enum('proposed','accepted','rejected')})
ent('Hypothesis','profile_hypotheses',{'actorId':ref('Id'),'condition':ref('Context'),'claim':text(1200),'supportEvidenceIds':arr(ref('Id')),'counterEvidenceIds':arr(ref('Id')),'alternative':nullable(text(1200)),'status':enum('proposed','confirmed','rejected','needs_more_data'),'inputRevision':nint()})
ent('Preference','preferences',{'actorId':ref('Id'),'currentIntent':nullable(text(1000)),'context':ref('Context'),'preferredPurposes':arr(text(120)),'avoidPurposes':arr(text(120))})
reg('Meaning',{'placeId':ref('Id'),'actorId':ref('Id'),'inputRevision':nint(),'purposeCounts':arr(obj({'purpose':text(120),'count':nint()})),'confirmedVisitCount':nint(),'growthStage':{'type':'integer','minimum':0,'maximum':5},'bodyForm':enum('physical','book','conversation','garden','mixed'),'evidenceIds':arr(ref('Id'))})
reg('SearchInput',{'query':text(300),'cityId':nullable(ref('Id')),'purpose':nullable(text(200)),'peerId':nullable(ref('Id')),'context':ref('Context')})
ent('CandidateSet','candidate_sets',{'actorId':ref('Id'),'query':ref('SearchInput'),'placeIds':arr(ref('Id')),'provider':text(100),'inputVersions':arr(ref('VersionRef'))})
reg('HardConstraints',{'avoidStairs':B,'requireCovered':B,'requireOpen':B,'arrivalDeadline':nullable(TS),'maxTotalMinutes':nullable(nint()),'maxCostJPY':nullable(nint()),'vehicleClass':nullable(enum('pedestrian','bicycle','motorcycle-small','motorcycle-large','car'))})
reg('SoftConstraints',{'preferredPurposes':arr(text(120)),'preferFamiliar':B,'preferQuiet':B})
reg('ConstraintResult',{'key':text(120),'status':enum('pass','fail','unknown'),'actual':nullable(text(500)),'explanation':text(1000),'sourceIds':arr(ref('Id'))})
reg('Waypoint',{'placeId':ref('Id'),'stayMinutes':nint()})
reg('RouteInput',{'originPlaceId':ref('Id'),'destinationPlaceId':ref('Id'),'waypoints':arr(ref('Waypoint')),'departureAt':TS,'mode':enum('walk','transit','motorcycle'),'hard':ref('HardConstraints'),'soft':ref('SoftConstraints'),'passIds':arr(ref('Id'))})
reg('RouteLeg',{'fromPlaceId':ref('Id'),'toPlaceId':ref('Id'),'mode':enum('walk','transit','motorcycle'),'distanceMeters':num(0),'durationSeconds':num(0),'geometry':nullable(ref('LineString')),'instructions':arr(text(500)),'cost':ref('KnownMoney'),'provenance':ref('Provenance')})
ent('RoutePlan','route_plans',{'actorId':ref('Id'),'input':ref('RouteInput'),'legs':arr(ref('RouteLeg')),'constraints':arr(ref('ConstraintResult')),'totalTravelSeconds':num(0),'totalStaySeconds':num(0),'cost':ref('KnownMoney'),'status':enum('proposed','selected','deferred','rejected','stale'),'feasibility':enum('pass','fail','unknown'),'inputVersions':arr(ref('VersionRef'))})
ent('Pass','passes',{'actorId':ref('Id'),'operatorCodes':arr(text(100)),'stationCodes':arr(text(100),minItems=2),'viaCodes':arr(text(100)),'validFrom':{'type':'string','format':'date'},'validThrough':{'type':'string','format':'date'},'cardType':text(100),'providerCourse':nullable(text(4000))})
ent('Quest','quests',{'actorId':ref('Id'),'routePlanId':ref('Id'),'status':enum('planned','active','completed','deferred','canceled'),'completedExperienceIds':arr(ref('Id'))})
reg('ShareFields',{'purpose':B,'reason':B,'context':B,'originalText':B,'photos':B,'routeGeometry':B})
ent('ShareGrant','share_grants',{'actorId':ref('Id'),'recipientActorId':nullable(ref('Id')),'targetType':enum('experience','route','extension'),'targetId':ref('Id'),'fields':ref('ShareFields'),'visibility':enum('peer','public'),'status':enum('active','revoked')})
reg('SharedExperience',{'id':ref('Id'),'ownerActorId':ref('Id'),'placeId':ref('Id'),'purpose':nullable(text(500)),'reason':nullable(text(2000)),'context':nullable(ref('Context')),'originalText':nullable(text(12000)),'assetIds':arr(ref('Id')),'grantId':ref('Id'),'grantRevision':nint(1),'sourceMode':ref('SourceMode')})
reg('RoleMapping',{'fromExperienceId':ref('Id'),'toExperienceId':ref('Id'),'relation':enum('same-place-same-purpose','same-place-different-purpose','different-place-same-role','practical-tip','similar-but-different-reason'),'explanation':text(1500),'evidenceIds':arr(ref('Id')),'rejected':B})
ent('Comparison','comparisons',{'actorId':ref('Id'),'peerId':ref('Id'),'mappings':arr(ref('RoleMapping')),'inputVersions':arr(ref('VersionRef')),'grantVersions':arr(ref('VersionRef')),'status':enum('current','stale')})
reg('RecipeRole',{'roleId':ref('Id'),'order':nint(),'label':text(300),'purpose':text(300),'sourcePlaceId':nullable(ref('Id')),'reason':nullable(text(1200)),'fixed':B,'mutable':B,'nonTransferableMemory':nullable(text(1500)),'stayMinutes':nint()})
reg('Transition',{'fromRoleId':ref('Id'),'toRoleId':ref('Id'),'role':text(300),'maxTravelMinutes':nullable(nint())})
ent('Recipe','recipes',{'actorId':ref('Id'),'sourceExperienceIds':arr(ref('Id')),'name':text(200),'roles':arr(ref('RecipeRole'),minItems=1),'transitions':arr(ref('Transition')),'inputVersions':arr(ref('VersionRef'))})
reg('TransferDiff',{'roleId':ref('Id'),'chosenPlaceId':nullable(ref('Id')),'retained':arr(text(500)),'changed':arr(text(500)),'nonTransferable':arr(text(500)),'unknown':arr(text(500)),'fidelity':num(0,1),'personalFit':num(0,1)})
ent('TransferPlan','transfer_plans',{'actorId':ref('Id'),'recipeId':ref('Id'),'candidateSetId':ref('Id'),'targetCityId':ref('Id'),'mode':enum('faithful','personal'),'roles':arr(ref('TransferDiff')),'routePlanId':nullable(ref('Id')),'constraints':arr(ref('ConstraintResult')),'inputVersions':arr(ref('VersionRef')),'status':enum('proposed','selected','stale')})
reg('JointPreference',{'participantActorId':ref('Id'),'hard':ref('HardConstraints'),'soft':ref('SoftConstraints')})
reg('JointCandidate',{'routePlanId':ref('Id'),'participantScores':arr(obj({'actorId':ref('Id'),'score':num(0,1),'reasons':arr(text(300))})),'paretoEfficient':B})
ent('JointPlan','joint_plans',{'actorId':ref('Id'),'participants':arr(ref('JointPreference'),minItems=2),'candidates':arr(ref('JointCandidate')),'conflicts':arr(text(500)),'selectedRoutePlanId':nullable(ref('Id'))})
ent('Feedback','feedback',{'actorId':ref('Id'),'ownExperienceId':ref('Id'),'sourceExperienceId':nullable(ref('Id')),'transferPlanId':nullable(ref('Id')),'retained':text(1500),'changed':text(1500),'fit':enum('fit','not-fit','mixed','not-tried'),'reason':text(2000),'sendToAuthor':B})
reg('DiscoveryAnchor',{'kind':enum('place','building','photo'),'targetId':ref('Id'),'features':arr(text(300))})
reg('KnowledgeSource',{'url':nullable({'type':'string','format':'uri'}),'title':text(300),'claimScope':enum('general','place-specific'),'sourceId':nullable(ref('Id'))})
ent('DiscoveryCard','discovery_cards',{'actorId':ref('Id'),'anchor':ref('DiscoveryAnchor'),'bridge':text(1500),'knowledge':text(2500),'observationPrompt':text(1000),'conceptIds':arr(text(80)),'sources':arr(ref('KnowledgeSource')),'intent':enum('normal','explore'),'inputVersions':arr(ref('VersionRef')),'executionMode':ref('ExecutionMode')})
ent('DiscoveryEvent','discovery_events',{'actorId':ref('Id'),'cardId':ref('Id'),'event':enum('opened','known','interested','dismissed','blocked'),'conceptId':nullable(text(80))})
ent('Interest','interests',{'actorId':ref('Id'),'conceptId':text(80),'state':enum('interested','known','blocked'),'sourceEventId':ref('Id')})
ent('Diary','diaries',{'actorId':ref('Id'),'date':{'type':'string','format':'date'},'text':text(20000),'experienceIds':arr(ref('Id')),'assetIds':arr(ref('Id')),'status':enum('draft','approved'),'jobId':nullable(ref('Id'))})
ent('Asset','assets',{'actorId':ref('Id'),'contentType':enum('image/jpeg','image/png','image/webp'),'byteLength':nint(1),'sha256':text(64),'filename':text(200)})
# DSL closed finite op set; new code is a separate path.
reg('DslInput',{'key':text(80),'label':text(120),'type':enum('number','boolean','string'),'required':B})
reg('DslStep',{'id':text(80),'op':enum('filterCandidates','checkConstraints','computeRoute','sum','subtract','formatCard'),'inputKeys':arr(text(80)),'outputKey':text(80)})
reg('DslDefinition',{'schemaVersion':{'const':'dsl.v1'},'inputs':arr(ref('DslInput')),'steps':arr(ref('DslStep')),'outputKeys':arr(text(80)),'hostSlot':enum('map-sheet','self-panel','route-panel')})
D['ScalarValue']={'type':['string','number','boolean','null']}
D['ScalarMap']={'type':'object','additionalProperties':ref('ScalarValue')}
ent('Extension','extensions',{'actorId':ref('Id'),'name':text(200),'description':text(2000),'theme':enum('general','disaster','motorcycle','pilgrimage'),'visibility':enum('private','shared','public')})
ent('ExtensionVersion','extension_versions',{'actorId':ref('Id'),'extensionId':ref('Id'),'versionTag':text(80),'definition':ref('DslDefinition'),'artifactHash':text(64),'runtimeKind':enum('dsl','code'),'status':enum('draft','validated','rejected')})
ent('ExtensionInstall','extension_installs',{'actorId':ref('Id'),'extensionId':ref('Id'),'activeVersionId':ref('Id'),'previousVersionId':nullable(ref('Id')),'enabled':B,'privateState':ref('ScalarMap')})
ent('ExtensionRun','extension_runs',{'actorId':ref('Id'),'versionId':ref('Id'),'inputs':ref('ScalarMap'),'outputs':ref('ScalarMap'),'status':enum('succeeded','failed'),'errorCode':nullable(text(80))})
ent('SourceSnapshot','source_snapshots',{'sourceId':ref('Id'),'format':enum('json','csv','geojson','html','pdf'),'rawHash':text(64),'rawText':text(2000000),'schemaVersion':text(80),'parserVersion':text(80),'fetchedAt':TS,'validUntil':nullable(TS)})
reg('ColumnMapping',{'from':text(120),'to':enum('name','longitude','latitude','covered','stepFree','openNow','costJPY'),'transform':enum('identity','to-number','to-bool','meters-to-kilometers'),'sourceUnit':nullable(text(80)),'targetUnit':nullable(text(80))})
ent('RepairProposal','repair_proposals',{'actorId':ref('Id'),'sourceId':ref('Id'),'snapshotId':ref('Id'),'oldParserVersion':text(80),'newParserVersion':text(80),'mappings':arr(ref('ColumnMapping')),'status':enum('proposed','approved','rejected','stale'),'warnings':arr(text(500))})
# Job task-specific input uses only references and finite fields. Server resolves authorized evidence.
inputs={
'extract':obj({'experienceId':ref('Id')}),
'compare':obj({'peerId':ref('Id'),'experienceIds':arr(ref('Id'))}),
'recipe':obj({'experienceIds':arr(ref('Id')),'name':text(200)}),
'discover':obj({'anchor':ref('DiscoveryAnchor'),'intent':enum('normal','explore')}),
'extension':obj({'requirement':text(6000),'extensionId':nullable(ref('Id')),'sampleInputs':ref('ScalarMap')}),
'diary':obj({'date':{'type':'string','format':'date'},'experienceIds':arr(ref('Id'))}),
'repair':obj({'sourceId':ref('Id'),'snapshotId':ref('Id')})}
outputs={
'extract':obj({'purpose':nullable(text(500)),'reason':nullable(text(2000)),'context':ref('Context'),'evidenceIds':arr(ref('Id')),'question':nullable(text(500))}),
'compare':obj({'mappings':arr(ref('RoleMapping'))}),
'recipe':obj({'name':text(200),'roles':arr(ref('RecipeRole')),'transitions':arr(ref('Transition'))}),
'discover':obj({'anchor':ref('DiscoveryAnchor'),'bridge':text(1500),'knowledge':text(2500),'observationPrompt':text(1000),'conceptIds':arr(text(80)),'sources':arr(ref('KnowledgeSource'))}),
'extension':obj({'name':text(200),'definition':ref('DslDefinition'),'unsupportedRequirements':arr(text(1000))}),
'diary':obj({'text':text(20000),'evidenceIds':arr(ref('Id'))}),
'repair':obj({'mappings':arr(ref('ColumnMapping')),'warnings':arr(text(500))})}
for k in inputs: D['Ai'+k.title()+'Input']=inputs[k]; D['Ai'+k.title()+'Output']=outputs[k]
D['AiInput']={'oneOf':[obj({'task':{'const':k},'input':ref('Ai'+k.title()+'Input')}) for k in inputs]}
D['AiOutput']={'oneOf':[obj({'task':{'const':k},'output':ref('Ai'+k.title()+'Output')}) for k in inputs]}
ent('AiJob','ai_jobs',{'actorId':ref('Id'),'request':ref('AiInput'),'scope':ref('Scope'),'inputHash':text(64),'status':enum('queued','running','succeeded','failed','canceled','interrupted','stale'),'executionMode':ref('ExecutionMode'),'result':nullable(ref('AiOutput')),'errorCode':nullable(text(80)),'appliedEntityIds':arr(ref('Id'))})
ent('DevelopmentRequest','development_requests',{'actorId':ref('Id'),'requirement':text(12000),'targetLevel':enum('compose','local-bridge','code-plugin','app-modification'),'baseCommit':nullable(text(64)),'allowedPaths':arr(text(300)),'dataPolicy':enum('clone-only','backward-compatible'),'acceptance':arr(text(1500)),'status':enum('draft','exported','preview','approved','reverted')})
# Foundation response and request definitions.
reg('ChangedRef',{'type':text(80),'id':ref('Id'),'revision':nint(),'action':enum('created','updated','deleted')})
reg('Meta',{'requestId':ref('Id'),'namespaceId':nullable(ref('Id')),'canonicalRevision':nint(),'nextCursor':nullable(text(2000))})
reg('ApiError',{'error':obj({'code':enum('VALIDATION_ERROR','UNAUTHORIZED_SCOPE','NOT_FOUND','REVISION_CONFLICT','IDEMPOTENCY_CONFLICT','INVALID_STATE','STALE_INPUT','DEPENDENCY_UNAVAILABLE','PROVIDER_UNAVAILABLE','AI_UNAVAILABLE','UPLOAD_TOO_LARGE','UNSUPPORTED_MEDIA_TYPE','DB_BUSY','INTERNAL_ERROR'),'message':text(2000),'retryable':B,'fieldErrors':arr(obj({'path':text(300),'message':text(1000)})),'currentRevision':nullable(nint())}),'requestId':ref('Id')})
reg('Receipt',{'id':ref('Id'),'revision':nint(),'status':text(80)})
reg('Health',{'status':enum('ok','degraded'),'apiVersion':{'const':'v1'},'ai':enum('available','unavailable','unknown'),'db':enum('ready','unavailable'),'capabilities':arr(text(120))})
reg('Bootstrap',{'actor':ref('Actor'),'settings':ref('Settings'),'context':ref('AppContextEntity'),'preference':ref('Preference'),'capabilities':arr(text(120)),'schemaVersion':{'const':2}})
reg('History',{'visits':arr(ref('Visit')),'experiences':arr(ref('Experience')),'observations':arr(ref('Observation'))})
reg('RecordCreated',{'experience':ref('Experience'),'evidence':ref('Evidence'),'visit':nullable(ref('Visit'))})
reg('CorrectionApplied',{'experience':ref('Experience'),'correction':ref('Correction'),'meaning':ref('Meaning'),'staleJobIds':arr(ref('Id'))})
reg('ImportResult',{'insertedCount':nint(),'duplicateCount':nint(),'candidateVisitIds':arr(ref('Id')),'warnings':arr(text(500))})
reg('ApplyAiResult',{'jobId':ref('Id'),'entities':arr(ref('VersionRef'))})
reg('ExportBundle',{'schemaVersion':{'const':2},'namespace':ref('Namespace'),'context':ref('AppContextEntity'),'places':arr(ref('Place')),'buildings':arr(ref('Building')),'extensions':arr(ref('Extension')),'actor':ref('Actor'),'settings':ref('Settings'),'experiences':arr(ref('Experience')),'visits':arr(ref('Visit')),'evidence':arr(ref('Evidence')),'corrections':arr(ref('Correction')),'diaries':arr(ref('Diary')),'preferences':arr(ref('Preference')),'interests':arr(ref('Interest')),'passes':arr(ref('Pass')),'installations':arr(ref('ExtensionInstall')),'definitions':arr(ref('ExtensionVersion')),'assets':arr(ref('Asset')),'sources':arr(ref('Source'))})
def payload(n,props,optional=()):return reg(n,props,optional)
def op(method,path,oid,summary,response,body=None,edit=False,group='core',tables=(),query=(),phase='P1',response_code=None,public=False,binary=False):
 if isinstance(response,str):response=ref(response)
 if method!='get' and not binary:
  reqname=oid[0].upper()+oid[1:]+'Request'
  props={'opId':ref('Id')}
  if edit:props['expectedRevision']=nint(1)
  props['payload']=body or obj({});D[reqname]=obj(props); req=ref(reqname)
 else: req=body;reqname='multipart' if binary else ''
 outname=oid[0].upper()+oid[1:]+'Response'
 D[outname]=obj({'data':response,'meta':ref('Meta'),'changed':arr(ref('ChangedRef')),'invalidated':arr(text(100))})
 code=response_code or (201 if method=='post' and not edit else 200)
 ps=[]
 if not public:
  ps += [{'$ref':'#/components/parameters/NamespaceId'},{'$ref':'#/components/parameters/ActorId'}]
 for param in re.findall(r'\{(\w+)\}',path):ps.append({'name':param,'in':'path','required':True,'schema':ref('Id')})
 for name,s in query:ps.append({'name':name,'in':'query','required':False,'schema':s})
 spec={'operationId':oid,'summary':summary,'tags':[group],'parameters':ps,'responses':{str(code):{'description':summary,'content':{'application/json':{'schema':ref(outname)}}},'default':{'description':'共通エラー。HTTP statusとerror.codeはAPI_CONTRACT.mdに従う。','content':{'application/json':{'schema':ref('ApiError')}}}},'x-priority':phase,'x-db-tables':list(tables)}
 if method!='get':
  if binary:
   spec['requestBody']={'required':True,'content':{'multipart/form-data':{'schema':body}}}
  else:spec['requestBody']={'required':True,'content':{'application/json':{'schema':req}}}
 OPS.append({'method':method,'path':path,'operation_id':oid,'summary':summary,'request_schema':reqname,'response_schema':outname,'success_status':code,'group':group,'tables':list(tables),'priority':phase,'spec':spec})
 return spec
# Explicit endpoints, no generic /commands dispatcher.
op('get','/api/v1/health','getHealth','実接続と利用可能モジュールを返す','Health',phase='P0',public=True)
op('get','/api/v1/bootstrap','getBootstrap','本人の設定・文脈・capabilitiesだけ取得','Bootstrap',tables=['actors','settings','app_contexts'],phase='P0')
op('get','/api/v1/settings','getSettings','設定取得','Settings',tables=['settings'],phase='P0')
op('patch','/api/v1/settings','updateSettings','設定変更・停止によるAI適用保留','Settings',body=payload('SettingsPatch',{k:v for k,v in D['Settings']['properties'].items() if k not in base and k!='actorId'}),edit=True,tables=['settings','ai_jobs'],phase='P0')
op('put','/api/v1/context','putContext','画面間文脈の保存','AppContextEntity',body=ref('AppContextData'),edit=True,tables=['app_contexts'],phase='P0')
op('get','/api/v1/places','listPlaces','検索条件による場所一覧',arr(ref('Place')),group='places',tables=['places'],query=[('query',text(300)),('cityId',ref('Id')),('purpose',text(200)),('cursor',text(2000)),('limit',{'type':'integer','minimum':1,'maximum':100,'default':30})],phase='P0')
op('get','/api/v1/places/{placeId}','getPlace','場所情報・個人意味は別取得','Place',group='places',tables=['places'],phase='P0')
op('get','/api/v1/buildings','listBuildings','地図用実形状取得',arr(ref('Building')),group='places',tables=['buildings'],query=[('cityId',ref('Id'))],phase='P0')
op('get','/api/v1/places/{placeId}/meaning','getMeaning','本人または共有許可レンズの意味','Meaning',group='records',tables=['experiences','visits'],query=[('peerId',ref('Id'))],phase='P0')
record=payload('RecordCreate',{'placeId':ref('Id'),'originalText':text(12000),'purpose':nullable(text(500)),'reason':nullable(text(2000)),'context':ref('Context'),'explicitPreference':enum('like','dislike','neutral','unspecified'),'outcome':nullable(text(2000)),'visit':nullable(obj({'time':ref('TimeRange'),'levelLabel':nullable(text(80))}))})
op('post','/api/v1/experiences','createExperience','原文・任意訪問・体験を一括保存','RecordCreated',body=record,group='records',tables=['evidence','visits','experiences'],phase='P0')
op('get','/api/v1/experiences','listExperiences','本人の体験一覧',arr(ref('Experience')),group='records',tables=['experiences'],query=[('placeId',ref('Id')),('cursor',text(2000)),('limit',{'type':'integer','minimum':1,'maximum':100,'default':30})],phase='P0')
op('get','/api/v1/experiences/{experienceId}','getExperience','本人の体験詳細','Experience',group='records',tables=['experiences'],phase='P0')
op('get','/api/v1/evidence/{evidenceId}','getEvidence','許可された原文と出典','Evidence',group='records',tables=['evidence'],phase='P0')
op('post','/api/v1/experiences/{experienceId}/corrections','correctExperience','この体験の理由・用途・状況を訂正','CorrectionApplied',body=payload('CorrectionCreate',{'patch':ref('CorrectionPatch'),'reasonText':nullable(text(2000))}),edit=True,group='records',tables=['experiences','corrections','evidence','ai_jobs'],phase='P0')
op('delete','/api/v1/experiences/{experienceId}','deleteExperience','本人の原文を含めた削除と派生失効','Receipt',body=payload('DeleteExperience',{'deleteLinkedVisit':B}),edit=True,group='records',tables=['experiences','evidence','visits','corrections'],phase='P0')
op('post','/api/v1/correction-previews','previewCorrections','条件限定または全体訂正の対象を固定','CorrectionPreview',body=payload('CorrectionPreviewCreate',{'scopeKind':enum('context','global'),'contextFilter':nullable(ref('Context')),'patch':ref('CorrectionPatch')}),group='records',tables=['correction_previews'],phase='P3')
op('post','/api/v1/correction-previews/{previewId}/apply','applyCorrections','固定対象と版を照合して複数訂正','Receipt',body=payload('ApplyPreview',{'approve':{'const':True}}),edit=True,group='records',tables=['correction_previews','corrections','experiences'],phase='P3')
op('post','/api/v1/observations/import','importObservations','JSONまたはGPX入力・重複排除','ImportResult',body=payload('ObservationImport',{'format':enum('json','gpx'),'sourceId':ref('Id'),'content':text(2000000)}),group='records',tables=['observations','visits'])
op('get','/api/v1/visits','listVisits','候補・確定訪問一覧',arr(ref('Visit')),group='records',tables=['visits'],query=[('status',enum('candidate','confirmed','rejected')),('cursor',text(2000)),('limit',{'type':'integer','minimum':1,'maximum':100,'default':30})])
op('patch','/api/v1/visits/{visitId}','updateVisit','訪問候補の確認・訂正・却下・削除','Visit',body=payload('VisitPatch',{'status':enum('confirmed','rejected','deleted'),'placeId':ref('Id'),'time':ref('TimeRange'),'levelLabel':nullable(text(80))}),edit=True,group='records',tables=['visits'])
op('get','/api/v1/history','getHistory','日時範囲の履歴・リプレイ','History',group='self',tables=['visits','experiences','observations'],query=[('from',TS),('to',TS)])
op('get','/api/v1/hypotheses','listHypotheses','状況別仮説・支持・反例',arr(ref('Hypothesis')),group='self',tables=['profile_hypotheses'])
op('put','/api/v1/preferences','putPreference','現在の希望を履歴と別に保存','Preference',body=payload('PreferencePut',{'currentIntent':nullable(text(1000)),'context':ref('Context'),'preferredPurposes':arr(text(120)),'avoidPurposes':arr(text(120))}),edit=True,group='self',tables=['preferences'])
op('patch','/api/v1/hypotheses/{hypothesisId}','reviewHypothesis','仮説の確認・反証','Hypothesis',body=payload('HypothesisReview',{'status':enum('confirmed','rejected','needs_more_data')}),edit=True,group='self',tables=['profile_hypotheses'])
op('post','/api/v1/diaries','createDiary','日記を本人の編集稿として保存','Diary',body=payload('DiaryCreate',{'date':{'type':'string','format':'date'},'text':text(20000),'experienceIds':arr(ref('Id')),'assetIds':arr(ref('Id')),'status':enum('draft','approved')}),group='self',tables=['diaries'])
op('get','/api/v1/diaries','listDiaries','日記一覧',arr(ref('Diary')),group='self',tables=['diaries'])
op('patch','/api/v1/diaries/{diaryId}','updateDiary','日記の編集と承認','Diary',body=payload('DiaryPatch',{'text':text(20000),'assetIds':arr(ref('Id')),'status':enum('draft','approved')}),edit=True,group='self',tables=['diaries'])
op('post','/api/v1/assets','uploadAsset','画像アップロード','Asset',body=obj({'opId':ref('Id'),'file':{'type':'string','format':'binary'}}),binary=True,group='self',tables=['assets'])
op('get','/api/v1/assets/{assetId}','getAsset','画像メタデータ取得','Asset',group='self',tables=['assets'])
op('get','/api/v1/assets/{assetId}/content','getAssetContent','許可済み画像バイト取得','Asset',group='self',tables=['assets'])
OPS[-1]['spec']['responses']['200']['content']={c:{'schema':{'type':'string','format':'binary'}} for c in ['image/jpeg','image/png','image/webp']};OPS[-1]['response_schema']='binary';D.pop('GetAssetContentResponse')
op('get','/api/v1/export','exportOwnData','本人のJSON出力','ExportBundle',group='self',tables=list(ENT.values()),phase='P1')
op('post','/api/v1/candidate-sets','createCandidateSet','再比較可能な候補集合を保存','CandidateSet',body=ref('SearchInput'),group='routes',tables=['candidate_sets'],phase='P0')
op('get','/api/v1/candidate-sets/{candidateSetId}','getCandidateSet','固定候補集合取得','CandidateSet',group='routes',tables=['candidate_sets'],phase='P0')
op('post','/api/v1/routes','planRoute','制約を検証して経路を保存','RoutePlan',body=ref('RouteInput'),group='routes',tables=['route_plans'],phase='P0')
op('get','/api/v1/routes/{routeId}','getRoute','経路再表示','RoutePlan',group='routes',tables=['route_plans'],phase='P0')
op('patch','/api/v1/routes/{routeId}','setRouteState','経路採用・後回し・却下','RoutePlan',body=payload('RouteState',{'status':enum('selected','deferred','rejected')}),edit=True,group='routes',tables=['route_plans'],phase='P0')
op('post','/api/v1/quests','createQuest','任意の計画開始','Quest',body=payload('QuestCreate',{'routePlanId':ref('Id')}),group='routes',tables=['quests'])
op('patch','/api/v1/quests/{questId}','updateQuest','実践・見送りを分離','Quest',body=payload('QuestPatch',{'status':enum('active','completed','deferred','canceled'),'completedExperienceIds':arr(ref('Id'))}),edit=True,group='routes',tables=['quests'])
passprops={k:v for k,v in D['Pass']['properties'].items() if k not in base and k!='actorId'}
op('get','/api/v1/passes','listPasses','定期券一覧',arr(ref('Pass')),group='routes',tables=['passes'])
op('post','/api/v1/passes','createPass','定期券区間保存','Pass',body=payload('PassCreate',passprops),group='routes',tables=['passes'])
op('patch','/api/v1/passes/{passId}','updatePass','定期券変更','Pass',body=ref('PassCreate'),edit=True,group='routes',tables=['passes'])
op('delete','/api/v1/passes/{passId}','deletePass','定期券削除','Receipt',edit=True,group='routes',tables=['passes'])
op('get','/api/v1/shared-experiences','listSharedExperiences','共有許可済み体験だけ検索',arr(ref('SharedExperience')),group='social',tables=['share_grants','experiences'],query=[('query',text(300)),('peerId',ref('Id')),('placeId',ref('Id'))])
op('post','/api/v1/share-grants','createShareGrant','項目単位の共有','ShareGrant',body=payload('ShareGrantCreate',{k:v for k,v in D['ShareGrant']['properties'].items() if k not in base and k not in ['actorId','status']}),group='social',tables=['share_grants'])
op('post','/api/v1/share-grants/{grantId}/revoke','revokeShareGrant','共有取消と派生失効','ShareGrant',edit=True,group='social',tables=['share_grants','comparisons','ai_jobs'])
op('post','/api/v1/comparisons','createComparison','許可済み投影のルール比較','Comparison',body=payload('CompareCreate',{'peerId':ref('Id'),'experienceIds':arr(ref('Id'))}),group='social',tables=['comparisons'])
op('get','/api/v1/comparisons/{comparisonId}','getComparison','取消を反映した比較取得','Comparison',group='social',tables=['comparisons'])
op('patch','/api/v1/comparisons/{comparisonId}','rejectMapping','類似対応の否定','Comparison',body=payload('MappingReject',{'mappingIndex':nint(),'rejected':B}),edit=True,group='social',tables=['comparisons'])
recipeprops={k:v for k,v in D['Recipe']['properties'].items() if k not in base and k not in ['actorId','inputVersions']}
op('post','/api/v1/recipes','createRecipe','役割と順序を編集して保存','Recipe',body=payload('RecipeCreate',recipeprops),group='transfer',tables=['recipes'])
op('get','/api/v1/recipes/{recipeId}','getRecipe','体験レシピ取得','Recipe',group='transfer',tables=['recipes'])
op('patch','/api/v1/recipes/{recipeId}','updateRecipe','役割・固定条件の変更','Recipe',body=ref('RecipeCreate'),edit=True,group='transfer',tables=['recipes'])
op('post','/api/v1/transfers','planTransfer','別都市の候補へ役割を割当','TransferPlan',body=payload('TransferCreate',{'recipeId':ref('Id'),'candidateSetId':ref('Id'),'targetCityId':ref('Id'),'mode':enum('faithful','personal'),'routeInput':ref('RouteInput')}),group='transfer',tables=['transfer_plans','route_plans'])
op('get','/api/v1/transfers/{transferId}','getTransfer','残す・変える・移せない・不明を取得','TransferPlan',group='transfer',tables=['transfer_plans'])
op('post','/api/v1/joint-plans','createJointPlan','共同希望の積集合と両者評価','JointPlan',body=payload('JointPlanCreate',{'participants':arr(ref('JointPreference'),minItems=2),'routePlanIds':arr(ref('Id'))}),group='social',tables=['joint_plans'])
op('get','/api/v1/joint-plans/{jointPlanId}','getJointPlan','共同案再表示','JointPlan',group='social',tables=['joint_plans'])
op('post','/api/v1/feedback','createFeedback','自分の実践と作者への返信','Feedback',body=payload('FeedbackCreate',{k:v for k,v in D['Feedback']['properties'].items() if k not in base and k!='actorId'}),group='social',tables=['feedback'])
op('get','/api/v1/feedback','listFeedback','本人の感想と許可された返信',arr(ref('Feedback')),group='social',tables=['feedback'])
op('post','/api/v1/discoveries','openDiscovery','本人主導で根拠あるカードを開く','DiscoveryCard',body=payload('DiscoveryOpen',{'anchor':ref('DiscoveryAnchor'),'intent':enum('normal','explore')}),group='discovery',tables=['discovery_cards','discovery_events'])
op('get','/api/v1/discoveries/{cardId}','getDiscovery','発見再表示','DiscoveryCard',group='discovery',tables=['discovery_cards'])
op('post','/api/v1/discoveries/{cardId}/events','recordDiscoveryEvent','既知・興味・閉じる・禁止を別保存','DiscoveryEvent',body=payload('DiscoveryEventCreate',{'event':enum('opened','known','interested','dismissed','blocked'),'conceptId':nullable(text(80))}),group='discovery',tables=['discovery_events','interests'])
op('get','/api/v1/interests','listInterests','新しい関心一覧',arr(ref('Interest')),group='discovery',tables=['interests'])
op('get','/api/v1/extensions','listExtensions','ストア一覧',arr(ref('Extension')),group='extensions',tables=['extensions'])
op('post','/api/v1/extensions','createExtension','機能メタデータ登録','Extension',body=payload('ExtensionCreate',{'name':text(200),'description':text(2000),'theme':enum('general','disaster','motorcycle','pilgrimage'),'visibility':enum('private','shared','public')}),group='extensions',tables=['extensions'])
op('post','/api/v1/extensions/{extensionId}/versions','createExtensionVersion','型付きDSLの版を作成','ExtensionVersion',body=payload('VersionCreate',{'versionTag':text(80),'definition':ref('DslDefinition')}),group='extensions',tables=['extension_versions'])
op('get','/api/v1/extensions/{extensionId}/versions','listExtensionVersions','旧版と生成版の一覧',arr(ref('ExtensionVersion')),group='extensions',tables=['extension_versions'])
op('post','/api/v1/extension-versions/{versionId}/preview','previewExtension','実計算を試用して結果保存','ExtensionRun',body=payload('ExtensionInputs',{'inputs':ref('ScalarMap')}),group='extensions',tables=['extension_runs'])
op('post','/api/v1/extension-installs','installExtension','検証済み版を導入','ExtensionInstall',body=payload('InstallCreate',{'extensionId':ref('Id'),'versionId':ref('Id')}),group='extensions',tables=['extension_installs'])
op('get','/api/v1/extension-installs','listInstalls','導入済み機能一覧',arr(ref('ExtensionInstall')),group='extensions',tables=['extension_installs'])
op('patch','/api/v1/extension-installs/{installId}','updateInstall','有効化・無効化・版切替','ExtensionInstall',body=payload('InstallPatch',{'enabled':B,'activeVersionId':ref('Id')}),edit=True,group='extensions',tables=['extension_installs'])
op('post','/api/v1/extension-installs/{installId}/rollback','rollbackInstall','直前版へ戻す・状態保持','ExtensionInstall',edit=True,group='extensions',tables=['extension_installs'])
op('post','/api/v1/extension-installs/{installId}/run','runExtension','導入版の機能を実行','ExtensionRun',body=ref('ExtensionInputs'),group='extensions',tables=['extension_runs'])
op('post','/api/v1/sources','createSource','出典とadapter情報保存','Source',body=payload('SourceCreate',{k:v for k,v in D['Source']['properties'].items() if k not in base}),group='sources',tables=['sources'])
op('post','/api/v1/sources/{sourceId}/snapshots','createSnapshot','取得結果と形式を保存','SourceSnapshot',body=payload('SnapshotCreate',{'format':enum('json','csv','geojson','html','pdf'),'rawText':text(2000000),'parserVersion':text(80),'validUntil':nullable(TS)}),group='sources',tables=['source_snapshots'])
op('post','/api/v1/repairs','createRepair','列対応案を保存','RepairProposal',body=payload('RepairCreate',{'sourceId':ref('Id'),'snapshotId':ref('Id'),'oldParserVersion':text(80),'newParserVersion':text(80),'mappings':arr(ref('ColumnMapping'))}),group='sources',tables=['repair_proposals'])
op('get','/api/v1/repairs/{repairId}','getRepair','修復差分の取得','RepairProposal',group='sources',tables=['repair_proposals'])
op('post','/api/v1/repairs/{repairId}/approve','approveRepair','意味と単位を承認して再取込','RepairProposal',body=payload('RepairApprove',{'approveSemanticChanges':{'const':True}}),edit=True,group='sources',tables=['repair_proposals','places','source_snapshots'])
op('post','/api/v1/ai/jobs','createAiJob','明示モードで構造化AIジョブを開始','AiJob',body=payload('AiJobCreate',{'request':ref('AiInput'),'scope':ref('Scope'),'executionMode':enum('live-codex','replay')}),group='ai',tables=['ai_jobs'],phase='P0',response_code=202)
op('get','/api/v1/ai/jobs/{jobId}','getAiJob','ジョブ状態・現在許可された結果','AiJob',group='ai',tables=['ai_jobs'],phase='P0')
op('post','/api/v1/ai/jobs/{jobId}/cancel','cancelAiJob','結果適用を停止','AiJob',edit=True,group='ai',tables=['ai_jobs'],phase='P0')
op('post','/api/v1/ai/jobs/{jobId}/apply','applyAiJob','入力版・共有・設定再確認して提案保存','ApplyAiResult',body=payload('AiApply',{'approve':{'const':True}}),edit=True,group='ai',tables=['ai_jobs','interpretations','comparisons','recipes','discovery_cards','extension_versions','diaries','repair_proposals'],phase='P0')
op('post','/api/v1/interpretations/{interpretationId}/review','reviewInterpretation','本人が抽出結果を確認または却下','Interpretation',body=payload('InterpretationReview',{'action':enum('accept','reject')}),edit=True,group='ai',tables=['interpretations','experiences'],phase='P0')
op('post','/api/v1/development-requests','createDevelopmentRequest','DSL外の改造要求を契約化','DevelopmentRequest',body=payload('DevelopmentCreate',{k:v for k,v in D['DevelopmentRequest']['properties'].items() if k not in base and k not in ['actorId','status']}),group='extensions',tables=['development_requests'],phase='P2')
op('get','/api/v1/development-requests/{requestId}','getDevelopmentRequest','本人AIへ渡す開発契約取得','DevelopmentRequest',group='extensions',tables=['development_requests'],phase='P2')
op('post','/api/v1/demo/namespaces','cloneDemo','新規demo領域へseedを複製','Namespace',body=payload('DemoClone',{'seedVersion':text(80)}),group='demo',tables=['namespaces'],phase='P0')
op('post','/api/v1/demo/reset','resetDemo','選択demo領域だけ初期化','Namespace',body=payload('DemoReset',{'confirmNamespaceId':ref('Id'),'seedVersion':text(80)}),group='demo',tables=['namespaces'],phase='P0')
# Read-mostly notification channel with monotonic cursor. Durable events contain identifiers only.
reg('ChangeEvent',{'sequence':nint(1),'canonicalRevision':nint(),'changed':arr(ref('ChangedRef')),'invalidated':arr(text(100))})
op('get','/api/v1/changes','getChanges','差分IDによる画面再取得',arr(ref('ChangeEvent')),group='core',tables=['change_events'],query=[('after',nint()),('limit',{'type':'integer','minimum':1,'maximum':100,'default':100})],phase='P0')
# Typed DSL intermediate values; forms stay scalar, computations do not flatten routes into strings.
reg('RouteComputation',{'legs':arr(ref('RouteLeg')),'constraints':arr(ref('ConstraintResult')),'totalTravelSeconds':num(0),'totalStaySeconds':num(0),'cost':ref('KnownMoney')})
reg('DslCard',{'title':text(200),'body':text(2000),'status':enum('info','pass','fail','unknown')})
D['ResetDemoRequest']['properties']['expectedRevision']=nint(0)
D['DslValue']={'anyOf':[ref('ScalarValue'),arr(ref('Place')),arr(ref('ConstraintResult')),ref('RouteComputation'),ref('DslCard')]}
D['DslOutputMap']={'type':'object','additionalProperties':ref('DslValue')}
D['ExtensionRun']['properties']['outputs']=ref('DslOutputMap')
paths={}
for r in OPS:paths.setdefault(r['path'],{})[r['method']]=r['spec']
api={'openapi':'3.1.1','info':{'title':'育てる地図 API','version':'2.0.0','description':'設計契約。API実装は含まない。scope headersはローカルデモ切替であり認証ではない。'},'servers':[{'url':'http://127.0.0.1:8787'}],'paths':paths,'components':{'parameters':{'NamespaceId':{'name':'X-Namespace-Id','in':'header','required':True,'schema':ref('Id')},'ActorId':{'name':'X-Actor-Id','in':'header','required':True,'schema':ref('Id')}},'schemas':D}}
(O/'contracts/openapi.json').write_text(json.dumps(api,ensure_ascii=False,indent=2)+'\n')
try:
 import yaml
 (O/'contracts/openapi.yaml').write_text(yaml.safe_dump(api,allow_unicode=True,sort_keys=False,width=120))
except ImportError:pass
schema={'$schema':'https://json-schema.org/draft/2020-12/schema','$id':'urn:sodateru:contracts:v2','$defs':json.loads(json.dumps(D).replace('#/components/schemas/','#/$defs/'))}
(O/'contracts/schemas.json').write_text(json.dumps(schema,ensure_ascii=False,indent=2)+'\n')
(O/'contracts/entities.json').write_text(json.dumps(ENT,ensure_ascii=False,indent=2)+'\n')
(O/'contracts/operations.json').write_text(json.dumps([{k:v for k,v in r.items() if k!='spec'} for r in OPS],ensure_ascii=False,indent=2)+'\n')
with (O/'API_ENDPOINTS.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.DictWriter(f,fieldnames=['method','path','operation_id','summary','request_schema','response_schema','success_status','group','tables','priority']);w.writeheader()
 for r in OPS:w.writerow({k:(';'.join(r[k]) if isinstance(r[k],list) else r[k].upper() if k=='method' else r[k]) for k in w.fieldnames})
print('schemas',len(D),'entities',len(ENT),'operations',len(OPS))

# Preserve the operation-to-task index when rebuilding schemas.
if (O/'TASK_GRAPH.json').exists():
 g=json.loads((O/'TASK_GRAPH.json').read_text());owners={op:t['id'] for t in g['tasks'] for op in t['operation_ids']}
 p=O/'API_ENDPOINTS.csv';rows=list(csv.DictReader(p.open(encoding='utf-8-sig')));fields=list(rows[0])+['implementation_task']
 with p.open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,fieldnames=fields);w.writeheader()
  for r in rows:r['implementation_task']=owners.get(r['operation_id'],'UNASSIGNED_NEW_OPERATION');w.writerow(r)
