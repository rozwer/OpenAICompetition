"""Enable GitHub main protection only after every preparation task is done."""
import json,subprocess,sys
import taskctl as tc
import owner_policy as op

def protect(board):
    pending=op.pending_preparation(board)
    if pending:raise tc.BoardError('Main protection deferred; unfinished preparation: '+', '.join(pending))
    policy=op.policy_for(board)
    if not policy:raise tc.BoardError('Owner/Issue policy is not published')
    endpoint='repos/'+policy['repository']+'/branches/main/protection'
    current=subprocess.run(['gh','api',endpoint],capture_output=True,text=True,encoding='utf-8')
    data=json.loads(current.stdout or '{}')
    if current.returncode==0:
        reviews=data.get('required_pull_request_reviews') or {}
        if reviews.get('required_approving_review_count',0)>=1 and data.get('enforce_admins',{}).get('enabled') and not data.get('allow_force_pushes',{}).get('enabled') and not data.get('allow_deletions',{}).get('enabled'):
            return {'main_protected':True,'changed':False}
        raise tc.BoardError('Existing main protection needs administrator review; it was not overwritten')
    if data.get('status') not in (404,'404'):raise tc.BoardError(current.stderr.strip() or 'Cannot read main protection')
    body={'required_status_checks':None,'enforce_admins':True,'required_pull_request_reviews':{'dismiss_stale_reviews':True,'require_code_owner_reviews':False,'required_approving_review_count':1},'restrictions':None,'allow_force_pushes':False,'allow_deletions':False}
    result=subprocess.run(['gh','api',endpoint,'--method','PUT','--input','-'],input=json.dumps(body),capture_output=True,text=True,encoding='utf-8')
    if result.returncode:raise tc.BoardError('Local main protection is active, but GitHub protection failed; no billing was changed: '+result.stderr.strip())
    return {'main_protected':True,'changed':True}

def main():
    _,board=tc.read_board('origin')
    if not board:raise tc.BoardError('Board missing')
    print(json.dumps(protect(board)))
if __name__=='__main__':
    try:main()
    except (tc.BoardError,OSError,ValueError) as error:print(str(error),file=sys.stderr);raise SystemExit(2)
