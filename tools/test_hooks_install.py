"""Validate generated policy and clone/worktree-local OS hook installation."""
from pathlib import Path
import contextlib
import io
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

import install_hooks as hooks


class OsHooks(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='os-hooks 日本語 ')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'repo'
        self.root.mkdir()
        shutil.copytree(hooks.ROOT / '.codex', self.root / '.codex')
        shutil.copytree(hooks.ROOT / '.githooks', self.root / '.githooks')
        self.env = dict(os.environ, GIT_CONFIG_NOSYSTEM='1', GIT_CONFIG_GLOBAL=os.devnull,
                        GIT_AUTHOR_NAME='Test', GIT_AUTHOR_EMAIL='test@example.invalid',
                        GIT_COMMITTER_NAME='Test', GIT_COMMITTER_EMAIL='test@example.invalid')
        self.git('init', '--initial-branch=main')

    def git(self, *args, cwd=None):
        return subprocess.run(['git', *args], cwd=cwd or self.root, env=self.env,
                              text=True, encoding='utf-8', capture_output=True, check=True).stdout.strip()

    def test_generated_policy_matches_both_sources(self):
        hooks.install(hooks.ROOT, check=True)
        generated = json.loads(hooks.compose(self.root))
        for osname, command_key in [('macos', 'command'), ('windows', 'commandWindows')]:
            source = json.loads((self.root / f'.codex/hooks.{osname}.json').read_text(encoding='utf-8'))
            for event, groups in source['hooks'].items():
                for i, group in enumerate(groups):
                    for j, handler in enumerate(group['hooks']):
                        self.assertEqual(handler['command'], generated['hooks'][event][i]['hooks'][j][command_key])
        self.assertTrue(any('codex-task-hook.mjs' in h['commandWindows']
                            for group in generated['hooks']['PreToolUse'] for h in group['hooks']))

    def test_mismatched_policy_and_stale_output_rejected(self):
        (self.root / '.codex/hooks.json').write_text('{}', encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'stale'):
            hooks.install(self.root, check=True)
        p = self.root / '.codex/hooks.windows.json'
        config = json.loads(p.read_text(encoding='utf-8'))
        config['hooks']['PreToolUse'][0]['matcher'] = '^different$'
        p.write_text(json.dumps(config), encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'matchers differ'):
            hooks.compose(self.root)

    def test_install_is_repeatable_and_does_not_change_other_worktrees(self):
        self.git('add', '.')
        self.git('commit', '-m', 'Fixture')
        hooks.bootstrap(self.root)
        other = self.root.parent / 'other worktree'
        third = self.root.parent / 'third worktree'
        self.git('worktree', 'add', '-b', 'other', str(other))
        self.git('worktree', 'add', '-b', 'third', str(third))
        common = Path(self.git('rev-parse', '--path-format=absolute', '--git-common-dir')) / 'config'
        shared_before = common.read_bytes()
        before = (self.root / '.codex/hooks.json').read_bytes()
        with contextlib.redirect_stdout(io.StringIO()):
            hooks.install(self.root)
            hooks.install(self.root)
            hooks.install(other)
            hooks.install(third)
        expected = '.githooks/windows' if os.name == 'nt' else '.githooks/macos'
        self.assertEqual(self.git('config', '--get', 'core.hooksPath'), expected)
        self.assertEqual(self.git('config', '--get', 'core.hooksPath', cwd=other), expected)
        self.assertEqual(self.git('config', '--get', 'core.hooksPath', cwd=third), expected)
        self.assertEqual(common.read_bytes(), shared_before)
        self.assertEqual((self.root / '.codex/hooks.json').read_bytes(), before)

    def test_foreign_hook_path_is_not_overwritten(self):
        hooks.bootstrap(self.root)
        self.git('config', '--worktree', 'core.hooksPath', 'custom-hooks')
        before = (self.root / '.codex/hooks.json').read_bytes()
        with self.assertRaisesRegex(ValueError, 'Existing core.hooksPath differs'):
            hooks.install(self.root)
        self.assertEqual(self.git('config', '--get', 'core.hooksPath'), 'custom-hooks')
        self.assertEqual((self.root / '.codex/hooks.json').read_bytes(), before)

    def test_foreign_shared_hook_path_is_not_hidden(self):
        hooks.bootstrap(self.root)
        self.git('config', '--local', 'core.hooksPath', 'custom-hooks')
        with self.assertRaisesRegex(ValueError, 'Existing core.hooksPath differs'):
            hooks.install(self.root)
        self.assertEqual(self.git('config', '--local', '--get', 'core.hooksPath'), 'custom-hooks')

    def test_install_requires_explicit_shared_bootstrap(self):
        common = self.root / '.git/config'
        before = common.read_bytes()
        with self.assertRaisesRegex(ValueError, 'hooks:bootstrap'):
            hooks.install(self.root)
        self.assertEqual(common.read_bytes(), before)

    def test_legacy_absolute_path_migrates_only_within_same_repository(self):
        hooks.validate_existing(self.root, str(self.root / '.githooks'), '.githooks/windows')
        with self.assertRaisesRegex(ValueError, 'Existing core.hooksPath differs'):
            hooks.validate_existing(self.root, str(self.root.parent / 'foreign/.githooks'), '.githooks/windows')


if __name__ == '__main__':
    unittest.main()
