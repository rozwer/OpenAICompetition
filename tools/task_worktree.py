"""Prepare or verify a Task-ID worktree with the current atomic board policy."""
from pathlib import Path
import argparse
import json
import os
import shlex
import shutil
import subprocess
import sys

import owner_policy as op
import taskctl as tc


def verify(cwd,local=False):
    old = Path.cwd()
    try:
        os.chdir(cwd)
        branch = tc.git('branch', '--show-current')
        _, board = tc.cached_board('origin') if local else tc.read_board('origin')
        if not board:
            raise tc.BoardError('Board missing')
        task = op.resolve_branch(board, branch,check_github=not local)
        state = board['tasks'].get(task)
        if op.policy_for(board):
            op.require_linked_worktree()
        if not state or state['status'] not in ('claimed', 'submitted'):
            raise tc.BoardError('No active claim for ' + branch)
        return {'task': task, 'actor': state['actor'], 'status': state['status'], 'paths': state['paths']}
    finally:
        os.chdir(old)


def run_checked(command, cwd, *, env=None):
    result = subprocess.run(command, cwd=cwd, env=env, text=True, encoding='utf-8',
                            errors='replace', capture_output=True)
    if result.returncode:
        detail = (result.stderr or result.stdout).strip()
        raise tc.BoardError(detail or 'Command failed: ' + ' '.join(map(str, command)))
    return result.stdout.strip()


def find_receipt(task, current, explicit=None):
    """Find the current token, including starts from a staging worktree."""
    if explicit:
        candidates=[Path(explicit).resolve()]
    else:
        candidates=[Path(line[9:])/'.local/claims'/(task+'.json')
                    for line in tc.git('worktree','list','--porcelain').splitlines()
                    if line.startswith('worktree ')]
    for path in candidates:
        try:
            state=json.loads(path.read_text(encoding='utf-8'))
        except (OSError,ValueError):
            continue
        if isinstance(state,dict) and current.get('token') and state.get('token')==current['token']:
            return path,state
    raise tc.BoardError('No saved receipt matches the current claim for '+task+
                        '; keep the claim and use --receipt with its original saved JSON')


def write_receipt(path, state, *, failure=None):
    local = dict(state)
    if failure:
        local['worktree_failure'] = failure
    tc.atomic_json(path,local)


def trust_destination(root, dest, base_commit):
    """Trust exactly the claimed base's mise.toml before a branch hook can run."""
    config = dest / 'mise.toml'
    dest.mkdir()
    try:
        result = subprocess.run(['git', 'show', base_commit + ':mise.toml'], cwd=root,
                                capture_output=True)
        if result.returncode:
            detail = (result.stderr or result.stdout).decode('utf-8', errors='replace').strip()
            raise tc.BoardError(detail or 'Claimed base has no mise.toml')
        config.write_bytes(result.stdout)
        override = os.environ.get('TASK_WORKTREE_MISE_BIN')
        mise = shlex.split(override) if override else [shutil.which('mise')]
        if not mise[0]:
            raise tc.BoardError('mise was not found; install it before creating a task worktree')
        run_checked([*mise, 'trust', str(config)], root)
    finally:
        if config.exists():
            config.unlink()
        try:
            dest.rmdir()
        except OSError:
            pass


def hook_directory(root):
    platform = 'windows' if os.name == 'nt' else 'macos'
    path = (root / '.githooks' / platform).resolve()
    for name in ('pre-commit', 'pre-push', 'reference-transaction'):
        if not (path / name).is_file():
            raise tc.BoardError('Missing branch guard hook: ' + str(path / name))
    return path


