import sys
"""Owner naming, real linked-worktree guards, and deferred main protection."""
import copy,json,os,shutil,subprocess,unittest
from pathlib import Path
from unittest.mock import patch
import owner_policy as op
import taskctl as tc
import test_rehearsal_git as legacy

class Identity(unittest.TestCase):
 def test_metadata_ref_hook_never_recursively_reads_board(self):
  import io,rehearsal_guard
  with patch('sys.argv',['guard','refs','prepared']),patch('sys.stdin',io.StringIO('old new refs/taskctl/cache/test\n')),patch('rehearsal_guard.tc.read_board') as read:
   rehearsal_guard.main();read.assert_not_called()

 def test_owner_title_preserves_body_id(self):
  issue={'number':2,'title':'[koshiro] Database','body':'<!-- task-id: FND-002 -->\n# [FND-002] Database'}
  self.assertEqual(op.task_id(issue),'FND-002');self.assertEqual(op.title_owner(issue['title']),'koshiro')
  issue['body']+='\n<!-- task-id: FND-003 -->';self.assertRaises(ValueError,op.task_id,issue)
 def test_owner_branch(self):
  self.assertEqual(op.branch_name('koshiro',2,'db-foundation'),'koshiro/2-db-foundation')
  for owner,number,slug in [('koshiroucl',2,'db'),('koshiro',0,'db'),('koshiro',2,'../bad')]:self.assertRaises(ValueError,op.branch_name,owner,number,slug)
 def test_owner_sync_keeps_number_and_assignment(self):
  import sync_issues,tempfile
  with tempfile.TemporaryDirectory() as d,patch.object(sync_issues,'ROOT',Path(d)):
   body='<!-- task-id: FND-002 -->\n# [FND-002] Database\n';Path(d,'body.md').write_text(body)
   task={'id':'FND-002','title':'Database','body_file':'body.md'}
   result=sync_issues.plan([task],[{'number':2,'title':'[koshiro] Database','body':body}])[0]
   self.assertEqual((result['action'],result['number'],result['title']),('unchanged',2,'[koshiro] Database'))
 def test_git_stdin_is_utf8_bytes_not_platform_newlines(self):
  with patch('taskctl.subprocess.run') as run:
   run.return_value=subprocess.CompletedProcess([],0,b'ok\n',b'')
   tc.git('mktree',data='100644 blob hash\tstate.json\n')
   self.assertEqual(run.call_args.kwargs['input'],b'100644 blob hash\tstate.json\n')
   self.assertNotIn('text',run.call_args.kwargs)

class MainProtection(unittest.TestCase):
 def test_never_calls_github_before_preparation_done(self):
  import protect_main
  board={'graph':{'tasks':[{'id':'P','kind':'preparation'}]},'tasks':{'P':{'status':'claimed'}}}
  with patch('protect_main.subprocess.run') as run:
   self.assertRaises(tc.BoardError,protect_main.protect,board);run.assert_not_called()
 def test_protects_only_after_done_and_requires_review(self):
  import protect_main
  board={'graph':{'task_policy':{'repository':'test/example'},'tasks':[{'id':'P','kind':'preparation'}]},'tasks':{'P':{'status':'done'}}}
  with patch('protect_main.subprocess.run') as run:
   run.side_effect=[subprocess.CompletedProcess([],1,'{"status":404}','not protected'),subprocess.CompletedProcess([],0,'{}','')]
   self.assertTrue(protect_main.protect(board)['main_protected'])
   body=json.loads(run.call_args.kwargs['input']);self.assertEqual(body['required_pull_request_reviews']['required_approving_review_count'],1);self.assertTrue(body['enforce_admins'])

