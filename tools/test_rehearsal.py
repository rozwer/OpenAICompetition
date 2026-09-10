import copy,unittest
from sync_graph import migrate,validate
from rehearsal_guard import allowed
from taskctl import BoardError

def task(id,deps=None):return {'id':id,'hard_dependencies':deps or [],'connect_after':[],'write_paths':['src/'+id+'/']}
def board():
    return {'revision':2,'graph':{'tasks':[task('A'),task('B')]},'tasks':{'A':{'status':'claimed','token':'keep','paths':['src/A/'],'generation':3},'B':{'status':'backlog','token':None,'paths':[],'generation':0}}}
class Checks(unittest.TestCase):
    def test_add_preserves_claim(self):
        b=board();g=copy.deepcopy(b['graph']);g['tasks'].append(task('C',['A']));n=migrate(b,g)
        self.assertEqual(n['tasks']['A'],b['tasks']['A']);self.assertEqual(n['tasks']['C']['status'],'backlog');self.assertNotIn('C',b['tasks'])
    def test_edit_backlog(self):
        b=board();g=copy.deepcopy(b['graph']);g['tasks'][1]['hard_dependencies']=['A'];self.assertEqual(migrate(b,g)['graph'],g)
    def test_edit_active_rejected(self):
        b=board();g=copy.deepcopy(b['graph']);g['tasks'][0]['write_paths']=['src/'];self.assertRaises(BoardError,migrate,b,g)
    def test_edit_submitted_rejected(self):
        b=board();b['tasks']['A']['status']='submitted';g=copy.deepcopy(b['graph']);g['tasks'][0]['hard_dependencies']=['B'];self.assertRaises(BoardError,migrate,b,g)
    def test_edit_done_rejected(self):
        b=board();b['tasks']['A']['status']='done';g=copy.deepcopy(b['graph']);g['tasks'][0]['title']='changed';self.assertRaises(BoardError,migrate,b,g)
    def test_delete_rejected(self):self.assertRaises(BoardError,migrate,board(),{'tasks':[task('A')]})
    def test_cycle(self):self.assertRaises(BoardError,validate,{'tasks':[task('A',['B']),task('B',['A'])]})
    def test_unknown(self):self.assertRaises(BoardError,validate,{'tasks':[task('A',['X'])]})
    def test_duplicate(self):self.assertRaises(BoardError,validate,{'tasks':[task('A'),task('A')]})
    def test_path(self):
        t=task('A');t['write_paths']=['../secret'];self.assertRaises(BoardError,validate,{'tasks':[t]})
    def test_owned(self):allowed(['src/A/file.ts'],['src/A/'])
    def test_sibling(self):self.assertRaises(BoardError,allowed,['src/AB/file.ts'],['src/A/'])
    def test_rename_source(self):self.assertRaises(BoardError,allowed,['src/A/file.ts','src/B/file.ts'],['src/A/'])
if __name__=='__main__':unittest.main()

class IssueSyncChecks(unittest.TestCase):
    def setUp(self):
        import tempfile
        from pathlib import Path
        import sync_issues
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.old=sync_issues.ROOT;sync_issues.ROOT=Path(self.tmp.name);self.addCleanup(setattr,sync_issues,'ROOT',self.old)
        (sync_issues.ROOT/'body.md').write_text('new body\n')
        self.tasks=[{'id':'PREP-001','title':'New title','body_file':'body.md'}]
    def test_create(self):
        from sync_issues import plan
        self.assertEqual(plan(self.tasks,[])[0]['action'],'create')
    def test_stable_id_edit(self):
        from sync_issues import plan
        result=plan(self.tasks,[{'number':7,'title':'[PREP-001] Old title','body':'old'}])[0]
        self.assertEqual(result['action'],'edit');self.assertEqual(result['number'],7)
    def test_unchanged(self):
        from sync_issues import plan
        self.assertEqual(plan(self.tasks,[{'number':7,'title':'[PREP-001] New title','body':'new body'}])[0]['action'],'edit')
    def test_duplicates(self):
        from sync_issues import plan
        self.assertRaises(ValueError,plan,self.tasks,[{'number':n,'title':'[PREP-001] old','body':''} for n in [1,2]])

    def test_legacy_future_id_is_not_recreated(self):
        from sync_issues import plan
        tasks=[dict(self.tasks[0],id='FUT04')]
        result=plan(tasks,[{'number':90,'title':'[FUT04] New title','body':'new body'}])[0]
        self.assertEqual(result['action'],'edit');self.assertEqual(result['number'],90)
