"""Load the authored plan directly; never create a second editable task graph."""
from pathlib import Path
import json,re

# Convert the current plan's human-readable scope labels to concrete lock paths.
SCOPE_PATHS = {
    'package.json・lock・mise.toml': ['package.json','bun.lock','mise.toml','tsconfig.json','.env.example','.gitignore'],
    '起動・型生成・登録検査用スクリプト': ['tools/','scripts/','.codex/','.githooks/'],
    'src/styles/tokens.*': ['src/styles/'],
}

def graph_path(root):
    root=Path(root)
    candidates=[root/'docs/implementation-issues/index.json',
                root/'docs/production-plan/v2/TASK_GRAPH.json',root/'TASK_GRAPH.json']
    return next((p for p in candidates if p.is_file()), candidates[0])

def load_graph(root, manifest=None, content=None):
    root=Path(root).resolve()
    path=Path(manifest).resolve() if manifest else graph_path(root)
    data=json.loads(path.read_text(encoding='utf-8')) if content is None else content
    if isinstance(data,dict):return data
    tasks=[]
    for entry in data:
        paths=[]
        for scope in entry['paths']:
            if scope in SCOPE_PATHS:paths.extend(SCOPE_PATHS[scope])
            elif re.fullmatch(r'[A-Za-z0-9_./-]+',scope):paths.append(scope)
            else:raise ValueError('Define concrete lock paths for: '+scope)
        tasks.append({
            'id':entry['id'],'title':entry['title'],
            'kind':'preparation' if entry['id']=='001' else 'module',
            'priority':'P2' if entry['kind'].startswith('後続') else 'P0',
            'write_paths':paths,'hard_dependencies':entry['start_after'],
            'connect_after':entry['connect'],'requirement_ids':entry['requirements'],
            'operation_ids':entry['operations'],'acceptance':entry['checks'],
            'deliverable':entry['body'],
            'body_file':(path.parent/'issues'/f"{entry['id']}.md").relative_to(root).as_posix(),
        })
    return {'tasks':tasks}
