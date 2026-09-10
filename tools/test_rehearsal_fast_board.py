"""Regression evidence for fast local edits and interrupted starts."""
import json,subprocess,sys,unittest
import sync_graph
from test_rehearsal_git import Integration as Fixture

class FastBoard(unittest.TestCase):
    setUp=Fixture.setUp
    run_cmd=Fixture.run_cmd
    git=Fixture.git
    ctl=Fixture.ctl
    state=Fixture.state
    claim=Fixture.claim

    def test_one_fetch_and_no_remote_for_local_edit(self):
        claim=self.claim(self.a,'A')
        self.git(self.a,'checkout','-b','task/A',claim['base_commit'])
        code="""import taskctl as t
original=t.git
calls=[]
def traced(*args,**kw):
 calls.append(args);return original(*args,**kw)
t.git=traced
a,b=t.read_board('origin')
assert sum(c[0]=='fetch' for c in calls)==1,calls
assert not any(c[0]=='ls-remote' for c in calls),calls
import task_worktree as w
def forbidden(*a,**k):raise AssertionError('remote read during edit')
t.read_board=forbidden
assert w.verify(__import__('pathlib').Path.cwd(),local=True)['task']=='A'
"""
        self.run_cmd(self.a,sys.executable,'-c',"import sys;sys.path.insert(0,'tools');"+code)
        self.ctl(self.b,'recover','A','--confirm-stopped','--note','test fencing')
        self.git(self.a,'commit','--allow-empty','-m','stale',ok=False)

    def test_parallel_local_claims_keep_updates(self):
        processes=[subprocess.Popen([sys.executable,'tools/taskctl.py','claim',task,'--actor','parallel'],cwd=self.a,env=self.env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True) for task in ('A','B','PLAN')]
        for process in processes:
            out,err=process.communicate(timeout=40)
            self.assertEqual(process.returncode,0,err)
        self.assertTrue(all(s['status']=='claimed' for s in self.state()['tasks'].values()))

    def test_inline_and_extra_paths_are_one_claim(self):
        definition={'id':'NEW','title':'Follow up','priority':'P1','kind':'module','hard_dependencies':[],'connect_after':[],'write_paths':['src/new/']}
        path=self.root/'definition.json';path.write_text(json.dumps(definition))
        receipt=self.root/'receipt.json'
        self.ctl(self.a,'claim','NEW','--actor','test','--definition',str(path),'--path','docs/new/','--receipt',str(receipt))
        board=self.state()
        self.assertEqual(board['revision'],1)
        self.assertEqual(board['tasks']['NEW']['paths'],['src/new/','docs/new/'])
        self.assertEqual(json.loads(receipt.read_text())['token'],board['tasks']['NEW']['token'])
        updated=sync_graph.migrate(board,self.graph)
        self.assertEqual(updated['tasks']['NEW'],board['tasks']['NEW'])
        self.assertIn('NEW',updated['inline_tasks'])
        promoted=json.loads(json.dumps(board['graph']))
        promoted['tasks'][-1]['body_file']='issues/NEW.md'
        published=sync_graph.migrate(board,promoted)
        self.assertNotIn('NEW',published['inline_tasks'])
        self.assertEqual(published['tasks']['NEW'],board['tasks']['NEW'])
        self.ctl(self.b,'claim','NEW','--definition',str(path),ok=False)
        self.ctl(self.a,'release','NEW','--token',board['tasks']['NEW']['token'],'--note','retry interrupted start')
        self.ctl(self.a,'claim','NEW','--actor','test','--definition',str(path))
        self.assertEqual(sum(t['id']=='NEW' for t in self.state()['graph']['tasks']),1)

    def test_incomplete_inline_definition_cannot_change_board(self):
        definition={'id':'NEW','title':'Follow up','priority':'P1','kind':'pool','hard_dependencies':[],'write_paths':['src/new/']}
        before=self.state()
        path=self.root/'incomplete.json'
        for field in ('priority','kind','title','hard_dependencies','write_paths'):
            incomplete=dict(definition);del incomplete[field]
            path.write_text(json.dumps(incomplete))
            self.ctl(self.a,'claim','NEW','--definition',str(path),ok=False)
            self.assertEqual(self.state(),before)
        self.ctl(self.a,'ready','--all','--json')

    def interrupted(self,dirty=False):
        self.env['PYTHONDONTWRITEBYTECODE']='1'
        state=self.claim(self.a,'A');dest=self.root/'interrupted'
        self.git(self.a,'worktree','add',str(dest),'-b','task/A',state['base_commit'])
        if dirty:(dest/'valuable.txt').write_text('keep me')
        directory=self.a/'.local/claims';directory.mkdir(parents=True,exist_ok=True)
        (directory/'A.start-claim.json').write_text(json.dumps(state))
        (directory/'A.start.json').write_text(json.dumps({'destination':str(dest),'branch':'task/A','starting':True}))
        return state,dest,directory

    def test_interrupted_pristine_start_repairs_on_retry(self):
        state,dest,directory=self.interrupted()
        self.run_cmd(self.a,sys.executable,'tools/task_worktree.py','create','A',str(dest),'--actor','helper')
        self.assertEqual(self.state()['tasks']['A']['generation'],3)
        self.assertFalse((directory/'A.start.json').exists())

    def test_dirty_interrupted_checkout_is_preserved(self):
        state,dest,directory=self.interrupted(dirty=True)
        self.run_cmd(self.a,sys.executable,'tools/task_worktree.py','create','A',str(dest),'--actor','helper',ok=False)
        self.assertEqual((dest/'valuable.txt').read_text(),'keep me')
        self.assertEqual(self.state()['tasks']['A']['token'],state['token'])

    def test_complete_requires_merge_and_releases_in_one_update(self):
        state=self.claim(self.a,'A')
        self.git(self.a,'checkout','-b','task/A',state['base_commit'])
        path=self.a/'src/A/result.txt';path.parent.mkdir(parents=True);path.write_text('result')
        self.git(self.a,'add',str(path));self.git(self.a,'commit','-m','result')
        self.ctl(self.a,'complete','A','--token',state['token'],'--commit','HEAD','--evidence','test',ok=False)
        self.assertEqual(self.state()['tasks']['A']['status'],'claimed')
        # Simulate the hosting service merging an approved PR into the bare remote.
        self.git(self.a,'push','origin','task/A')
        commit=self.git(self.a,'rev-parse','HEAD').stdout.strip()
        self.git(self.remote,'update-ref','refs/heads/main',commit)
        revision=self.state()['revision']
        receipts=self.a/'.local/claims';receipts.mkdir(parents=True,exist_ok=True)
        stale=dict(state,token='stale-primary-token')
        (receipts/'A.json').write_text(json.dumps(stale))
        staging=self.root/'old staging'
        self.git(self.a,'worktree','add','--detach',str(staging),commit)
        saved=staging/'.local/claims';saved.mkdir(parents=True)
        (saved/'A.json').write_text(json.dumps(state))
        self.run_cmd(self.a,sys.executable,'tools/task_worktree.py','finish','--evidence','test')
        board=self.state()
        self.assertEqual(board['revision'],revision+1)
        self.assertEqual(board['tasks']['A']['status'],'done')
        self.assertEqual(board['tasks']['A']['paths'],[])
        self.run_cmd(self.a,sys.executable,'tools/task_worktree.py','finish','--evidence','retry')
        self.assertEqual(self.state()['revision'],revision+1)

    def test_killed_local_writer_does_not_leave_a_lock(self):
        code="import sys,time;sys.path.insert(0,'tools');import taskctl as t\nwith t.local_lock('writer'):\n print('locked',flush=True);time.sleep(60)"
        process=subprocess.Popen([sys.executable,'-c',code],cwd=self.a,env=self.env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
        try:
            self.assertEqual(process.stdout.readline().strip(),'locked')
        finally:
            process.kill();process.communicate(timeout=5)
        self.claim(self.a,'A')

    def test_lost_push_acknowledgment_is_confirmed_from_remote(self):
        code="""import sys
sys.path.insert(0,'tools')
import taskctl as t
old,board=t.read_board('origin')
board['revision']+=1
original=t.subprocess.run
def lose_ack(command,*args,**kwargs):
 result=original(command,*args,**kwargs)
 if command[:2]==['git','push'] and result.returncode==0:
  result.returncode=1;result.stderr='transport acknowledgment lost'
 return result
t.subprocess.run=lose_ack
assert t.push_board('origin',old,board,'accepted despite lost acknowledgment')
"""
        self.run_cmd(self.a,sys.executable,'-c',code)
        self.assertEqual(self.state()['revision'],1)

    def test_new_issue_start_checks_owner_and_creates_linked_worktree(self):
        from test_rehearsal_owner import OwnerIntegration
        test=OwnerIntegration();test.setUp()
        try:
            issues=json.loads(test.issues.read_text())
            issues['5']={'number':5,'state':'open','title':'[koshiro] Follow up','body':'<!-- task-id: NEW -->','labels':[{'name':'task'}]}
            test.issues.write_text(json.dumps(issues))
            definition={'id':'NEW','issue_number':5,'title':'Follow up','priority':'P1','kind':'pool','hard_dependencies':[],'connect_after':[],'write_paths':['src/new/']}
            path=test.root/'new.json';path.write_text(json.dumps(definition))
            dest=test.root/'new-work'
            command=[sys.executable,'tools/task_worktree.py','create','NEW',str(dest),'--definition',str(path),'--slug','follow-up']
            test.run_cmd(test.a,*command,ok=False)
            self.assertNotIn('NEW',test.state()['tasks'])
            issues['5']['title']='[rozwer] Follow up';test.issues.write_text(json.dumps(issues))
            test.run_cmd(test.a,*command)
            self.assertEqual(test.git(dest,'branch','--show-current').stdout.strip(),'rozwer/5-follow-up')
            self.assertEqual(test.state()['tasks']['NEW']['status'],'claimed')
        finally:test.doCleanups()

class ReceiptLookup(unittest.TestCase):
    def test_explicit_receipt_requires_current_token(self):
        import tempfile
        from pathlib import Path
        import task_worktree as work
        import taskctl as tc
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'receipt.json'
            path.write_text(json.dumps({'token':'old'}))
            with self.assertRaises(tc.BoardError):work.find_receipt('A',{'token':'current'},str(path))
            path.write_text(json.dumps({'token':'current'}))
            self.assertEqual(work.find_receipt('A',{'token':'current'},str(path))[0],path.resolve())
            with self.assertRaises(tc.BoardError):work.find_receipt('A',{'token':None},str(path))

# Do not discover imported fixture test cases a second time.
del Fixture
if __name__=='__main__':unittest.main()
