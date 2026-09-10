"""Validate and CAS-update the board graph without resetting execution state."""
import argparse,copy,json,sys
from pathlib import Path
import taskctl as tc
from document_paths import moves,relocate

from task_manifest import graph_path
def validate(graph):
    tasks=graph['tasks']; ids=[t['id'] for t in tasks]
    if len(ids)!=len(set(ids)): raise tc.BoardError('Duplicate task ID')
    by={t['id']:t for t in tasks}
    policy=graph.get('task_policy')
    if policy:
        numbers=policy['issue_numbers']
        if set(numbers)!=set(ids) or len(set(numbers.values()))!=len(numbers) or any(not isinstance(n,int) or n<1 for n in numbers.values()):raise tc.BoardError('Task/Issue mapping must be complete and unique')
        if policy['integration_branch']!='develop':raise tc.BoardError('Integrate tasks into develop')
    for t in tasks:
        for p in t['write_paths']: tc.normalized(p)
        for dep in t['hard_dependencies']+t.get('connect_after',[]):
            if dep not in by or dep==t['id']: raise tc.BoardError('Unknown/self dependency: '+dep)
    supersessions=graph.get('supersessions',{})
    if not isinstance(supersessions,dict):raise tc.BoardError('Supersessions must map stable IDs to successors')
    for old,successor in supersessions.items():
        if old not in by or successor not in by or old==successor or successor in supersessions:
            raise tc.BoardError('Invalid or chained successor: '+old)
        if old not in by[successor].get('source_task_ids',[]):raise tc.BoardError('Successor must retain source scope: '+old)
    for t in tasks:
        if not t.get('residual_unit'):continue
        for source in t['source_task_ids']:
            if supersessions.get(source)!=t['id']:raise tc.BoardError('Residual source ownership mismatch: '+source)
        required={req for source in t['source_task_ids'] for req in by[source]['requirement_ids']}
        if not required<=set(t['requirement_ids']):raise tc.BoardError('Residual unit drops requirements: '+t['id'])
        expected=[{'id':source,'issue':policy['issue_numbers'][source],
                   'deliverable':by[source]['deliverable'],'acceptance':by[source]['acceptance']} for source in t['source_task_ids']]
        if t['remaining_checklist']!=expected:raise tc.BoardError('Residual unit drops original acceptance: '+t['id'])
        if any(dep in supersessions for dep in t['hard_dependencies']+t.get('connect_after',[])):
            raise tc.BoardError('Residual unit still depends on retired source: '+t['id'])
    for number,target in graph.get('related_issue_transfers',{}).items():
        if not str(number).isdigit() or int(number)<1 or target not in by:
            raise tc.BoardError('Invalid related Issue transfer')
        if policy and int(number) in policy['issue_numbers'].values():
            raise tc.BoardError('Registered Task must use supersessions, not related Issue transfer')
        if int(number) not in [item['issue'] for item in by[target].get('additional_findings',[])]:
            raise tc.BoardError('Related finding acceptance missing')
    visiting=set();done=set()
    def visit(id):
        if id in visiting: raise tc.BoardError('Hard dependency cycle: '+id)
        if id in done:return
        visiting.add(id)
        for dep in by[id]['hard_dependencies']:visit(dep)
        visiting.remove(id);done.add(id)
    for id in by:visit(id)

def migrate(board,graph,document_moves=None):
    graph=copy.deepcopy(graph)
    published={t['id'] for t in graph['tasks']}
    retained=set(board.get('inline_tasks',[]))-published
    for task in board['graph']['tasks']:
        if task['id'] in retained:
            graph['tasks'].append(copy.deepcopy(task))
            if graph.get('task_policy'):
                graph['task_policy']['issue_numbers'][task['id']]=board['graph']['task_policy']['issue_numbers'][task['id']]
    validate(graph);new=copy.deepcopy(board)
    new['inline_tasks']=sorted(retained)
    previous={t['id']:t for t in board['graph']['tasks']};current={t['id']:t for t in graph['tasks']}
    if set(previous)-set(current): raise tc.BoardError('Keep stable IDs; retire/split with a successor instead of deletion')
    for id,t in current.items():
        if id not in previous:
            new['tasks'][id]={'status':'backlog','actor':None,'token':None,'generation':0,'paths':[],'note':None}
        elif board['tasks'][id]['status']!='backlog' and t!=previous[id] and (not document_moves or t!=relocate(previous[id],document_moves)) and not (id in board.get('inline_tasks',[]) and all(t.get(key)==value for key,value in previous[id].items())):
            raise tc.BoardError('Active/completed task definition changed: '+id+'; release active work or add a follow-up task')
    if any(graph.get('related_issue_transfers',{}).get(k)!=v for k,v in board['graph'].get('related_issue_transfers',{}).items()):
        raise tc.BoardError('Cannot remove or change a published related Issue transfer')
    old_mapping=board['graph'].get('supersessions',{})
    mapping=graph.get('supersessions',{})
    if any(mapping.get(source)!=target for source,target in old_mapping.items()):
        raise tc.BoardError('Cannot remove or change a published supersession')
    for source,successor in mapping.items():
        if source not in board['tasks']:raise tc.BoardError('Cannot retire a missing source')
        state=board['tasks'][source]
        if state['status']=='superseded' and state.get('superseded_by')==successor:
            continue
        if state['status']!='backlog' or state.get('paths') or state.get('token'):
            raise tc.BoardError('Only unclaimed backlog can be superseded: '+source)
        if previous[source]!=current[source]:raise tc.BoardError('Keep superseded source definition unchanged: '+source)
        new['tasks'][source].update(status='superseded',superseded_by=successor,
                                   superseded_at_revision=board['revision']+1)
    new['graph']=copy.deepcopy(graph);new['revision']+=1
    return new

def main():
    p=argparse.ArgumentParser();p.add_argument('--remote',default='origin');p.add_argument('--manifest',default=str(graph_path(Path.cwd())));p.add_argument('--apply',action='store_true');a=p.parse_args()
    graph=json.loads(Path(a.manifest).read_text());validate(graph)
    if a.apply:
        # Only a graph already shared on main can become the execution definition.
        source_branch='develop' if tc.git('ls-remote',a.remote,'refs/heads/develop') else 'main'
        tc.git('fetch',a.remote,source_branch)
        manifest_rel=Path(a.manifest).resolve().relative_to(Path(tc.git('rev-parse','--show-toplevel'))).as_posix()
        published=json.loads(tc.git('show',f'{a.remote}/{source_branch}:{manifest_rel}'))
        if graph!=published:raise tc.BoardError('Merge graph into the remote integration branch before applying board changes')
        if moves():
            published_moves=json.loads(tc.git('show',f'{a.remote}/{source_branch}:docs/team/document-paths.json'))
            if moves()!=published_moves:raise tc.BoardError('Publish exact document path migration on main first')
    with tc.local_lock('writer',a.remote):
        for _ in range(6):
            oid,board=tc.read_board(a.remote)
            if not board:raise tc.BoardError('Initialize board once before syncing')
            updated=migrate(board,graph,moves())
            if not a.apply:
                print(json.dumps({'dry_run':True,'tasks':len(graph['tasks']),'revision':board['revision']}));return
            if tc.push_board(a.remote,oid,updated,'taskctl sync graph'):
                print(json.dumps({'synced':True,'revision':updated['revision']}));return
        raise tc.BoardError('Concurrent update; nothing confirmed. Retry from current state')
if __name__=='__main__':
    try:main()
    except (tc.BoardError,ValueError,KeyError,OSError) as e:print(str(e),file=sys.stderr);sys.exit(2)
