#!/usr/bin/env python3
"""Dependency/path-lock task board backed by a single Git ref.

No daemon, no clock-based stealing, no GitHub assignee race. Every write creates a
child commit and CAS-pushes ONLY refs/heads/coord/task-board with an explicit old
OID. The working tree/index are never changed. This is coordination, not access
control. See TASK_EXECUTION.md for abandoned-agent recovery.
"""
from __future__ import annotations
import argparse,copy,hashlib,json,os,subprocess,sys,uuid
from pathlib import Path
from typing import Any
REF='refs/heads/coord/task-board'
class BoardError(RuntimeError): pass

def git(*args: str, data: str|None=None, check: bool=True)->str:
    p=subprocess.run(['git',*args],input=data,text=True,capture_output=True)
    if check and p.returncode: raise BoardError(p.stderr.strip() or p.stdout.strip() or 'git failed')
    return p.stdout.strip()

def read_board(remote:str)->tuple[str|None,dict[str,Any]|None]:
    listing=git('ls-remote',remote,REF)
    if not listing:return None,None
    cache='refs/taskctl/cache/'+uuid.uuid4().hex
    try:
        git('fetch','--no-tags',remote,f'{REF}:{cache}')
        oid=git('rev-parse',cache)
        board=json.loads(git('show',f'{oid}:state.json'))
        return oid,board
    finally:git('update-ref','-d',cache,check=False)

def push_board(remote:str,old:str|None,board:dict[str,Any],message:str)->bool:
    blob=git('hash-object','-w','--stdin',data=json.dumps(board,ensure_ascii=False,sort_keys=True,indent=2)+'\n')
    tree=git('mktree',data=f'100644 blob {blob}\tstate.json\n')
    cmd=['commit-tree',tree]
    if old:cmd+=['-p',old]
    cmd+=['-m',message]
    commit=git(*cmd)
    p=subprocess.run(['git','push',f'--force-with-lease={REF}:{old or ""}',remote,f'{commit}:{REF}'],text=True,capture_output=True)
    if p.returncode==0:return True
    # A transient/disallowed write is never treated as an offline claim.
    current=git('ls-remote',remote,REF)
    current_oid=current.split()[0] if current else None
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
          'write_paths':t['write_paths'],'assignee':s.get('actor')})
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
        if s['status']!='backlog':raise BoardError('Task is not unassigned backlog')
        why=blockers(board,t)
        if why:raise BoardError('; '.join(why))
        base=git('rev-parse','HEAD')
        for dep in t['hard_dependencies']:
            depcommit=board['tasks'][dep].get('submitted_commit')
            if not depcommit or subprocess.run(['git','merge-base','--is-ancestor',depcommit,base],capture_output=True).returncode:
                raise BoardError('Local HEAD lacks required dependency '+dep+'; fetch/pull main before claiming')
        paths=[normalized(p) for p in t['write_paths']]
        s.update(status='claimed',actor=args.actor,token=uuid.uuid4().hex,paths=paths,
                 generation=s['generation']+1,submitted_commit=None,landed_main=None,base_commit=git('rev-parse','HEAD'))
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
        elif args.command=='submit':
            if s['status'] not in ('claimed','submitted'):raise BoardError('An active claim is required to submit')
            commit=git('rev-parse',f'{args.commit}^{{commit}}')
            files=git('diff','--name-only','--no-renames',s['base_commit'],commit).splitlines()
            outside=[f for f in files if not any(f==p or (p.endswith('/') and f.startswith(p)) for p in s['paths'])]
            if outside:raise BoardError('Changed paths outside claim: '+', '.join(outside))
            s.update(status='submitted',submitted_commit=commit,note=args.evidence)
        elif args.command=='land':
            if s['status']!='submitted':raise BoardError('Task must be submitted first')
            tip=check_main_ancestry(args.remote,args.main,s['submitted_commit'])
            s.update(status='done',landed_main=tip,paths=[],token=None)
        elif args.command=='release':
            s.update(status='backlog',actor=None,token=None,paths=[],generation=s['generation']+1,
                     note=args.note,submitted_commit=None)
        elif args.command=='handoff':
            s.update(actor=args.to,token=uuid.uuid4().hex,generation=s['generation']+1,note=args.note)
        else:raise BoardError('Unknown transition')
    board['revision']+=1
    return copy.deepcopy(s)

def main()->int:
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--remote',default='origin')
    sub=parser.add_subparsers(dest='command',required=True)
    p=sub.add_parser('init');p.add_argument('--manifest',default='TASK_GRAPH.json')
    p=sub.add_parser('ready');p.add_argument('--all',action='store_true');p.add_argument('--json',action='store_true')
    p=sub.add_parser('claim');p.add_argument('task');p.add_argument('--actor',required=True)
    for cmd in ('release','handoff','submit','land','add-lock'):
        p=sub.add_parser(cmd);p.add_argument('task');p.add_argument('--token',required=True)
        if cmd in ('release','handoff'):p.add_argument('--note',required=True)
        if cmd=='handoff':p.add_argument('--to',required=True)
        if cmd=='submit':p.add_argument('--commit',required=True);p.add_argument('--evidence',required=True)
        if cmd=='land':p.add_argument('--main',default='main')
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
        for _ in range(6):
            old,board=read_board(args.remote)
            if args.command=='init':
                if board:raise BoardError('Board already initialized; refusing overwrite')
                graph=json.loads(Path(args.manifest).read_text(encoding='utf-8'))
                for t in graph['tasks']:
                    for p in t['write_paths']:normalized(p)
                board={'schemaVersion':2,'revision':0,'graph':graph,'tasks':{
                    t['id']:{'status':'backlog','actor':None,'token':None,'generation':0,'paths':[],'note':None}
                    for t in graph['tasks']}}
                result={'initialized':True,'tasks':len(board['tasks'])}
            else:
                if not board:raise BoardError('Board missing; run init once')
                result=change(board,args)
            if push_board(args.remote,old,board,'taskctl '+args.command):
                print(json.dumps(result,ensure_ascii=False,indent=2));return 0
        raise BoardError('Concurrent writes prevented commit; no claim/transition confirmed. Re-run from latest board.')
    except (BoardError,OSError,ValueError,KeyError) as error:
        print(json.dumps({'error':str(error)},ensure_ascii=False),file=sys.stderr);return 2
if __name__=='__main__':raise SystemExit(main())
