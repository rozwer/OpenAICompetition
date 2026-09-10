"""Resolve the current task graph without keeping a second working copy."""
from pathlib import Path

def graph_path(root):
    root = Path(root)
    current = root / 'docs/production-plan/v2/TASK_GRAPH.json'
    if current.is_file():
        return current
    legacy = root / 'TASK_GRAPH.json'
    if legacy.is_file():
        return legacy
    return current
