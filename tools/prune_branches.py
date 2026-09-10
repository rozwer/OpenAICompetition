"""Review and remove merged non-main branches while retaining all worktree files."""
import argparse,json,subprocess
from pathlib import Path
import taskctl as tc

def main():
 p=argparse.ArgumentParser();p.add_argument('--remote',default='origin');p.add_argument('--apply',action='store_true');a=p.parse_args()
 if tc.board_ref(a.remote)!=tc.REF:raise tc.BoardError('Migrate the board ref before deleting branches')
 _,board=tc.read_board(a.remote)
 if not board or any(s['status'] in ('claimed','submitted') for s in board['tasks'].values()):raise tc.BoardError('Active tasks or missing board; do not prune')
 tc.git('fetch',a.remote,'main');main_oid=tc.git('rev-parse',a.remote+'/main')
 remote={ref:oid for oid,ref in (line.split() for line in tc.git('ls-remote','--heads',a.remote).splitlines()) if ref not in ('refs/heads/main','refs/heads/develop')}
 local={ref:oid for ref,oid in (line.split() for line in tc.git('for-each-ref','--format=%(refname) %(objectname)','refs/heads/').splitlines()) if ref not in ('refs/heads/main','refs/heads/develop')}
 if tc.git('rev-parse','refs/heads/main')!=main_oid:raise tc.BoardError('Update local main before pruning')
 for ref,oid in {**remote,**local}.items():
  # Fetch each remote tip without creating another branch.
  if ref in remote:tc.git('fetch','--no-tags',a.remote,ref)
  if subprocess.run(['git','merge-base','--is-ancestor',oid,main_oid],capture_output=True).returncode:raise tc.BoardError('Unmerged branch: '+ref+'; preserve/integrate it first')
 # Check local and remote separately if the same branch name has different tips.
 for ref,oid in remote.items():
  if subprocess.run(['git','merge-base','--is-ancestor',oid,main_oid],capture_output=True).returncode:raise tc.BoardError('Unmerged remote branch: '+ref)
 plan={'remote':a.remote,'main':main_oid,'remoteBranches':remote,'localBranches':local}
 print(json.dumps(plan,indent=2),flush=True)
 if not a.apply:return
 common=Path(tc.git('rev-parse','--git-common-dir')).resolve();receipt=common/'taskctl/prune-plan.json';receipt.parent.mkdir(parents=True,exist_ok=True)
 if receipt.exists():raise tc.BoardError('A prune receipt already exists; inspect prior operation')
 receipt.write_text(json.dumps(plan)+'\n')
 try:
  if remote:
   subprocess.run(['git','push','--atomic',*[f'--force-with-lease={ref}:{oid}' for ref,oid in remote.items()],a.remote,*[':'+ref for ref in remote]],check=True)
  for block in tc.git('worktree','list','--porcelain').split('\n\n'):
   fields=dict(line.split(' ',1) for line in block.splitlines() if ' ' in line)
   if fields.get('branch') in local:
    # Same commit; no checkout of main over another person's files.
    tc.git('-C',fields['worktree'],'checkout','--detach',fields['HEAD'])
  for ref in local:tc.git('branch','-d',ref.removeprefix('refs/heads/'))
  tc.git('fetch','--prune',a.remote)
 finally:receipt.unlink(missing_ok=True)
 print('Merged non-main branches removed; worktrees retained detached')
if __name__=='__main__':
 try:main()
 except (tc.BoardError,subprocess.CalledProcessError) as e:raise SystemExit(str(e))
