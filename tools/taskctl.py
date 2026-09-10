#!/usr/bin/env python3
"""Dependency/path-lock task board backed by a single Git ref.

No daemon, no clock-based stealing, no GitHub assignee race. Every write creates a
child commit and CAS-pushes ONLY refs/tags/codex-task-board with an explicit old
OID. The working tree/index are never changed. This is coordination, not access
control. See docs/spec/TASK_EXECUTION.md for abandoned-agent recovery.
"""
from __future__ import annotations
import argparse,copy,hashlib,json,os,subprocess,sys,uuid,time,random
from contextlib import contextmanager
from pathlib import Path
from typing import Any
from task_manifest import graph_path, load_graph
import owner_policy as op
REF='refs/tags/codex-task-board'
LEGACY_REF='refs/heads/coord/task-board'
class BoardError(RuntimeError): pass

def atomic_json(path,value):
    path.parent.mkdir(parents=True,exist_ok=True)
    temporary=path.with_name(path.name+'.'+uuid.uuid4().hex+'.tmp')
    try:
        fd=os.open(temporary,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
        with os.fdopen(fd,'w',encoding='utf-8') as out:
            json.dump(value,out,ensure_ascii=False,indent=2)
            out.flush();os.fsync(out.fileno())
        os.replace(temporary,path)
    finally:temporary.unlink(missing_ok=True)

def register_inline(board,task,definition):
    """Publish a new Issue definition in the same CAS as its first claim."""
    from sync_graph import validate
    if not isinstance(definition,dict):raise BoardError('Definition must be a JSON object')
    definition=copy.deepcopy(definition)
    number=definition.pop('issue_number',None)
    if definition.get('id')!=task:raise BoardError('Definition Task ID mismatch')
    if definition.get('priority') not in ('P0','P1','P2','P3') or definition.get('effective_priority',definition.get('priority')) not in ('P0','P1','P2','P3'):
        raise BoardError('Definition needs priority P0/P1/P2/P3')
    for field in ('id','title','kind'):
        if not isinstance(definition.get(field),str) or not definition[field].strip():raise BoardError('Definition needs nonempty '+field)
    for field in ('write_paths','hard_dependencies','connect_after'):
        value=definition.get(field,[] if field=='connect_after' else None)
        if not isinstance(value,list) or not all(isinstance(item,str) and item for item in value):raise BoardError('Definition needs a string list for '+field)
    if task in board['tasks']:
        policy=op.policy_for(board)
        if task in board.get('inline_tasks',[]) and definition==taskdef(board,task) and (not policy or policy['issue_numbers'][task]==number):
            return  # Retry an interrupted start; never change its definition.
        raise BoardError('Definition cannot override an existing Task')
    if not definition['write_paths']:raise BoardError('Definition needs explicit write_paths')
    graph=copy.deepcopy(board['graph'])
    graph['tasks'].append(definition)
    policy=graph.get('task_policy')
    if policy:
        policy['issue_numbers'][task]=number
    try:validate(graph)
    except RuntimeError as error:raise BoardError(str(error)) from None
    # change(..., claim) performs the live Issue/owner check once, immediately
    # before the atomic claim. Previewing a definition needs no GitHub request.
    board['graph']=graph
    board['inline_tasks']=list(dict.fromkeys(board.get('inline_tasks',[])+[task]))
    board['tasks'][task]={'status':'backlog','actor':None,'token':None,'generation':0,'paths':[],'note':None}

def local_store(remote='origin'):
    common=Path(git('rev-parse','--path-format=absolute','--git-common-dir'))
    identity=git('remote','get-url',remote,check=False) or remote
    directory=common/'taskctl'/hashlib.sha256(identity.encode()).hexdigest()[:16]
    directory.mkdir(parents=True,exist_ok=True)
    return directory

@contextmanager
def local_lock(name,remote='origin',timeout=180):
    """OS locks release on process exit; this never expires a remote task claim."""
    path=local_store(remote)/(name+'.lock')
    fd=os.open(path,os.O_RDWR|os.O_CREAT,0o600)
    acquired=False
    start=time.monotonic()
    try:
        if os.fstat(fd).st_size==0:os.write(fd,b'0')
        while not acquired:
            try:
                os.lseek(fd,0,os.SEEK_SET)
                if os.name=='nt':
                    import msvcrt
                    msvcrt.locking(fd,msvcrt.LK_NBLCK,1)
                else:
                    import fcntl
                    fcntl.flock(fd,fcntl.LOCK_EX|fcntl.LOCK_NB)
                acquired=True
            except (BlockingIOError,PermissionError,OSError) as error:
                if getattr(error,'errno',None) not in (11,13,35,36):raise
                if time.monotonic()-start>=timeout:
                    raise BoardError('Another local board operation is still running; no new claim was made')
                time.sleep(0.05+random.random()*0.05)
        yield
    finally:
        if acquired:
            os.lseek(fd,0,os.SEEK_SET)
            if os.name=='nt':
                import msvcrt
                msvcrt.locking(fd,msvcrt.LK_UNLCK,1)
            else:
                import fcntl
                fcntl.flock(fd,fcntl.LOCK_UN)
        os.close(fd)

def snapshot(remote='origin'):
    try:return json.loads((local_store(remote)/'snapshot.json').read_text(encoding='utf-8'))
    except FileNotFoundError:return None

def cache_board(remote,oid,board,active_ref):
    with local_lock('snapshot',remote,timeout=10):
        previous=snapshot(remote)
        if previous and previous.get('board') and board:
            if previous['board']['revision']>board['revision']:return
        target=local_store(remote)/'snapshot.json'
        temporary=target.with_name('snapshot-'+uuid.uuid4().hex+'.tmp')
        try:
            fd=os.open(temporary,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
            with os.fdopen(fd,'w',encoding='utf-8',newline='\n') as out:
                json.dump({'oid':oid,'ref':active_ref,'board':board},out,ensure_ascii=False)
            os.replace(temporary,target)
        finally:temporary.unlink(missing_ok=True)

def cached_board(remote='origin'):
    cached=snapshot(remote)
    if not cached or not cached.get('board'):
        raise BoardError('No local claim snapshot; run mise run task:refresh once')
    return cached['oid'],cached['board']

def git(*args: str, data: str|None=None, check: bool=True)->str:
    p=subprocess.run(['git',*args],input=data.encode('utf-8') if data is not None else None,capture_output=True)
    if check and p.returncode: raise BoardError((p.stderr or p.stdout).decode('utf-8',errors='replace').strip() or 'git failed')
    return p.stdout.decode('utf-8').strip()

def board_ref(remote:str)->str:
    refs={line.split()[1] for line in git('ls-remote',remote,REF,LEGACY_REF).splitlines()}
    if REF in refs and LEGACY_REF in refs:raise BoardError('Two board refs exist; stop and resolve migration before writing')
    return LEGACY_REF if LEGACY_REF in refs else REF

def read_board(remote:str)->tuple[str|None,dict[str,Any]|None]:
    # Optional wildcard refspecs let one fetch discover both supported refs,
    # including absent refs, without two preliminary network round trips.
    cache='refs/taskctl/cache/'+uuid.uuid4().hex
    try:
        git('fetch','--no-tags','--no-write-fetch-head',remote,
            f'+refs/tags/codex-task-*:{cache}/tags/*',
            f'+refs/heads/coord/task-*:{cache}/legacy/*')
        refs={line.split()[0]:line.split()[1] for line in
              git('for-each-ref','--format=%(refname) %(objectname)',cache+'/').splitlines()}
        tag=refs.get(cache+'/tags/board');legacy=refs.get(cache+'/legacy/board')
        if tag and legacy:raise BoardError('Two board refs exist; stop and resolve migration before writing')
        active_ref=LEGACY_REF if legacy else REF
        oid=tag or legacy
        if not oid:
            cache_board(remote,None,None,active_ref)
            return None,None
        board=json.loads(git('show',f'{oid}:state.json'))
        cache_board(remote,oid,board,active_ref)
        return oid,board
    finally:
        refs=git('for-each-ref','--format=%(refname)',cache+'/',check=False).splitlines()
        if refs:git('update-ref','--stdin',data=''.join('delete '+ref+'\n' for ref in refs),check=False)

def push_board(remote:str,old:str|None,board:dict[str,Any],message:str)->bool:
    cached=snapshot(remote)
    active_ref=cached['ref'] if cached and cached.get('oid')==old else board_ref(remote)
    blob=git('hash-object','-w','--stdin',data=json.dumps(board,ensure_ascii=False,sort_keys=True,indent=2)+'\n')
    tree=git('mktree',data=f'100644 blob {blob}\tstate.json\n')
    cmd=['commit-tree',tree]
    if old:cmd+=['-p',old]
    cmd+=['-m',message]
    commit=git(*cmd)
    p=subprocess.run(['git','push',f'--force-with-lease={active_ref}:{old or ""}',remote,f'{commit}:{active_ref}'],text=True,encoding='utf-8',errors='replace',capture_output=True)
    if p.returncode==0:
        cache_board(remote,commit,board,active_ref)
        return True
    # A transient/disallowed write is never treated as an offline claim.
    current=git('ls-remote',remote,active_ref)
    current_oid=current.split()[0] if current else None
    if current_oid==commit:
        # The server may have accepted the write before the transport failed.
        cache_board(remote,commit,board,active_ref)
        return True
    if current_oid==old:raise BoardError(p.stderr.strip() or 'Push rejected; no lock acquired')
    return False

def normalized(path:str)->str:
    if '\\' in path or '*' in path or path.startswith('/') or any(x in ('..','.') for x in path.split('/')):
        raise BoardError('Use relative POSIX exact files or directory prefixes ending in /')
    if not path:raise BoardError('Empty lock path')
    return path

def overlap(a:str,b:str)->bool:
    return a==b or (a.endswith('/') and b.startswith(a)) or (b.endswith('/') and a.startswith(b))

def taskdef(board:dict[str,Any],id:str)->dict[str,Any]:
    for task in board['graph']['tasks']:
        if task['id']==id:return task
    raise BoardError(f'Unknown task {id}')

def blockers(board:dict[str,Any],task:dict[str,Any],paths:list[str]|None=None)->list[str]:
    state=board['tasks'][task['id']]
    problems=[]
    for dep in task['hard_dependencies']:
        if board['tasks'][dep]['status']!='done':problems.append('dependency:'+dep)
    for id,s in board['tasks'].items():
        if id==task['id'] or s['status'] not in ('claimed','submitted'):continue
        if any(overlap(a,b) for a in (paths or task['write_paths']) for b in s['paths']):
            problems.append('lock:'+id)
    return problems

def require_token(state:dict[str,Any],token:str)->None:
    if state.get('token')!=token or state['status'] not in ('claimed','submitted'):
        raise BoardError('Stale/invalid claim token; no transition performed')

def ready_rows(board:dict[str,Any])->list[dict[str,Any]]:
    rows=[]
    for t in board['graph']['tasks']:
        s=board['tasks'][t['id']];why=blockers(board,t)
        rows.append({'id':t['id'],'title':t['title'],'priority':t['priority'],'effective_priority':t.get('effective_priority',t['priority']),'kind':t['kind'],
          'state':s['status'],'can_claim':s['status']=='backlog' and not why,'blocked_by':why,
          'write_paths':t['write_paths'],'assignee':s.get('owner') or s.get('actor')})
    return sorted(rows,key=lambda r:(r['effective_priority'],r['id']))

def check_main_ancestry(remote:str,main:str,commit:str)->str:
    cache='refs/taskctl/main/'+uuid.uuid4().hex
    try:
        git('fetch','--no-tags',remote,f'refs/heads/{main}:{cache}')
        tip=git('rev-parse',cache)
        p=subprocess.run(['git','merge-base','--is-ancestor',commit,tip],capture_output=True,text=True)
        if p.returncode:raise BoardError('Submitted commit is not reachable from remote main. Merge preserving commit ancestry; squash mapping is not assumed.')
        return tip
    finally:git('update-ref','-d',cache,check=False)

def change(board:dict[str,Any],args:argparse.Namespace)->dict[str,Any]:
    t=taskdef(board,args.task);s=board['tasks'][args.task]
    if args.command=='claim':
        policy=op.policy_for(board)
        owner=op.owner_at() if policy else None
        if policy:op.verify_issue(policy,args.task,owner)
        if s['status']!='backlog':raise BoardError('Task is not unassigned backlog')
        paths=list(dict.fromkeys([normalized(p) for p in t['write_paths']]+[normalized(p) for p in getattr(args,'path',[])]))
        why=blockers(board,t,paths)
        if why:raise BoardError('; '.join(why))
        if policy:
            cache='refs/taskctl/base/'+uuid.uuid4().hex
            try:
                git('fetch','--no-tags','--no-write-fetch-head',args.remote,f"refs/heads/{policy['integration_branch']}:{cache}")
                base=git('rev-parse',cache)
            finally:git('update-ref','-d',cache,check=False)
        else:base=git('rev-parse','HEAD')
        for dep in t['hard_dependencies']:
            depcommit=board['tasks'][dep].get('submitted_commit')
            if not depcommit or subprocess.run(['git','merge-base','--is-ancestor',depcommit,base],capture_output=True).returncode:
                raise BoardError('Local HEAD lacks required dependency '+dep+'; fetch/pull develop before claiming')
        s.update(status='claimed',actor=args.actor or owner,token=uuid.uuid4().hex,paths=paths,
                 generation=s['generation']+1,submitted_commit=None,landed_main=None,base_commit=base)
        if policy:s.update(owner=owner,issue_number=policy['issue_numbers'][args.task])
    elif args.command=='recover':
        if s['status'] not in ('claimed','submitted'):raise BoardError('Task has no active claim')
        if not args.confirm_stopped:raise BoardError('Confirm the previous agent has stopped before recovery')
        s.update(status='backlog',actor=None,token=None,paths=[],generation=s['generation']+1,
                 note=args.note,submitted_commit=None,landed_main=None)
    else:
        require_token(s,args.token)
        if args.command=='add-lock':
            paths=list(dict.fromkeys(s['paths']+[normalized(x) for x in args.path]))
            why=blockers(board,t,paths)
            if why:raise BoardError('; '.join(why))
            s['paths']=paths
        elif args.command in ('submit','complete'):
            if s['status'] not in ('claimed','submitted'):raise BoardError('An active claim is required to submit')
            commit=git('rev-parse',f'{args.commit}^{{commit}}')
            files=[f for f in git('diff','--name-only','--no-renames','-z',s['base_commit'],commit).split('\0') if f]
            outside=[f for f in files if not any(f==p or (p.endswith('/') and f.startswith(p)) for p in s['paths'])]
            if outside:raise BoardError('Changed paths outside claim: '+', '.join(outside))
            s.update(status='submitted',submitted_commit=commit,note=args.evidence)
            if args.command=='complete':
                target=args.main or (op.policy_for(board) or {}).get('integration_branch','main')
                if op.policy_for(board) and target=='main' and not op.pending_preparation(board):raise BoardError('Complete on develop; main is release-only')
                tip=check_main_ancestry(args.remote,target,commit)
                s.update(status='done',landed_main=tip,paths=[],token=None)
        elif args.command=='land':
            if s['status']!='submitted':raise BoardError('Task must be submitted first')
            target=args.main or (op.policy_for(board) or {}).get('integration_branch','main')
            if op.policy_for(board) and target=='main' and not op.pending_preparation(board):raise BoardError('Land on develop; main is release-only')
            tip=check_main_ancestry(args.remote,target,s['submitted_commit'])
            s.update(status='done',landed_main=tip,paths=[],token=None)
        elif args.command=='release':
            s.update(status='backlog',actor=None,token=None,paths=[],generation=s['generation']+1,
                     note=args.note,submitted_commit=None)
        elif args.command=='handoff':
            if op.policy_for(board):
                if args.to not in op.OWNERS:raise BoardError('Handoff destination must be a CODEX_OWNER')
                op.verify_issue(op.policy_for(board),args.task,args.to)
                s['owner']=args.to
            s.update(actor=args.to,token=uuid.uuid4().hex,generation=s['generation']+1,note=args.note)
        else:raise BoardError('Unknown transition')
    board['revision']+=1
    return copy.deepcopy(s)

def main()->int:
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--remote',default='origin')
    sub=parser.add_subparsers(dest='command',required=True)
    p=sub.add_parser('init');p.add_argument('--manifest',default=str(graph_path(Path.cwd())))
    p=sub.add_parser('ready');p.add_argument('--all',action='store_true');p.add_argument('--json',action='store_true')
    p=sub.add_parser('claim');p.add_argument('task');p.add_argument('--actor');p.add_argument('--path',action='append',default=[]);p.add_argument('--receipt');p.add_argument('--definition')
    for cmd in ('release','handoff','submit','land','complete','add-lock'):
        p=sub.add_parser(cmd);p.add_argument('task');p.add_argument('--token',required=True)
        if cmd in ('release','handoff'):p.add_argument('--note',required=True)
        if cmd=='handoff':p.add_argument('--to',required=True)
        if cmd in ('submit','complete'):p.add_argument('--commit',required=True);p.add_argument('--evidence',required=True)
        if cmd in ('land','complete'):p.add_argument('--main')
        if cmd=='add-lock':p.add_argument('--path',action='append',required=True)
    p=sub.add_parser('recover');p.add_argument('task');p.add_argument('--confirm-stopped',action='store_true');p.add_argument('--note',required=True)
    args=parser.parse_args()
    try:
        if args.command=='ready':
            _,board=read_board(args.remote)
            if not board:raise BoardError('Board missing; run init once')
            rows=ready_rows(board)
            if not args.all:rows=[r for r in rows if r['can_claim']]
            if args.json:print(json.dumps(rows,ensure_ascii=False,indent=2))
            else:
                for r in rows:
                    label='READY' if r['can_claim'] else ','.join(r['blocked_by']) or r['state']
                    print(r['id'],r['priority'],label,r['title'])
            return 0
        with local_lock('writer',args.remote):
            deadline=time.monotonic()+120
            for attempt in range(32):
                if attempt and time.monotonic()>=deadline:break
                old,board=read_board(args.remote)
                if args.command=='init':
                    if board:raise BoardError('Board already initialized; refusing overwrite')
                    graph=load_graph(Path.cwd(),args.manifest)
                    for t in graph['tasks']:
                        for p in t['write_paths']:normalized(p)
                    board={'schemaVersion':2,'revision':0,'graph':graph,'tasks':{
                        t['id']:{'status':'backlog','actor':None,'token':None,'generation':0,'paths':[],'note':None}
                        for t in graph['tasks']}}
                    result={'initialized':True,'tasks':len(board['tasks'])}
                else:
                    if not board:raise BoardError('Board missing; run init once')
                    if getattr(args,'task',None) and args.task.isdigit():
                        args.task=next((t for t,n in (op.policy_for(board) or {}).get('issue_numbers',{}).items() if n==int(args.task)),args.task)
                    if args.command=='claim' and args.definition:
                        register_inline(board,args.task,json.loads(Path(args.definition).read_text(encoding='utf-8')))
                    result=change(board,args)
                    if args.command=='claim' and args.receipt:
                        # Persist the proposed token before transport: a killed caller can
                        # distinguish its accepted claim from somebody else's claim.
                        atomic_json(Path(args.receipt),result)
                if push_board(args.remote,old,board,'taskctl '+args.command):
                    if args.command in ('land','complete') and op.policy_for(board) and taskdef(board,args.task).get('kind')=='preparation' and not op.pending_preparation(board):
                        from protect_main import protect
                        result['main_protection']=protect(board)
                    print(json.dumps(result,ensure_ascii=False,indent=2))
                    return 0
                time.sleep(random.uniform(0.1,min(3.0,0.2*(2**min(attempt,5)))))
            raise BoardError('Concurrent writes prevented commit; no claim/transition confirmed. Re-run from latest board.')
    except (BoardError,OSError,ValueError,KeyError) as error:
        print(json.dumps({'error':str(error)},ensure_ascii=False),file=sys.stderr);return 2
if __name__=='__main__':raise SystemExit(main())