class OwnerIntegration(legacy.Integration):
 # Inherit setup utilities, not the legacy tests: those run in Integration itself.
 def setUp(self):
  super().setUp()
  self.env['CODEX_OWNER']='rozwer'
  policy={'version':1,'repository':'test/example','integration_branch':'develop','issue_numbers':{'A':1,'B':2,'PLAN':3,'PREP':4}}
  self.issues=self.root/'issues.json'
  self.issues.write_text(json.dumps({str(n):{'number':n,'state':'open','title':'['+('koshiro' if t=='B' else 'rozwer')+'] '+t,'body':'# ['+t+'] '+t,'labels':[{'name':'task'}]} for t,n in policy['issue_numbers'].items()}))
  bin=self.root/'bin';bin.mkdir();gh=bin/'gh'
  gh.write_text('#!/usr/bin/env python3\nimport json,os,sys\nprint(json.load(open(os.environ["OWNER_TEST_ISSUES"]))[sys.argv[-1].split("/")[-1]])\n'.replace('print(json.load(open(os.environ["OWNER_TEST_ISSUES"]))[sys.argv[-1].split("/")[-1]])','print(json.dumps(json.load(open(os.environ["OWNER_TEST_ISSUES"]))[sys.argv[-1].split("/")[-1]]))'))
  if os.name=='nt':
   (bin/'gh.cmd').write_text('@"'+sys.executable+'" -X utf8 "'+str(gh)+'" %*\n')
  gh.chmod(0o755);self.env['PATH']=str(bin)+os.pathsep+self.env['PATH'];self.env['OWNER_TEST_ISSUES']=str(self.issues)
  self.git(self.remote,'update-ref','refs/heads/develop',self.git(self.remote,'rev-parse','refs/heads/main').stdout.strip())
  b=self.state();b['graph']['task_policy']=policy
  b['graph']['tasks'].append({'id':'PREP','kind':'preparation','title':'PREP','priority':'P0','hard_dependencies':[],'connect_after':[],'write_paths':['docs/prep/']})
  b['tasks']['PREP']={'status':'backlog','actor':None,'token':None,'paths':[],'generation':0}
  self.save_board(b)
 def save_board(self,b):
  # Simulate a remote CAS writer/PR merge in the isolated bare test remote.
  p=subprocess.run(['git','hash-object','-w','--stdin'],cwd=self.remote,input=json.dumps(b).encode('utf-8'),capture_output=True,env=self.env,check=True);blob=p.stdout.decode('utf-8').strip()
  p=subprocess.run(['git','mktree'],cwd=self.remote,input=f'100644 blob {blob}\tstate.json\n'.encode('utf-8'),capture_output=True,env=self.env,check=True);tree=p.stdout.decode('utf-8').strip()
  old=self.git(self.remote,'rev-parse','refs/tags/codex-task-board').stdout.strip()
  oid=self.git(self.remote,'commit-tree',tree,'-p',old,'-m','test state').stdout.strip();self.git(self.remote,'update-ref','refs/tags/codex-task-board',oid)
 def create_owned(self):
  wt=self.root/'owned';self.run_cmd(self.a,'python3','tools/task_worktree.py','create','1',str(wt),'--slug','feature-a')
  return wt,self.state()['tasks']['A']
 def test_owner_roundtrip_develop_and_scope(self):
  wt,s=self.create_owned();self.assertEqual(self.git(wt,'branch','--show-current').stdout.strip(),'rozwer/1-feature-a')
  p=wt/'src/A/a.txt';p.parent.mkdir(parents=True);p.write_text('a');self.git(wt,'add','src/A/a.txt');self.git(wt,'commit','-m','A');self.git(wt,'push','origin','rozwer/1-feature-a')
  self.git(wt,'push','origin','HEAD:refs/heads/develop',ok=False)
  self.git(wt,'branch','koshiro/1-wrong',ok=False)
  self.git(wt,'branch','task/A',ok=False)
  outside=wt/'outside.txt';outside.write_text('x');self.git(wt,'add','outside.txt');self.git(wt,'commit','-m','outside',ok=False);self.git(wt,'reset','HEAD','outside.txt');outside.unlink()
  self.ctl(wt,'submit','A','--token',s['token'],'--commit','HEAD','--evidence','real test')
  sha=self.git(wt,'rev-parse','HEAD').stdout.strip();self.git(self.remote,'update-ref','refs/heads/develop',sha)
  self.ctl(wt,'land','A','--token',s['token']);self.assertEqual(self.state()['tasks']['A']['status'],'done')
 def test_other_owner_cannot_claim(self):self.ctl(self.a,'claim','2','--actor','rozwer',ok=False)
 def test_primary_checkout_cannot_implement(self):
  s=json.loads(self.ctl(self.a,'claim','1').stdout);self.git(self.a,'switch','-c','rozwer/1-primary',s['base_commit'])
  p=self.a/'src/A/a.txt';p.parent.mkdir(parents=True);p.write_text('x');self.git(self.a,'add','.');self.git(self.a,'commit','-m','not a worktree',ok=False)
 def test_main_deferred_until_all_preparation_done(self):
  p=self.a/'prep.txt';p.write_text('setup');self.git(self.a,'add','prep.txt');self.git(self.a,'commit','-m','Preparation main permitted')
  self.git(self.a,'push','origin','main')
  b=self.state();b['tasks']['PREP']['status']='done';self.save_board(b)
  p.write_text('blocked');self.git(self.a,'add','prep.txt');self.git(self.a,'commit','-m','After preparation',ok=False)
 def test_develop_checkout_is_readonly_during_preparation(self):
  self.git(self.a,'fetch','origin','develop');self.git(self.a,'checkout','-b','develop','origin/develop')
  (self.a/'prep.txt').write_text('x');self.git(self.a,'add','prep.txt');self.git(self.a,'commit','-m','develop cannot edit',ok=False)
 def test_codex_edit_and_shell_guard(self):
  root=Path(__file__).resolve().parents[1]
  for repo in (self.a,):
   shutil.copytree(root/'scripts',repo/'scripts');shutil.copytree(root/'node_modules',repo/'node_modules')
  # These scripts are untracked test fixtures; do not claim product paths for them.
  wt,s=self.create_owned();shutil.copytree(root/'scripts',wt/'scripts');shutil.copytree(root/'node_modules',wt/'node_modules')
  def hook(cwd,name,input,ok):
   e={'hook_event_name':'PreToolUse','cwd':str(cwd),'tool_name':name,'tool_input':input}
   cfg=json.loads((root/'.codex/hooks.json').read_text())
   group=next(g for g in cfg['hooks']['PreToolUse'] if 'apply_patch' in g['matcher'])
   self.assertIn('exec_command',group['matcher'])
   command=group['hooks'][0]['commandWindows' if os.name=='nt' else 'command']
   p=subprocess.run(command,shell=True,cwd=cwd,input=json.dumps(e),text=True,encoding='utf-8',capture_output=True,env=self.env,timeout=60)
   self.assertEqual(p.returncode==0,ok,p.stderr)
  hook(wt,'apply_patch',{'patch':'*** Begin Patch\n*** Add File: src/A/a.txt\n+x\n*** End Patch'},True)
  hook(wt,'apply_patch',{'patch':'*** Begin Patch\n*** Add File: src/B/b.txt\n+x\n*** End Patch'},False)
  hook(self.a,'exec_command',{'cmd':'node -e "process.exit(0)"'},True)
  b=self.state();b['tasks']['PREP']['status']='done';self.save_board(b)
  hook(self.a,'apply_patch',{'patch':'*** Begin Patch\n*** Add File: prep.txt\n+x\n*** End Patch'},False)
  hook(self.a,'exec_command',{'cmd':'node -e "process.exit(0)"'},False)
  hook(self.a,'exec_command',{'cmd':'git status'},True)