def release_failed(root, task, token, receipt, stage, error, dest, branch):
    reason = 'Worktree preparation failed during ' + stage + ': ' + str(error).splitlines()[0]
    cleanup_pristine(root,dest,branch,json.loads(receipt.read_text(encoding='utf-8')).get('base_commit'))
    result = subprocess.run(
        [sys.executable, '-X', 'utf8', str(root / 'tools/taskctl.py'), 'release', task,
         '--token', token, '--note', reason],
        cwd=root, text=True, encoding='utf-8', errors='replace', capture_output=True)
    if result.returncode:
        raise tc.BoardError(reason + '; automatic claim release also failed: ' +
                            (result.stderr or result.stdout).strip())
    released = json.loads(result.stdout)
    failure = {'stage': stage, 'reason': reason, 'destination_exists': dest.exists(),
               'branch_exists': bool(tc.git('show-ref', '--verify', 'refs/heads/' + branch,
                                            check=False))}
    write_receipt(receipt, released, failure=failure)
    raise tc.BoardError(reason + '; claim released. Inspect the receipt before retrying: ' + str(receipt))


def cleanup_pristine(root,dest,branch,base):
    """Only remove the exact untouched checkout created by this start attempt."""
    tip=tc.git('show-ref','--hash','--verify','refs/heads/'+branch,check=False)
    if not tip and base and dest.is_dir() and not dest.is_symlink():
        # A process can stop after temporarily materializing mise.toml but
        # before git creates the worktree. Match bytes before removing it.
        contents=list(dest.iterdir())
        if contents==[dest/'mise.toml'] and not contents[0].is_symlink():
            original=subprocess.run(['git','show',base+':mise.toml'],cwd=root,capture_output=True)
            if original.returncode==0 and contents[0].read_bytes()==original.stdout:
                contents[0].unlink();dest.rmdir()
        elif not contents:dest.rmdir()
    if not base or tip!=base:return
    if dest.exists():
        entries=tc.git('worktree','list','--porcelain').split('\n\n')
        if not any(e.startswith('worktree ') and Path(e.splitlines()[0][9:]).resolve()==dest.resolve() and 'branch refs/heads/'+branch in e.splitlines() for e in entries):return
        if tc.git('-C',str(dest),'status','--porcelain','--untracked-files=all','--ignored'):return
        tc.git('worktree','remove',str(dest))
    # compare-and-delete refuses a branch changed since the check above.
    tc.git('update-ref','-d','refs/heads/'+branch,base)

def repair_interrupted_start(root,task):
    journal=root/'.local/claims'/(task+'.start.json')
    receipt=root/'.local/claims'/(task+'.start-claim.json')
    if not journal.exists():return
    operation=json.loads(journal.read_text(encoding='utf-8'))
    _,board=tc.read_board('origin')
    current=board['tasks'].get(task,{})
    saved=json.loads(receipt.read_text(encoding='utf-8')) if receipt.exists() else {}
    if current.get('status') in ('claimed','submitted'):
        if current.get('token')!=saved.get('token') or current['status']!='claimed':
            raise tc.BoardError('Interrupted start does not own the current claim; preserving it')
        cleanup_pristine(root,Path(operation['destination']),operation['branch'],saved.get('base_commit'))
        if Path(operation['destination']).exists():
            raise tc.BoardError('Interrupted checkout contains files; preserved with its claim. Inspect before retrying')
        output=run_checked([sys.executable,'-X','utf8',str(root/'tools/taskctl.py'),'release',task,'--token',saved['token'],'--note','Automatically repair interrupted worktree start'],root)
        write_receipt(receipt,json.loads(output))
    journal.unlink()

