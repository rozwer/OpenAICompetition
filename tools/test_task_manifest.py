import json
from pathlib import Path
import tempfile
import unittest
from task_manifest import graph_path, load_graph
from sync_graph import validate
import owner_policy

ROOT = Path(__file__).resolve().parents[1]

class TaskManifest(unittest.TestCase):
    def test_canonical_graph_is_valid_and_issue_bodies_are_resolvable(self):
        graph = load_graph(ROOT)
        validate(graph)
        self.assertGreater(len(graph['tasks']), 0)
        for task in graph['tasks']:
            self.assertIn(task['priority'], ['P0','P1','P2','P3'])
            body = (ROOT/task['body_file']).read_text(encoding='utf-8')
            self.assertEqual(owner_policy.task_id({'body':body, 'title':task['title']}), task['id'])

    def test_current_graph_precedes_legacy_and_missing_path_is_explicit(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            current=root/'docs/implementation-issues/index.json'
            self.assertEqual(graph_path(root), current)
            (root/'TASK_GRAPH.json').write_text('{}')
            self.assertEqual(graph_path(root), root/'TASK_GRAPH.json')
            current.parent.mkdir(parents=True)
            current.write_text('{}')
            self.assertEqual(graph_path(root), current)
