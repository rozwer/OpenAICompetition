import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

export const owners = ['rozwer', 'mattsun', 'koshiro', 'kaiya'];
export const sharedBranches = ['main', 'develop'];
export function run(cmd, args, cwd, input) {
  return execFileSync(cmd, args, { cwd, input, encoding: 'utf8', timeout: 20000, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}
export function git(args, cwd) { return run('git', args, cwd); }
export function common(cwd) { return git(['rev-parse', '--path-format=absolute', '--git-common-dir'], cwd); }
export function ownerAt(cwd) {
  let owner = process.env.CODEX_OWNER;
  if (!owner) {
    const root = git(['worktree', 'list', '--porcelain'], cwd).match(/^worktree (.+)$/m)?.[1];
    if (root && existsSync(join(root, '.env'))) owner = readFileSync(join(root, '.env'), 'utf8').match(/^CODEX_OWNER\s*=\s*["']?([a-z]+)["']?\s*$/m)?.[1];
  }
  if (!owners.includes(owner)) throw new Error('CODEX_OWNER に rozwer / mattsun / koshiro / kaiya を設定してください。');
  return owner;
}
export function checkBranch(branch, owner) {
  if (!owners.includes(owner)) throw new Error('CODEX_OWNERが不正です。');
  const m = /^(rozwer|mattsun|koshiro|kaiya)\/([1-9][0-9]*)-([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(branch);
  if (!m || m[1] !== owner) throw new Error(`自分のTaskブランチ ${owner}/<Issue番号>-<説明> を使ってください。対象: ${branch || 'detached HEAD'}`);
  return Number(m[2]);
}
export function checkSharedBranch(branch) {
  if (!sharedBranches.includes(branch)) throw new Error(`共有ブランチは ${sharedBranches.join(' / ')} のみです。対象: ${branch || 'detached HEAD'}`);
  return branch;
}
export function isSharedBranch(branch) { return sharedBranches.includes(branch); }
export function currentBranch(cwd) {
  try { return git(['symbolic-ref', '--quiet', '--short', 'HEAD'], cwd); } catch { return ''; }
}
export function repository(cwd, remote = 'origin') {
  const url = git(['remote', 'get-url', remote], cwd);
  const m = /^(?:git@github\.com:|https:\/\/github\.com\/|ssh:\/\/git@github\.com\/)([\w.-]+\/[\w.-]+?)(?:\.git)?\/?$/.exec(url);
  if (!m) throw new Error('originにはGitHubリポジトリを設定してください。');
  return m[1];
}
export function api(cwd, endpoint, body) {
  try { return JSON.parse(run('gh', ['api', '--hostname', 'github.com', endpoint, ...(body ? ['--method', 'PATCH', '--input', '-'] : [])], cwd, body ? JSON.stringify(body) : undefined)); }
  catch { throw new Error(`GitHubで照合できません (${endpoint})。接続と gh auth status を確認して再試行してください。`); }
}
export function validateIssue(issue, number, owner, closed = false) {
  if (issue.number !== number || issue.pull_request) throw new Error(`#${number}はTask Issueではありません。`);
  const labels = issue.labels.map(x => typeof x === 'string' ? x : x.name);
  if (!labels.includes('task') || labels.includes('work')) throw new Error(`#${number}にはtaskラベルが必要です。Workから直接作業は開始しません。`);
  if (!closed && issue.state !== 'open') throw new Error(`#${number}はClosedです。新しいTaskを使ってください。`);
  if (!issue.title.startsWith(`[${owner}] `)) throw new Error(`#${number}は自分の名前ではありません。未割当なら mise run task:claim -- ${number} で取得してください。他人のTaskは取得できません。`);
}
function cachePath(cwd, branch, owner, repo) {
  const key = createHash('sha256').update(JSON.stringify([repo, branch, owner])).digest('hex');
  return join(common(cwd), 'task-policy', `${key}.json`);
}
export function verify(cwd, branch, owner, { local = false, closed = false } = {}) {
  const number = checkBranch(branch, owner), repo = repository(cwd);
  const path = cachePath(cwd, branch, owner, repo);
  if (local) {
    if (!existsSync(path)) throw new Error(`Task照合が未完了です。mise run task:verify -- ${branch} を実行してください。`);
    const record = JSON.parse(readFileSync(path, 'utf8'));
    validateIssue(record.issue, number, owner);
    return record.issue;
  }
  try {
    const issue = api(cwd, `repos/${repo}/issues/${number}`);
    validateIssue(issue, number, owner, closed);
    mkdirSync(join(common(cwd), 'task-policy'), { recursive: true });
    const tmp = `${path}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify({ issue, checkedAt: new Date().toISOString() }), { mode: 0o600 });
    renameSync(tmp, path);
    return issue;
  } catch (error) {
    // A known ownership/state mismatch must not leave an old editing permit behind.
    if (!error.message.startsWith('GitHubで照合できません') && existsSync(path)) writeFileSync(path, JSON.stringify({ issue: { number, labels: [], title: '', state: 'closed' } }));
    throw error;
  }
}
export function sharedUpstream(cwd, branch) {
  try { return git(['for-each-ref', '--format=%(upstream:short)', `refs/heads/${branch}`], cwd); }
  catch { return ''; }
}
export function ensureSharedUpstream(cwd, branch) {
  checkSharedBranch(branch);
  let localId;
  try { localId = git(['rev-parse', '--verify', `refs/heads/${branch}`], cwd); }
  catch { return false; }
  const remoteId = git(['rev-parse', '--verify', `refs/remotes/origin/${branch}`], cwd);
  const upstream = sharedUpstream(cwd, branch);
  if (upstream !== `origin/${branch}`) {
    try { git(['merge-base', '--is-ancestor', localId, remoteId], cwd); }
    catch { throw new Error(`共有ブランチ ${branch} のローカル先端がorigin/${branch}から分岐しています。破棄せず確認してください。`); }
    git(['branch', '--set-upstream-to', `origin/${branch}`, branch], cwd);
  }
  return true;
}
export function verifyShared(cwd, branch, { requireUpstream = false } = {}) {
  checkSharedBranch(branch);
  repository(cwd);
  if (requireUpstream && sharedUpstream(cwd, branch) !== `origin/${branch}`) {
    throw new Error(`共有ブランチ ${branch} のupstreamはorigin/${branch}にしてください。`);
  }
  return branch;
}
export function claim(cwd, number, owner) {
  if (!Number.isSafeInteger(number) || number < 1) throw new Error('Task番号を指定してください。');
  const repo = repository(cwd), endpoint = `repos/${repo}/issues/${number}`;
  let issue = api(cwd, endpoint);
  if (issue.title.startsWith(`[${owner}] `)) { validateIssue(issue, number, owner); return issue; }
  if (!issue.title.startsWith('[unassigned] ') || issue.assignees?.length) throw new Error('未割当のTaskだけ取得できます。他人の担当を変更しません。');
  validateIssue({ ...issue, title: `[${owner}] ` + issue.title.slice(13) }, number, owner);
  // Re-read immediately before mutation; GitHub does not offer an atomic claim API.
  const latest = api(cwd, endpoint);
  if (latest.title !== issue.title || latest.updated_at !== issue.updated_at || latest.assignees?.length) throw new Error('確認中にIssueが更新されました。再確認してください。');
  api(cwd, endpoint, { title: `[${owner}] ` + issue.title.slice(13) });
  issue = api(cwd, endpoint); validateIssue(issue, number, owner);
  return issue;
}
