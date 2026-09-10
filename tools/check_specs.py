#!/usr/bin/env python3
"""Validate specification and implementation-plan consistency; --write regenerates task pages."""
from pathlib import Path
import csv, hashlib, json, re, sqlite3, sys
ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / 'docs/production-plan/v2'
graph = json.loads((PLAN / 'TASK_GRAPH.json').read_text())
tasks = graph['tasks']
ids = {t['id'] for t in tasks}
assert len(ids) == len(tasks) == 28
rules = {r['id']: r for r in graph['recurrence_rules']}
requirements = list(csv.DictReader((ROOT / 'docs/requirements.csv').open()))
req_ids = {r['id'] for r in requirements}
assert len(req_ids) == len(requirements) == 181
assert {r for t in tasks for r in t['requirement_ids']} == req_ids
operations = json.loads((ROOT / 'contracts/openapi.json').read_text())
op_ids = {op['operationId'] for path in operations['paths'].values() for op in path.values() if isinstance(op, dict) and 'operationId' in op}
owners = {}
for t in tasks:
    assert set(t['hard_dependencies'] + t['connect_after']) <= ids
    assert set(t['operation_ids'] + t['consumes_operation_ids']) <= op_ids
    for op in t['operation_ids']:
        assert op not in owners, (op, owners.get(op), t['id'])
        owners[op] = t['id']
    for ref in t['read_set']:
        assert (ROOT / ref['path']).is_file(), ref['path']
    assert t['specific_acceptance'] and t['internal_checklist']
    assert set(t['recurrence_ids']) <= set(rules)
    expected = {r['id'] for r in requirements if t['id'] in r['production_task_ids'].split(';')}
    assert set(t['requirement_ids']) == expected
visited, active = set(), set()
def visit(task_id):
    assert task_id not in active, ('dependency cycle', task_id)
    if task_id in visited: return
    active.add(task_id)
    for dep in next(t for t in tasks if t['id'] == task_id)['hard_dependencies']: visit(dep)
    active.remove(task_id)
    visited.add(task_id)
for task_id in ids: visit(task_id)
def bullets(values): return '\n'.join('- ' + v for v in values) or 'なし'
index = ['# 当日に実装する28単位', '', '全件を未着手として開始する。内部の旧IDは作業内容の対応用であり、別の取得単位にしない。', '', '| Task | 完成結果 | 着手依存 |', '|---|---|---|']
generated = {}
for t in tasks:
    index.append(f"| [{t['id']}](issues/{t['id']}.md) | {t['outcome']} | {', '.join(t['hard_dependencies']) or 'なし'} |")
    text = [f"# {t['id']}：{t['title']}", '', '[共通受入](../common-acceptance.md)を適用する。完了は当日の操作・保存・再表示で判定する。', '', '## 操作と結果', '', t['journey'], '', '## 依存と担当範囲', '', '着手依存：' + ', '.join(t['hard_dependencies']), '接続時の依存：' + ', '.join(t['connect_after']), '必要provider：' + ', '.join(t['required_providers']), '実AI受入：' + str(t['requires_live_ai']), '', '編集予定パス（当日作成する）：', '', bullets('`'+p+'`' for p in t['write_paths']), '', '## 読む契約', '']
    text += ['- `'+x['path']+'`'+('：'+', '.join(x['symbols']) if x['symbols'] else '') for x in t['read_set']]
    text += ['', '実装するoperation：' + ', '.join(t['operation_ids']), '利用するoperation：' + ', '.join(t['consumes_operation_ids']), '対応要件：' + ', '.join(t['requirement_ids']), '', '## 固有の受入条件', '', bullets(t['specific_acceptance']), '', '## 同じ担当が実装・接続する内容', '']
    for c in t['internal_checklist']:
        text += ['- '+c['source_task_id']+'：'+c['outcome']]
        text += ['  - '+a for a in c.get('acceptance', []) if a not in t['specific_acceptance']]
    text += ['', '## 該当する再発防止', '']
    for rule_id in t['recurrence_ids']:
        r = rules[rule_id]
        text += ['- '+rule_id+'：'+r['rule'], '  - 拒否例：'+r['negative_acceptance']]
    generated[PLAN / t['body_file']] = '\n'.join(text)+'\n'
generated[PLAN / 'ISSUE_INDEX.md'] = '\n'.join(index)+'\n'
for p, text in generated.items():
    if '--write' in sys.argv:
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text)
    else:
        assert p.read_text() == text, ('regenerate with --write', str(p))
for p in ROOT.rglob('*.md'):
    if '.git' in p.parts or 'node_modules' in p.parts: continue
    for target in re.findall(r'\]\(([^)]+)\)', p.read_text()):
        target = target.split('#')[0]
        if target and '://' not in target and not target.startswith('mailto:'):
            assert (p.parent / target).exists(), (str(p), target)
for item in json.loads((ROOT / 'docs/ui/manifest.json').read_text()):
    data = (ROOT / 'docs/ui' / item['file']).read_bytes()
    assert hashlib.sha256(data).hexdigest() == item['sha256']
with sqlite3.connect(':memory:') as db:
    db.executescript((ROOT / 'db/schema.sql').read_text())
print('PASS: 181 requirements, 28 tasks, dependency DAG, API ownership, read sets, generated pages, links, UI hashes, SQL schema')