def create_worktree(root, task, dest, branch, actor, paths=(), definition=None):
    receipts = root / '.local/claims'
    receipts.mkdir(parents=True, exist_ok=True)
    receipt = receipts / (task + '.json')
    journal=receipts/(task+'.start.json')
    candidate=receipts/(task+'.start-claim.json')
    candidate.unlink(missing_ok=True)
    tc.atomic_json(journal,{'destination':str(dest),'branch':branch,'starting':True})
    options=['--receipt',str(candidate)]
    for path in paths:options+=['--path',path]
    if definition:options+=['--definition',str(Path(definition).resolve())]
    result = subprocess.run(
        [sys.executable, '-X', 'utf8', str(root / 'tools/taskctl.py'), 'claim', task,
         '--actor', actor,*options],
        cwd=root, text=True, encoding='utf-8', errors='replace', capture_output=True)
    if result.returncode:
        raise tc.BoardError(result.stderr)
    state = json.loads(result.stdout)
    write_receipt(receipt, state)

    stage = 'mise trust'
    try:
        trust_destination(root, dest, state['base_commit'])
        stage = 'branch guard and git worktree add'
        hooks = hook_directory(root)
        tc.git('-c', 'core.hooksPath=' + str(hooks), 'worktree', 'add', str(dest), '-b',
               branch, state['base_commit'])
        stage = 'worktree hook installation'
        run_checked([sys.executable, '-X', 'utf8', str(dest / 'tools/install_hooks.py')], dest)
        stage = 'task verification'
        verified = verify_started_claim(dest, task, state)
    except (tc.BoardError, OSError, ValueError, subprocess.CalledProcessError) as error:
        release_failed(root, task, state['token'], receipt, stage, error, dest, branch)

    journal.unlink(missing_ok=True)
    return {'task': task, 'worktree': str(dest), 'branch': branch,
            'claimReceipt': str(receipt), 'trust': 'ok', 'hooks': 'installed',
            'guard': 'passed', 'verified': verified}


def verify_started_claim(dest, task, claimed):
    """Reuse this successful claim's snapshot only inside worktree creation.

    Ordinary verify, commit, push and finish still read the remote board.
    A local handoff during setup is detected before returning success.
    """
    import rehearsal_guard
    old = Path.cwd()
    try:
        os.chdir(dest)
        _, board = tc.cached_board('origin')
        current = board['tasks'].get(task, {})
        if (not claimed.get('token') or current.get('token') != claimed['token']
                or current.get('actor') != claimed['actor']
                or current.get('status') != 'claimed'):
            raise tc.BoardError('Claim changed during worktree setup')
        if tc.git('rev-parse', 'HEAD') != claimed['base_commit']:
            raise tc.BoardError('Worktree moved from the claimed base during setup')
        verified = verify(dest, local=True)
        rehearsal_guard.check_commit(board, 'HEAD', tc.git('branch', '--show-current'),
                                     staged=True, check_github=False)
        return verified
    finally:
        os.chdir(old)


