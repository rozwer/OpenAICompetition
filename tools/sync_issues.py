"""Sync generated Issue title/body by stable Task ID; keep comments and assignees."""
import argparse,json,re,subprocess,sys
from pathlib import Path
from owner_policy import task_id,title_owner,issue_title
from task_manifest import graph_path, load_graph
ROOT=Path(__file__).resolve().parents[1]
def gh(*args):
 p=subprocess.run(['gh',*args],capture_output=True,text=True)
 if p.returncode:raise RuntimeError(p.stderr.strip())
 return p.stdout

def plan(tasks,existing):
 by={}
 for issue in existing:
  id=task_id(issue)
  if id:
   if id in by:raise ValueError('Duplicate GitHub Task ID: '+id)
   by[id]=issue
 result=[]
 for task in tasks:
  old=by.get(task['id']);title=issue_title(title_owner(old['title']) if old else None,task['title']);body=(ROOT/task['body_file']).read_text(encoding='utf-8')
  action='create' if old is None else ('unchanged' if old['title']==title and old.get('body','').rstrip()==body.rstrip() else 'edit')
  result.append({'id':task['id'],'action':action,'number':old['number'] if old else None,'title':title,'body_file':task['body_file']})
 return result

def main():
 p=argparse.ArgumentParser();p.add_argument('--repo',required=True);p.add_argument('--apply',action='store_true');p.add_argument('--only',nargs='+');a=p.parse_args()
 if not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+',a.repo):p.error('Use owner/repo')
 tasks=load_graph(ROOT)['tasks']
 if a.only:
  unknown=set(a.only)-{t['id'] for t in tasks}
  if unknown:p.error('Unknown Task IDs: '+', '.join(sorted(unknown)))
  tasks=[t for t in tasks if t['id'] in a.only]
 existing=json.loads(gh('issue','list','--repo',a.repo,'--state','all','--limit','1000','--json','number,title,body'))
 if len(existing)>=1000:raise RuntimeError('Issue listing limit reached; use pagination before continuing')
 operations=plan(tasks,existing)
 for op in operations:
  print(json.dumps(op,ensure_ascii=False),flush=True)
  if not a.apply:continue
  if op['action']=='unchanged':continue
  args=['issue',op['action']]
  if op['action']=='edit':args.append(str(op['number']))
  gh(*args,'--repo',a.repo,'--title',op['title'],'--body-file',str(ROOT/op['body_file']),'--add-label' if op['action']=='edit' else '--label','task')
if __name__=='__main__':
 try:main()
 except (ValueError,RuntimeError,OSError) as e:print(str(e),file=sys.stderr);sys.exit(2)
