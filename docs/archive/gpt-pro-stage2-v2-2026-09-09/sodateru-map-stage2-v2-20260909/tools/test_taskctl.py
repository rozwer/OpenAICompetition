#!/usr/bin/env python3
"""Real local-Git concurrency tests. Uses temp bare repo; never contacts user's repo."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json,subprocess,sys,tempfile
ROOT=Path(__file__).resolve().parents[1];TOOL=ROOT/'tools/taskctl.py';results=[]
def run(cwd,args,ok=True):
 p=subprocess.run(args,cwd=cwd,text=True,capture_output=True)
 if ok and p.returncode:raise AssertionError(f'{args}\n{p.stdout}\n{p.stderr}')
 return p

def git(cwd,*args):return run(cwd,['git',*args]).stdout.strip()
def ctl(cwd,*args,ok=True):return run(cwd,[sys.executable,str(TOOL),*args],ok)
def get(p):return json.loads(p.stdout)
def assert_bad(p):assert p.returncode!=0,(p.stdout,p.stderr)
def check(msg):results.append(msg)
with tempfile.TemporaryDirectory(prefix='map-taskctl-test-') as tmp:
 root=Path(tmp);bare=root/'remote.git';bare.mkdir();git(bare,'init','--bare','--initial-branch=main')
 base=root/'base';base.mkdir();git(base,'init','--initial-branch=main');git(base,'config','user.name','Contract Test');git(base,'config','user.email','test@example.invalid');(base/'README.md').write_text('test\n');git(base,'add','.');git(base,'commit','-m','base');git(base,'remote','add','origin',str(bare));git(base,'push','-u','origin','main')
 clones=[]
 for i in range(4):
  c=root/f'c{i}';git(root,'clone',str(bare),str(c));git(c,'config','user.name','Contract Test');git(c,'config','user.email','test@example.invalid');clones.append(c)
 tasks=[]
 for id,path,deps in [('T-ONE','feature/one/',[]),('T-TWO','feature/two/',[]),('T-THREE','feature/three/',[]),('T-PARENT','feature/',[]),('T-DEP','feature/dependency/',['T-ONE']),('T-FREE','docs/free/',[])]:
  tasks.append({'id':id,'title':id,'priority':'P0','effective_priority':'P0','kind':'test','hard_dependencies':deps,'connect_after':[],'write_paths':[path]})
 manifest=root/'graph.json';manifest.write_text(json.dumps({'tasks':tasks}))
 ctl(clones[0],'init','--manifest',str(manifest));assert_bad(ctl(clones[1],'init','--manifest',str(manifest),ok=False));check('Board init is create-only; cannot erase existing claims')
 before=git(clones[0],'status','--porcelain')
 with ThreadPoolExecutor(2) as ex:
  rs=list(ex.map(lambda i:ctl(clones[i],'claim','T-ONE','--actor',f'p{i}',ok=False),range(2)))
 assert sum(p.returncode==0 for p in rs)==1
 win=next(i for i,p in enumerate(rs) if p.returncode==0);one=get(rs[win]);check('Two concurrent claims for one task: exactly one succeeds')
 assert before==git(clones[0],'status','--porcelain');check('Claim leaves working tree/index unchanged')
 with ThreadPoolExecutor(2) as ex:
  rs=list(ex.map(lambda z:ctl(clones[z[0]],'claim',z[1],'--actor',f'p{z[0]}'),[(2,'T-TWO'),(3,'T-THREE')]))
 two,three=map(get,rs);check('Concurrent disjoint claims both succeed after CAS retry')
 assert_bad(ctl(clones[1-win],'claim','T-PARENT','--actor','parent',ok=False));check('Directory-prefix lock conflicts with child locks')
 assert_bad(ctl(clones[3],'add-lock','T-THREE','--token',three['token'],'--path','feature/two/x.ts','--path','new/free/',ok=False))
 state=json.loads(git(bare,'show','refs/heads/coord/task-board:state.json'));assert 'new/free/' not in state['tasks']['T-THREE']['paths'];check('Multi-path add-lock is all-or-none on conflict')
 assert_bad(ctl(clones[1-win],'claim','T-DEP','--actor','wait',ok=False));check('Hard dependency blocks until done, not merely claimed')
 assert_bad(ctl(clones[win],'release','T-ONE','--token','wrong-token','--note','invalid',ok=False));check('Stale/invalid token cannot release another claim')
 # Task source commit, then remote-main landing.
 c=clones[win];git(c,'switch','-c','task/one');(c/'feature/one').mkdir(parents=True);(c/'feature/one/index.ts').write_text('export const one=1;\n');git(c,'add','.');git(c,'commit','-m','one');sha=git(c,'rev-parse','HEAD')
 ctl(c,'submit','T-ONE','--token',one['token'],'--commit',sha,'--evidence','one contract accepted')
 assert_bad(ctl(c,'land','T-ONE','--token',one['token'],ok=False));check('Submitted task cannot land before source commit reaches main')
 assert_bad(ctl(clones[1-win],'claim','T-DEP','--actor','wait',ok=False));check('Submitted retains lock and does not release dependent work')
 git(c,'push','origin','HEAD:main');ctl(c,'land','T-ONE','--token',one['token']);check('Reachable main commit atomically marks done and releases paths')
 stale=clones[1-win];assert_bad(ctl(stale,'claim','T-DEP','--actor','dep',ok=False));git(stale,'pull','--ff-only','origin','main');dep=get(ctl(stale,'claim','T-DEP','--actor','dep'));check('Dependency claim requires local base to include required merged commit')
 # Disallowed edits outside paths are rejected at submit.
 git(stale,'switch','-c','task/dependency');(stale/'outside.txt').write_text('not allowed');git(stale,'add','.');git(stale,'commit','-m','outside')
 assert_bad(ctl(stale,'submit','T-DEP','--token',dep['token'],'--commit','HEAD','--evidence','invalid',ok=False));check('Submitting source edits outside reserved paths is rejected')
 newer=get(ctl(clones[2],'handoff','T-TWO','--token',two['token'],'--to','other-agent','--note','owner stopped, branch handed over'))
 assert newer['token']!=two['token'] and newer['generation']>two['generation'];assert_bad(ctl(clones[2],'release','T-TWO','--token',two['token'],'--note','old',ok=False));check('Handoff rotates generation/token and fences old owner transitions')
 assert_bad(ctl(clones[3],'recover','T-THREE','--note','not confirmed',ok=False));ctl(clones[3],'recover','T-THREE','--confirm-stopped','--note','verified agent stopped');assert_bad(ctl(clones[3],'submit','T-THREE','--token',three['token'],'--commit','HEAD','--evidence','late',ok=False));check('Recovery requires explicit stop confirmation; late old-token submit fails')
 # Fail closed against a rejecting remote hook; verify no claim exists.
 hook=bare/'hooks/update';hook.write_text('#!/bin/sh\nexit 1\n');hook.chmod(0o755)
 assert_bad(ctl(clones[2],'claim','T-FREE','--actor','rejected',ok=False));state=json.loads(git(bare,'show','refs/heads/coord/task-board:state.json'));assert state['tasks']['T-FREE']['status']=='backlog';check('Remote rejection is not treated as successful offline claim')
 assert all('expiresAt' not in s and 'deadline' not in s for s in state['tasks'].values());check('No elapsed-time/TTL automatic lock stealing')
report={'kind':'local-git-task-lock-tests','passed':len(results),'checks':results,'scope':'Temporary local bare repository and four clones; no user GitHub writes'}
(ROOT/'evidence').mkdir(exist_ok=True);(ROOT/'evidence/taskctl-tests.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False,indent=2))