def main():
    # Child hooks must not make an otherwise untouched checkout look edited.
    os.environ['PYTHONDONTWRITEBYTECODE']='1'
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest='mode', required=True)
    command = sub.add_parser('create')
    command.add_argument('task')
    command.add_argument('destination')
    command.add_argument('--actor')
    command.add_argument('--slug')
    command.add_argument('--path',action='append',default=[])
    command.add_argument('--definition')
    command=sub.add_parser('submit')
    command.add_argument('--evidence',required=True)
    command.add_argument('--receipt')
    command=sub.add_parser('land')
    command.add_argument('--receipt')
    command.add_argument('--worktree', help='Complete a linked worktree in this clone using this helper version')
    command=sub.add_parser('finish')
    command.add_argument('--evidence',required=True)
    command.add_argument('--receipt')
    command.add_argument('--worktree', help='Complete a linked worktree in this clone using this helper version')
    sub.add_parser('verify')
    sub.add_parser('verify-local')
    sub.add_parser('refresh')
    sub.add_parser('phase')
    command = sub.add_parser('exec')
    command.add_argument('destination')
    command.add_argument('command', nargs=argparse.REMAINDER)
    args = parser.parse_args()

    if args.mode in ('land', 'finish') and args.worktree:
        destination = Path(args.worktree).resolve()
        common = tc.git('rev-parse', '--path-format=absolute', '--git-common-dir')
        target_common = tc.git('-C', str(destination), 'rev-parse', '--path-format=absolute', '--git-common-dir')
        if Path(common).resolve() != Path(target_common).resolve():
            raise tc.BoardError('Completion worktree is a different repository')
        target_root = tc.git('-C', str(destination), 'rev-parse', '--show-toplevel')
        if Path(target_root).resolve() != destination:
            raise tc.BoardError('Use the linked worktree root for completion')
        os.chdir(destination)
        op.require_linked_worktree()

    if args.mode in ('submit','land','finish'):
        _,board=tc.read_board('origin')
        task=op.resolve_branch(board,tc.git('branch','--show-current'),check_github=args.mode=='submit')
        current=board['tasks'][task]
        if args.mode=='finish' and current['status']=='done' and current.get('submitted_commit')==tc.git('rev-parse','HEAD'):
            output=json.dumps(current)
        else:
            receipt,state=find_receipt(task,current,args.receipt)
            options=['--commit','HEAD','--evidence',args.evidence] if args.mode in ('submit','finish') else []
            command='complete' if args.mode=='finish' else args.mode
            output=run_checked([sys.executable,'-X','utf8',str(Path(__file__).resolve().with_name('taskctl.py')),command,task,'--token',state['token'],*options],Path.cwd())
            write_receipt(receipt,json.loads(output))
        if args.mode=='finish' and op.policy_for(board):
            policy=op.policy_for(board)
            run_checked(['gh','issue','close',str(policy['issue_numbers'][task]),'--repo',policy['repository']],Path.cwd())
        print(output)
        return

    if args.mode == 'phase':
        _, board = tc.read_board('origin')
        if not board:
            raise tc.BoardError('Board missing')
        pending = op.pending_preparation(board)
        print(json.dumps({'pending_preparation': pending, 'main_edit_allowed': bool(pending)}))
        return
    if args.mode == 'refresh':
        oid,board=tc.read_board('origin')
        if not board:raise tc.BoardError('Board missing')
        print(json.dumps({'revision':board['revision'],'refreshed':True}))
        return
    if args.mode in ('verify','verify-local'):
        print(json.dumps(verify(Path.cwd(),local=args.mode=='verify-local'), ensure_ascii=False, indent=2))
        return

    root = Path(tc.git('rev-parse', '--show-toplevel'))
    dest = Path(args.destination).resolve()
    if args.mode == 'exec':
        if not args.command:
            raise tc.BoardError('Provide a command after the worktree path')
        common = lambda path: tc.git('-C', str(path), 'rev-parse', '--path-format=absolute',
                                     '--git-common-dir')
        if common(root) != common(dest):
            raise tc.BoardError('Destination is a different repository')
        verify(dest)
        raise SystemExit(subprocess.run(args.command, cwd=dest).returncode)

    _, board = tc.read_board('origin')
    policy = op.policy_for(board) if board else None
    if args.definition:
        preview=json.loads(Path(args.definition).read_text(encoding='utf-8'))
        if not isinstance(preview,dict) or not isinstance(preview.get('id'),str):raise tc.BoardError('Definition needs a string Task ID')
        tc.register_inline(board,preview['id'],preview)
        args.task=preview['id']
        policy=op.policy_for(board)
    if policy and args.task.isdigit():
        args.task = next((task for task, number in policy['issue_numbers'].items()
                          if number == int(args.task)), args.task)
    if policy:
        if args.task not in policy['issue_numbers']:
            raise tc.BoardError('Unknown Task/Issue')
        branch = op.branch_name(op.owner_at(), policy['issue_numbers'][args.task],
                                args.slug or args.task.lower())
    else:
        branch = 'task/' + args.task
    with tc.local_lock('start-'+args.task,timeout=1):
        repair_interrupted_start(root,args.task)
        if dest.exists() or tc.git('show-ref', '--verify', 'refs/heads/' + branch, check=False):
            raise tc.BoardError('Destination or task branch exists; inspect it before claiming')
        result = create_worktree(root, args.task, dest, branch, args.actor or op.owner_at(),args.path,args.definition)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    try:
        main()
    except (tc.BoardError, OSError, ValueError) as error:
        raise SystemExit(str(error))
