"""Owner/Issue naming shared by acquisition, worktrees, hooks, and Issue sync."""
from pathlib import Path
import json,os,re,subprocess,shutil

from task_manifest import graph_path
OWNERS=('rozwer','mattsun','koshiro','kaiya')

def task_id(issue):
    found=set(re.findall(r'<!--\s*task-id:\s*([A-Z][A-Z0-9-]*)\s*-->',issue.get('body','')))
    header=re.search(r'^# \[([A-Z][A-Z0-9-]*)\]',issue.get('body',''),re.M)
    title=re.match(r'^\[([A-Z][A-Z0-9-]*)\]',issue.get('title',''))
    for match in (header,title):
        if match:found.add(match[1])
    if len(found)>1:raise ValueError('Conflicting Task IDs on Issue #'+str(issue.get('number')))
    return next(iter(found),None)

def title_owner(title):
    match=re.match(r'^\[([^]]+)\] ',title)
    return match[1] if match and match[1] in OWNERS else None

def issue_title(owner,title):
    if owner is not None and owner not in OWNERS:raise ValueError('Unknown CODEX_OWNER: '+owner)
    return '['+(owner or '未割当')+'] '+title

def owner_at():
    owner=os.environ.get('CODEX_OWNER')
    if not owner:
        result=subprocess.run(['git','worktree','list','--porcelain'],capture_output=True,text=True,encoding='utf-8')
        first=re.search(r'^worktree (.+)$',result.stdout,re.M)
        envfile=Path(first[1])/'.env' if first else Path('.env')
        if envfile.is_file():
            match=re.search(r'^CODEX_OWNER\s*=\s*[\"\']?([a-z]+)[\"\']?\s*$',envfile.read_text(encoding='utf-8'),re.M)
            if match:owner=match[1]
    if owner not in OWNERS:raise ValueError('Set CODEX_OWNER to rozwer / mattsun / koshiro / kaiya in the environment or primary worktree .env')
    return owner

def github_issue(policy,number):
    result=subprocess.run([shutil.which('gh') or 'gh','api','repos/'+policy['repository']+'/issues/'+str(number)],capture_output=True,text=True,encoding='utf-8')
    if result.returncode:raise ValueError('Cannot verify GitHub Issue #'+str(number)+': '+result.stderr.strip())
    return json.loads(result.stdout)

def verify_issue(policy,task,owner):
    number=policy['issue_numbers'][task]
    issue=github_issue(policy,number)
    labels={x if isinstance(x,str) else x['name'] for x in issue.get('labels',[])}
    if issue.get('number')!=number or 'pull_request' in issue or issue.get('state','').lower()!='open':raise ValueError('An open Task Issue is required')
    if 'task' not in labels or 'work' in labels:raise ValueError('Issue #'+str(number)+' must have task label and no work label')
    if task_id(issue)!=task:raise ValueError('Issue/Task ID mismatch: '+task)
    if title_owner(issue['title'])!=owner:raise ValueError('Issue #'+str(number)+' is not assigned to ['+owner+']; assign it before claiming')
    return issue

def branch_name(owner,number,slug):
    if owner not in OWNERS or not isinstance(number,int) or number<1 or not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',slug):raise ValueError('Use owner/Issue-number-lowercase-description')
    return f'{owner}/{number}-{slug}'

def resolve_branch(board,branch,check_github=True):
    policy=policy_for(board)
    if not policy:
        # Pre-migration boards only; never a second route on the current board.
        if not re.fullmatch(r'task/[A-Z][A-Z0-9-]*',branch):raise ValueError('Use a task/TASK-ID branch until policy migration')
        return branch[5:]
    match=re.fullmatch(r'(rozwer|mattsun|koshiro|kaiya)/([1-9][0-9]*)-([a-z0-9]+(?:-[a-z0-9]+)*)',branch)
    if not match:raise ValueError('Use owner/Issue-number-description, for example rozwer/1-app-foundation')
    owner,number=match[1],int(match[2])
    task=next((t for t,n in policy['issue_numbers'].items() if n==number),None)
    if not task:raise ValueError('Unknown Issue number: '+str(number))
    state=board['tasks'][task]
    if owner!=owner_at() or (state.get('owner') or (state.get('actor') if not board['graph'].get('task_policy') else None))!=owner:raise ValueError('CODEX_OWNER, branch owner, and claim owner must match')
    if check_github:verify_issue(policy,task,owner)
    return task

def policy_for(board):
    if board['graph'].get('task_policy'):return board['graph']['task_policy']
    # Bootstrap only: the checked-out policy is published before board migration.
    try:root=subprocess.check_output(['git','rev-parse','--show-toplevel'],stderr=subprocess.DEVNULL,text=True,encoding='utf-8').strip()
    except subprocess.CalledProcessError:return None
    path=graph_path(root)
    return json.loads(path.read_text(encoding='utf-8')).get('task_policy') if path.is_file() else None

def pending_preparation(board):
    return [t['id'] for t in board['graph']['tasks'] if t.get('kind')=='preparation' and board['tasks'][t['id']]['status']!='done']

def require_linked_worktree():
    def git_path(flag):
        return subprocess.check_output(['git','rev-parse','--path-format=absolute',flag],text=True,encoding='utf-8').strip()
    if git_path('--git-dir')==git_path('--git-common-dir'):raise ValueError('Implementation requires a dedicated linked worktree; keep the primary checkout on main/develop')
