"""Atomically move the old board branch to its non-branch ref, preserving its commit."""
import argparse,subprocess,json
import taskctl as tc

def main():
 p=argparse.ArgumentParser();p.add_argument('--remote',default='origin');p.add_argument('--apply',action='store_true');a=p.parse_args()
 current=tc.board_ref(a.remote)
 if current==tc.REF:
  oid,board=tc.read_board(a.remote)
  if not board:raise tc.BoardError('No board exists; do not invent a migration')
  print(json.dumps({'already_migrated':True,'ref':tc.REF,'oid':oid}));return
 oid,board=tc.read_board(a.remote)
 if any(s['status'] in ('claimed','submitted') for s in board['tasks'].values()):raise tc.BoardError('Finish/release active tasks before board migration')
 print(json.dumps({'from':tc.LEGACY_REF,'to':tc.REF,'oid':oid,'revision':board['revision'],'apply':a.apply}),flush=True)
 if not a.apply:return
 subprocess.run(['git','push','--atomic',f'--force-with-lease={tc.REF}:',f'--force-with-lease={tc.LEGACY_REF}:{oid}',a.remote,f'{oid}:{tc.REF}',f':{tc.LEGACY_REF}'],check=True)
 after,state=tc.read_board(a.remote)
 if after!=oid or state!=board:raise tc.BoardError('Migration verification failed; inspect remote refs')
 print('Board ref migrated; task state and full commit history preserved')
if __name__=='__main__':
 try:main()
 except (tc.BoardError,subprocess.CalledProcessError) as e:raise SystemExit(str(e))
