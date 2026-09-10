#!/usr/bin/env python3
"""Dry-run by default. Creates unassigned GitHub Issues only with explicit --apply.
Requires authenticated `gh`, but never sends tokens or asks for them in files.
"""
from pathlib import Path
import argparse,csv,json,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
def main():
 p=argparse.ArgumentParser();p.add_argument('--repo',required=True,help='owner/repo');p.add_argument('--apply',action='store_true');p.add_argument('--only',nargs='*',help='Task IDs');a=p.parse_args()
 if '/' not in a.repo or a.repo.startswith('-'):p.error('repo must be owner/repo')
 rows=list(csv.DictReader((ROOT/'ISSUE_BACKLOG.csv').open(encoding='utf-8-sig')))
 if a.only:
  unknown=set(a.only)-{r['id'] for r in rows}
  if unknown:p.error('Unknown IDs: '+', '.join(sorted(unknown)))
  rows=[r for r in rows if r['id'] in a.only]
 log=ROOT/'evidence/issue-import.json';past=json.loads(log.read_text()) if log.exists() else {}
 if a.apply:
  probe=subprocess.run(['gh','issue','list','--repo',a.repo,'--state','all','--limit','1000','--json','title,url'],capture_output=True,text=True)
  if probe.returncode:raise RuntimeError(probe.stderr)
  existing={r['title']:r['url'] for r in json.loads(probe.stdout)}
 else:existing={}
 for r in rows:
  title='['+r['id']+'] '+r['title'];key=a.repo+':'+r['id']
  command=['gh','issue','create','--repo',a.repo,'--title',title,'--body-file',str(ROOT/r['body_file'])]
  if not a.apply:print(json.dumps({'id':r['id'],'assignee':None,'dry_run':True,'command':command},ensure_ascii=False));continue
  if key in past or title in existing:
   print('SKIP',r['id'],'already imported');continue
  result=subprocess.run(command,capture_output=True,text=True)
  if result.returncode:raise RuntimeError(result.stderr)
  past[key]={'url':result.stdout.strip(),'title':title};log.parent.mkdir(exist_ok=True);log.write_text(json.dumps(past,ensure_ascii=False,indent=2)+'\n');print('CREATED',r['id'],result.stdout.strip())
 return 0
if __name__=='__main__':
 try:sys.exit(main())
 except (RuntimeError,OSError) as e:print(str(e),file=sys.stderr);sys.exit(1)