# Avoid running inherited legacy scenarios against the new owner-policy fixture.
for name in list(legacy.Integration.__dict__):
 if name.startswith('test_') and name not in OwnerIntegration.__dict__:setattr(OwnerIntegration,name,None)


class StartSnapshot(unittest.TestCase):
 def test_start_reuses_successful_claim_and_commit_still_checks_remote(self):
  import task_worktree as work
  import rehearsal_guard as guard
  claimed={'token':'current','actor':'rozwer','status':'claimed','base_commit':'base'}
  board={'tasks':{'A':dict(claimed)}}
  def git(*args,**kwargs):
   return 'base' if args==('rev-parse','HEAD') else 'rozwer/1-work'
  with patch.object(work.tc,'cached_board',return_value=('oid',board)),patch.object(work.tc,'git',side_effect=git),patch.object(work,'verify',return_value={'task':'A'}) as verify,patch.object(guard,'check_commit') as check,patch.object(work.tc,'read_board') as remote:
   self.assertEqual(work.verify_started_claim(Path.cwd(),'A',claimed),{'task':'A'})
   remote.assert_not_called()
   self.assertTrue(verify.call_args.kwargs['local'])
   self.assertFalse(check.call_args.kwargs['check_github'])
  with patch('sys.argv',['guard','pre-commit']),patch.object(guard.tc,'git',return_value='task/A'),patch.object(guard.tc,'read_board',side_effect=tc.BoardError('remote unavailable')) as remote:
   with self.assertRaisesRegex(tc.BoardError,'remote unavailable'):guard.main()
   remote.assert_called_once()

 def test_changed_token_owner_status_or_base_rejects_start(self):
  import task_worktree as work
  claimed={'token':'current','actor':'rozwer','status':'claimed','base_commit':'base'}
  cases=[({'token':'old'},'base'),({'actor':'kaiya'},'base'),({'status':'done'},'base'),({},'different')]
  for change,head in cases:
   with self.subTest(change=change,head=head):
    current=dict(claimed,**change)
    with patch.object(work.tc,'cached_board',return_value=('oid',{'tasks':{'A':current}})),patch.object(work.tc,'git',return_value=head),patch.object(work,'verify') as verify:
     with self.assertRaises(tc.BoardError):work.verify_started_claim(Path.cwd(),'A',claimed)
     verify.assert_not_called()

if __name__=='__main__':unittest.main()
