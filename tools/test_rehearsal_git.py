"""Exercise hooks and graph updates with two clones and an isolated bare remote."""
import json,os,shutil,subprocess,tempfile,unittest,sys,signal
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class Integration(unittest.TestCase):
 def run_cmd(self,cwd,*cmd,ok=True):
  if cmd[0]=='python3':cmd=(sys.executable,'-X','utf8',*cmd[1:])
  process=subprocess.Popen(cmd,cwd=cwd,text=True,encoding='utf-8',stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=self.env,start_new_session=os.name=='posix')
  try:out,err=process.communicate(timeout=45)
  except subprocess.TimeoutExpired:
   if os.name=='posix':os.killpg(process.pid,signal.SIGKILL)
   else:subprocess.run(['taskkill','/PID',str(process.pid),'/T','/F'],capture_output=True)
   process.communicate();self.fail('Isolated test command timed out; stopped its process group: '+str(cmd))
  result=subprocess.CompletedProcess(cmd,process.returncode,out,err)
  if ok and result.returncode:self.fail(' '.join(cmd)+'\n'+result.stdout+result.stderr)
  if not ok:self.assertNotEqual(result.returncode,0,result.stdout)
  return result
 def git(self,cwd,*args,ok=True):return self.run_cmd(cwd,'git',*args,ok=ok)
 def ctl(self,cwd,*args,ok=True):return self.run_cmd(cwd,'python3','tools/taskctl.py',*args,ok=ok)
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory(prefix="hooks 日本語 ");self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name)
  fakebin=self.root/'fake-bin';fakebin.mkdir()
  mise=fakebin/'mise';mise.write_text('#!/bin/sh\nif [ "$1" = trust ]; then exit 0; fi\nif [ "$1" = exec ]; then shift; [ "$1" = -- ] && shift; exec "$@"; fi\nexit 2\n');mise.chmod(0o755)
  (fakebin/'mise.cmd').write_text('@echo off\r\nif "%1"=="trust" exit /b 0\r\nif "%1"=="exec" shift\r\nif "%1"=="--" shift\r\n%*\r\n')
  self.env=dict(os.environ,PYTHONUTF8='1',GIT_CONFIG_NOSYSTEM='1',GIT_CONFIG_GLOBAL=os.devnull,GIT_AUTHOR_NAME='Test',GIT_AUTHOR_EMAIL='test@example.invalid',GIT_COMMITTER_NAME='Test',GIT_COMMITTER_EMAIL='test@example.invalid',PATH=str(fakebin)+os.pathsep+os.environ.get('PATH',''))
  self.remote=self.root/'origin.git';self.a=self.root/'a';self.b=self.root/'b'
  self.git(self.root,'init','--bare','--initial-branch=main',str(self.remote));self.git(self.root,'clone',str(self.remote),str(self.a))
  shutil.copytree(ROOT/'tools',self.a/'tools',ignore=shutil.ignore_patterns('__pycache__'))
  shutil.copytree(ROOT/'.githooks',self.a/'.githooks')
  shutil.copytree(ROOT/'.codex',self.a/'.codex')
  shutil.copyfile(ROOT/'mise.toml',self.a/'mise.toml')
  for hook in (self.a/'.githooks').rglob('*'):
   if hook.is_file():hook.chmod(0o755)
  self.git(self.a,'config','core.autocrlf','false')
  def task(id,path):return {'id':id,'title':id,'priority':'P0','kind':'module','hard_dependencies':[],'connect_after':[],'write_paths':[path]}
  self.graph={'tasks':[task('A','src/A/'),task('B','src/B/'),task('PLAN','TASK_GRAPH.json')]}
  (self.a/'TASK_GRAPH.json').write_text(json.dumps(self.graph));self.git(self.a,'add','.');self.git(self.a,'commit','-m','Bootstrap');self.git(self.a,'push','origin','main')
  self.ctl(self.a,'init');self.assertEqual(self.git(self.remote,'ls-tree','--name-only','refs/tags/codex-task-board').stdout.strip(),'state.json');self.git(self.root,'clone',str(self.remote),str(self.b))
  for repo in [self.a,self.b]:
   self.run_cmd(repo,'python3','tools/install_hooks.py','--bootstrap')
   self.run_cmd(repo,'python3','tools/install_hooks.py')
 def state(self):
  return json.loads(self.git(self.remote,'show','refs/tags/codex-task-board:state.json').stdout)
 def claim(self,repo,id):return json.loads(self.ctl(repo,'claim',id,'--actor',repo.name).stdout)
 def work(self,repo,id,path):
  s=self.claim(repo,id);self.git(repo,'checkout','-b','task/'+id,s['base_commit']);p=repo/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text('work');self.git(repo,'add',path);self.git(repo,'commit','-m',id)
  return s
 def test_hooks_submit_merge_land(self):
  s=self.work(self.a,'A','src/A/記録.txt');self.git(self.a,'push','origin','task/A')
  other=self.work(self.b,'B','src/B/b.txt');self.git(self.b,'push','origin','task/B')
  self.ctl(self.b,'claim','A','--actor','second',ok=False)
  (self.a/'outside.txt').write_text('not owned');self.git(self.a,'add','outside.txt');self.git(self.a,'commit','-m','outside',ok=False);self.git(self.a,'reset','HEAD','outside.txt');(self.a/'outside.txt').unlink()
  self.ctl(self.a,'submit','A','--token',s['token'],'--commit','HEAD','--evidence','local integration')
  self.git(self.a,'checkout','main');self.git(self.a,'merge','--ff-only','task/A');self.git(self.a,'push','origin','main');self.ctl(self.a,'land','A','--token',s['token'])
  self.assertEqual(self.state()['tasks']['A']['status'],'done');self.assertEqual(self.state()['tasks']['B']['token'],other['token'])
 def test_graph_sync_preserves_active_claim_and_rejects_invalid(self):
  s=self.work(self.a,'A','src/A/a.txt');before=self.state()['tasks']['A']
  plan=self.claim(self.b,'PLAN');self.git(self.b,'checkout','-b','task/PLAN',plan['base_commit'])
  changed=json.loads(json.dumps(self.graph));changed['tasks'][1]['hard_dependencies']=['A']
  (self.b/'TASK_GRAPH.json').write_text(json.dumps(changed))
  self.run_cmd(self.b,'python3','tools/sync_graph.py','--apply',ok=False)
  self.git(self.b,'add','TASK_GRAPH.json');self.git(self.b,'commit','-m','Dependency found');self.git(self.b,'push','origin','task/PLAN');self.ctl(self.b,'submit','PLAN','--token',plan['token'],'--commit','HEAD','--evidence','dependency confirmed')
  self.git(self.b,'checkout','main');self.git(self.b,'merge','--ff-only','task/PLAN');self.git(self.b,'push','origin','main');self.ctl(self.b,'land','PLAN','--token',plan['token'])
  self.run_cmd(self.b,'python3','tools/sync_graph.py','--apply');self.assertEqual(self.state()['tasks']['A'],before)
  self.assertEqual(self.state()['graph']['tasks'][1]['hard_dependencies'],['A']);self.ctl(self.b,'claim','B','--actor','second',ok=False)
  changed['tasks'][0]['write_paths']=['src/'];(self.b/'TASK_GRAPH.json').write_text(json.dumps(changed));revision=self.state()['revision'];self.run_cmd(self.b,'python3','tools/sync_graph.py',ok=False);self.assertEqual(self.state()['revision'],revision)
 def test_unsubmitted_main_rejected(self):
  self.work(self.a,'A','src/A/a.txt');self.git(self.a,'checkout','main');self.git(self.a,'merge','--ff-only','task/A');self.git(self.a,'push','origin','main',ok=False)
 def test_legacy_migration_preserves_history_and_fresh_clone_reads_it(self):
  oid=self.git(self.remote,'rev-parse','refs/tags/codex-task-board').stdout.strip()
  self.git(self.remote,'update-ref','refs/heads/coord/task-board',oid)
  self.git(self.remote,'update-ref','-d','refs/tags/codex-task-board')
  before=json.loads(self.git(self.remote,'show',oid+':state.json').stdout)
  self.run_cmd(self.a,'python3','tools/migrate_board_ref.py','--apply')
  self.assertEqual(self.git(self.remote,'rev-parse','refs/tags/codex-task-board').stdout.strip(),oid)
  self.git(self.remote,'show-ref','--verify','refs/heads/coord/task-board',ok=False)
  self.assertEqual(self.state(),before)
  fresh=self.root/'fresh';self.git(self.root,'clone',str(self.remote),str(fresh))
  self.assertIn('A',self.ctl(fresh,'ready','--json').stdout)
 def test_migration_rejects_active_claim(self):
  self.claim(self.a,'A');oid=self.git(self.remote,'rev-parse','refs/tags/codex-task-board').stdout.strip()
  self.git(self.remote,'update-ref','refs/heads/coord/task-board',oid);self.git(self.remote,'update-ref','-d','refs/tags/codex-task-board')
  self.run_cmd(self.a,'python3','tools/migrate_board_ref.py','--apply',ok=False)
  self.assertEqual(self.git(self.remote,'rev-parse','refs/heads/coord/task-board').stdout.strip(),oid)
 def test_prune_removes_merged_branches_and_retains_worktree(self):
  s=self.work(self.a,'A','src/A/a.txt');self.git(self.a,'push','origin','task/A')
  self.ctl(self.a,'submit','A','--token',s['token'],'--commit','HEAD','--evidence','test')
  self.git(self.a,'checkout','main');self.git(self.a,'merge','--ff-only','task/A');self.git(self.a,'push','origin','main');self.ctl(self.a,'land','A','--token',s['token'])
  wt=self.root/'finished';self.git(self.a,'worktree','add',str(wt),'task/A')
  self.git(self.a,'push','origin','--delete','task/A',ok=False)
  self.run_cmd(self.a,'python3','tools/prune_branches.py','--apply')
  self.assertTrue((wt/'src/A/a.txt').is_file());self.assertEqual(self.git(wt,'branch','--show-current').stdout.strip(),'')
  self.assertEqual(self.git(self.remote,'for-each-ref','--format=%(refname)','refs/heads/').stdout.strip(),'refs/heads/main')
  self.assertEqual(self.state()['tasks']['A']['status'],'done')
 def test_prune_rejects_unmerged_local_commit(self):
  s=self.work(self.a,'A','src/A/a.txt');self.ctl(self.a,'release','A','--token',s['token'],'--note','stopped with unmerged work')
  self.git(self.a,'checkout','main');self.run_cmd(self.a,'python3','tools/prune_branches.py','--apply',ok=False)
  self.git(self.a,'show-ref','--verify','refs/heads/task/A')
 def test_worktree_helper_claims_verifies_and_runs_locally(self):
  state=self.claim(self.a,'A')
  self.ctl(self.a,'release','A','--token',state['token'],'--note','日本語の引継ぎ')
  self.env['PYTHONUTF8']='0'
  wt=self.root/'claimed'
  self.run_cmd(self.a,'python3','tools/task_worktree.py','create','A',str(wt),'--actor','helper')
  self.assertEqual(self.state()['tasks']['A']['actor'],'helper')
  self.run_cmd(wt,'python3','tools/task_worktree.py','verify')
  outside=wt/'outside.txt';outside.write_text('not owned');self.git(wt,'add','outside.txt')
  self.git(wt,'commit','-m','outside',ok=False);self.git(wt,'reset','HEAD','outside.txt');outside.unlink()
  result=self.run_cmd(self.a,'python3','tools/task_worktree.py','exec',str(wt),'git','branch','--show-current')
  self.assertEqual(result.stdout.strip(),'task/A')
  self.run_cmd(self.a,'python3','tools/task_worktree.py','create','B',str(wt),'--actor','helper',ok=False)
  self.assertEqual(self.state()['tasks']['B']['status'],'backlog')
 def test_worktree_helper_releases_trust_and_hook_failures(self):
  failing=self.root/'fail_mise.py';failing.write_text('raise SystemExit(7)\n')
  self.env['TASK_WORKTREE_MISE_BIN']=sys.executable+' '+str(failing)
  failed=self.root/'trust failure'
  result=self.run_cmd(self.a,'python3','tools/task_worktree.py','create','A',str(failed),'--actor','helper',ok=False)
  self.assertIn('mise trust',result.stderr);self.assertFalse(failed.exists())
  self.assertEqual(self.state()['tasks']['A']['status'],'backlog')
  receipt=json.loads((self.a/'.local/claims/A.json').read_text())
  self.assertEqual(receipt['status'],'backlog');self.assertEqual(receipt['worktree_failure']['stage'],'mise trust')
  del self.env['TASK_WORKTREE_MISE_BIN']
  platform='windows' if os.name=='nt' else 'macos'
  hook=self.a/'.githooks'/platform/'reference-transaction';saved=hook.read_bytes();hook.unlink()
  failed=self.root/'hook failure'
  result=self.run_cmd(self.a,'python3','tools/task_worktree.py','create','A',str(failed),'--actor','helper',ok=False)
  self.assertIn('branch guard',result.stderr);self.assertFalse(failed.exists())
  self.assertEqual(self.state()['tasks']['A']['status'],'backlog')
  hook.write_bytes(saved);hook.chmod(0o755)
  recovered=self.root/'recovered'
  self.run_cmd(self.a,'python3','tools/task_worktree.py','create','A',str(recovered),'--actor','helper')
  self.run_cmd(recovered,'python3','tools/task_worktree.py','verify')
if __name__=='__main__':unittest.main()
