"""Complete an old linked checkout using the current primary checkout helper."""
import json
import sys
import unittest
from test_rehearsal_owner import OwnerIntegration


class LandMigration(unittest.TestCase):
    fixture_type = OwnerIntegration

    def setUp(self):
        self.fixture = self.fixture_type()
        self.fixture.setUp()
        self.addCleanup(self.fixture.doCleanups)

    def submitted(self, merge=True):
        f = self.fixture
        wt, state = f.create_owned()
        path = wt / 'src/A/result.txt'
        path.parent.mkdir(parents=True)
        path.write_text('accepted')
        f.git(wt, 'add', 'src/A/result.txt')
        f.git(wt, 'commit', '-m', 'accepted result')
        f.ctl(wt, 'submit', 'A', '--token', state['token'], '--commit', 'HEAD', '--evidence', 'test')
        commit = f.git(wt, 'rev-parse', 'HEAD').stdout.strip()
        f.git(wt, 'push', 'origin', 'rozwer/1-feature-a')
        if merge:
            f.git(f.remote, 'update-ref', 'refs/heads/develop', commit)
        issues = json.loads(f.issues.read_text())
        issues['1']['state'] = 'closed'
        f.issues.write_text(json.dumps(issues))
        # Simulate a pre-migration helper. It must never be executed or rewritten.
        old = 'raise SystemExit("old helper has no land command")\n'
        (wt / 'tools/task_worktree.py').write_text(old)
        return wt, old

    def complete(self, wt, *args, ok=True):
        f = self.fixture
        return f.run_cmd(f.a, sys.executable, 'tools/task_worktree.py', 'land',
                         '--worktree', str(wt), *args, ok=ok)

    def test_closed_issue_uses_new_helper_without_changing_old_checkout(self):
        wt, old = self.submitted()
        result = json.loads(self.complete(wt).stdout)
        self.assertEqual(result['status'], 'done')
        self.assertEqual(result['paths'], [])
        self.assertIsNone(result['token'])
        self.assertEqual((wt / 'tools/task_worktree.py').read_text(), old)
        before = self.fixture.state()
        self.complete(wt, ok=False)
        self.assertEqual(self.fixture.state(), before)

    def test_unmerged_commit_stays_submitted(self):
        wt, _ = self.submitted(merge=False)
        before = self.fixture.state()
        self.complete(wt, ok=False)
        self.assertEqual(self.fixture.state(), before)

    def test_finish_from_primary_is_idempotent_for_closed_old_worktree(self):
        wt, old = self.submitted()
        f = self.fixture
        gh = f.root / 'bin/gh'
        source = gh.read_text()
        gh.write_text(source.replace('import json,os,sys\n',
            'import json,os,sys\nif sys.argv[1:3] == ["issue", "close"]: sys.exit(0)\n'))
        command = [sys.executable, 'tools/task_worktree.py', 'finish',
                   '--worktree', str(wt), '--evidence', 'migration acceptance']
        result = json.loads(f.run_cmd(f.a, *command).stdout)
        self.assertEqual(result['status'], 'done')
        before = f.state()
        f.run_cmd(f.a, *command)
        self.assertEqual(f.state(), before)
        self.assertEqual((wt / 'tools/task_worktree.py').read_text(), old)

    def test_wrong_owner_and_receipt_do_not_mutate_board(self):
        wt, _ = self.submitted()
        f = self.fixture
        before = f.state()
        bad = f.root / 'bad-receipt.json'
        bad.write_text(json.dumps({'token': 'not-the-owner-token'}))
        self.complete(wt, '--receipt', str(bad), ok=False)
        f.env['CODEX_OWNER'] = 'koshiro'
        self.complete(wt, ok=False)
        self.assertEqual(f.state(), before)

    def test_other_clone_primary_and_subdirectory_are_rejected(self):
        wt, _ = self.submitted()
        before = self.fixture.state()
        for target in (self.fixture.b, self.fixture.a, wt / 'tools'):
            with self.subTest(target=target):
                self.complete(target, ok=False)
                self.assertEqual(self.fixture.state(), before)


# The imported fixture has its own test discovery entry point.
del OwnerIntegration
if __name__ == '__main__':
    unittest.main()
