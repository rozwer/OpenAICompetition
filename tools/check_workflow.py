"""Run environment and collaboration checks without accessing the real remote."""
from pathlib import Path
import ast
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))

def run(*args):
    subprocess.run(args, cwd=ROOT, check=True)

run(sys.executable, '-X', 'utf8', 'tools/install_hooks.py', '--check')
for path in (ROOT / 'tools').glob('*.py'):
    ast.parse(path.read_text(encoding='utf-8'), filename=str(path))
for path in (ROOT / 'scripts').glob('*.mjs'):
    run('node', '--check', str(path))
names = ['test_hooks_install', 'test_rehearsal', 'test_rehearsal_git',
         'test_rehearsal_owner', 'test_rehearsal_fast_board', 'test_rehearsal_land_migration',
         'test_task_manifest']
suite = unittest.defaultTestLoader.loadTestsFromNames(names)
if suite.countTestCases() == 0:
    raise SystemExit('No workflow tests collected')
result = unittest.TextTestRunner(verbosity=1).run(suite)
if not result.wasSuccessful():
    raise SystemExit(1)
run('node', '--test', 'scripts/codex-mise-hook.test.mjs', 'scripts/codex-subagent-model-hook.test.mjs', 'scripts/codex-task-hook.test.mjs')
print('Workflow checks passed; product behavior and Windows execution are separate checks.')
