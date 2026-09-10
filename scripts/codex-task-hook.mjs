import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, realpathSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import shellQuote from 'shell-quote';
import { shellParts } from './codex-mise-hook.mjs';
import { currentBranch, ownerAt, verify, verifyShared, isSharedBranch, git } from './task-policy.mjs';

const checked = new Map();
function boardCheck(cwd, mode) {
  const root = git(['rev-parse', '--show-toplevel'], cwd), key = root + ':' + mode;
  if (!checked.has(key)) checked.set(key, JSON.parse(execFileSync(process.platform === 'win32' ? 'python' : 'python3', ['-X', 'utf8', resolve(root, 'tools/task_worktree.py'), mode], { cwd, encoding: 'utf8', timeout: 45000 })));
  return checked.get(key);
}
function working(cwd, owner) {
  if (currentBranch(cwd) === 'main' && boardCheck(cwd, 'phase').main_edit_allowed) return { paths: null };
  return boardCheck(cwd, 'verify-local');
}
function fileTarget(path, cwd, owner) {
  const requested = resolve(cwd, path);
  let dir = requested;
  if (!existsSync(dir)) dir = dirname(dir);
  while (!existsSync(dir)) dir = dirname(dir);
  const real = realpathSync(dir);
  let root;
  try { root = git(['rev-parse', '--show-toplevel'], real); }
  catch { root = git(['rev-parse', '--show-toplevel'], dirname(real)); }
  const state = working(root, owner);
  const target = relative(realpathSync(root), resolve(real, relative(dir, requested))).replaceAll('\\', '/');
  if (state.paths && !state.paths.some(p => target === p || (p.endsWith('/') && target.startsWith(p)))) throw new Error('編集先が取得済みpathの外です。先にadd-lockしてください。');
}
export function inspectShell(command, cwd, owner) {
  const { normalized, substitutions } = shellParts(command);
  for (const sub of substitutions) inspectShell(sub, cwd, owner);
  const tokens = shellQuote.parse(normalized, key => `$${key}`);
  if (tokens.some(t => typeof t !== 'string')) {
    let words = [], redirect = false;
    for (const token of tokens) {
      if (typeof token === 'string') { if (!redirect) words.push(token); redirect = false; }
      else if (token.comment !== undefined) break;
      else if ([';', '&&', '||', '|', '&'].includes(token.op)) {
        if (words.length) inspectShell(shellQuote.quote(words), cwd, owner);
        words = [];
      } else if (['>', '>>', '<', '>&', '<&'].includes(token.op)) {
        working(cwd, owner); redirect = true;
      } else throw new Error('複雑なシェル構文はスクリプトへ分けてください。');
    }
    if (words.length) inspectShell(shellQuote.quote(words), cwd, owner);
    return;
  }
  // Bootstrap commands must work before a task board or claim exists.
  // Accept exact invocations only; shell operators and substitutions were checked above.
  const setupTasks = ['hooks:bootstrap', 'hooks:install', 'task:init', 'task:ready', 'check', 'verify', 'specs:check'];
  if (tokens[0] === 'mise' && tokens.length === 2 && ['trust', 'install'].includes(tokens[1])) return;
  if (tokens[0] === 'mise' && tokens[1] === 'run' && tokens.length === 3 && setupTasks.includes(tokens[2])) return;
  if (tokens.length === 6 && tokens.slice(0, 3).join(' ') === 'mise exec --' && tokens.slice(3).join(' ') === 'bun install --frozen-lockfile') return;
  let words = [...tokens];
  if (words[0] === 'mise' && ['exec', 'x'].includes(words[1]) && words[2] === '--') words = words.slice(3);
  if (['env', 'command', 'exec', 'nohup'].includes(words[0])) {
    words.shift();
    while (words[0]?.startsWith('-') || /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[0] ?? '')) words.shift();
  }
  if (['sh', 'bash', 'zsh'].includes(words[0])) {
    const i = words.findIndex(w => /^-[^-]*c/.test(w));
    if (i >= 0) return inspectShell(words[i + 1], cwd, owner);
  }
  if (words[0] === 'cd') throw new Error('移動先はツールのworkdirで指定してください。');
  if (words[0] === 'git') {
    words.shift();
    while (words[0] === '-C') { cwd = resolve(cwd, words[1]); words = words.slice(2); }
    if (words[0]?.startsWith('-')) throw new Error('Gitオプションは -C のみ対応しています。作業先はworkdirで指定してください。');
    if (words[0] === 'worktree' && words[1] === 'add') {
      throw new Error('worktree作成は短命Taskなら mise run task:worktree を使ってください。');
    }
    const shared = currentBranch(cwd);
    if (isSharedBranch(shared)) {
      if (shared === 'main' && boardCheck(cwd, 'phase').main_edit_allowed) return;
      return inspectSharedGit(words, cwd, shared);
    }
    if (['status', 'diff', 'log', 'show', 'rev-parse', 'ls-files', 'fetch'].includes(words[0]) || (words[0] === 'worktree' && ['list', 'prune'].includes(words[1]))) return;
    if (words[0] === 'worktree' && words[1] === 'remove' && words.length === 3) { working(resolve(cwd, words[2]), owner); return; }
    if (words[0] === 'branch' && (words.length === 1 || words[1] === '--list' || words[1] === '-a' || words[1] === '-r')) return;
    // Branch creation and push are validated by Git hooks, including every ref.
    if (['branch', 'switch', 'checkout', 'push'].includes(words[0])) return;
  }
  if (words[0] === 'mise' && words[1] === 'run' && ['task:claim', 'task:verify', 'task:refresh', 'task:worktree', 'task:exec', 'task:submit', 'task:land', 'task:finish', 'preparation:finish'].includes(words[2])) return;
  if (words[0] === 'gh') {
    if ((words[1] === 'issue' || words[1] === 'pr') && ['list', 'view', 'status', 'diff', 'checks'].includes(words[2])) return;
    if (words[1] === 'issue' && ['edit', 'close', 'reopen', 'comment'].includes(words[2])) {
      if (!/^\d+$/.test(words[3] ?? '') || words.some(w => ['--repo', '-R', '--title', '-t', '--add-assignee', '--remove-assignee'].includes(w) || w.startsWith('--repo=') || w.startsWith('--title='))) throw new Error('担当変更はtask:claimを使い、Issue操作は番号を明示してください。');
      verify(cwd, `${owner}/${words[3]}-issue`, owner); return;
    }
    if (words[1] === 'issue' && words[2] === 'create') return;
    if (words[1] === 'issue') throw new Error('このIssue操作はまだ対応していません。');
    if (words[1] === 'api' && !words.some(w => /^(?:-X|-f|-F|--method|--field|--raw-field|--input)(?:=|$)/.test(w))) return;
    if (words[1] === 'api') throw new Error('Issueの直接API変更は検査できません。Task取得はtask:claim、通常操作はgh issueを使ってください。');
  }
  if (words.length === 2 && ['node', 'bun', 'gh', 'lefthook'].includes(words[0]) && ['--version', '--help'].includes(words[1])) return;
  if (words[0] === 'mise' && words[1] === 'run' && ['check', 'verify', 'hooks:test', 'codex-hooks:test', 'hooks:install', 'task:ready'].includes(words[2]) && words.length === 3) return;
  if (['pwd', 'ls', 'cat', 'head', 'tail', 'rg', 'wc'].includes(words[0])) return;
  working(cwd, owner);
}

function inspectSharedGit(words, cwd, branch) {
  if (['status', 'diff', 'log', 'show', 'rev-parse', 'ls-files'].includes(words[0])) return;
  if (words[0] === 'branch' && (words.length === 1 || words[1] === '--list' || words[1] === '-a' || words[1] === '-r')) return;
  if (words[0] === 'worktree' && words[1] === 'list') return;
  if (words[0] === 'fetch' && words.length === 3 && words[1] === 'origin' && words[2] === branch) return;
  const clean = () => {
    if (git(['status', '--porcelain', '--untracked-files=all'], cwd)) throw new Error(`共有ブランチ ${branch} に未保存の変更があります。破棄せず確認してください。`);
  };
  if (words[0] === 'merge' && words.length === 3 && words[1] === '--ff-only' && words[2] === `origin/${branch}`) { clean(); return; }
  if (words[0] === 'pull' && ((words.length === 2 && words[1] === '--ff-only') || (words.length === 4 && words[1] === '--ff-only' && words[2] === 'origin' && words[3] === branch))) { clean(); if (words.length === 2) verifyShared(cwd, branch, { requireUpstream: true }); return; }
  throw new Error(`共有ブランチ ${branch} は読取り専用です。同期はorigin/${branch}へのfast-forwardだけ許可します。`);
}
export function handle(event) {
  if (event.hook_event_name !== 'PreToolUse' || !event.cwd) throw new Error('Codex hookの入力が不正です。');
  const input = event.tool_input ?? {}, cwd = resolve(event.cwd, input.workdir ?? input.cwd ?? '.');
  let owner = '';
  try { owner = ownerAt(cwd); } catch { /* Reads and preparation-main setup do not need an owner. */ }
  if (['Bash', 'exec_command'].includes(event.tool_name)) return inspectShell(input.command ?? input.cmd ?? '', cwd, owner);
  const patch = typeof input === 'string' ? input : input.patch ?? input.input ?? input.command;
  if (event.tool_name === 'apply_patch' && typeof patch === 'string') {
    const paths = [...patch.matchAll(/^\*\*\* (?:Add File|Update File|Delete File|Move to): (.+)$/gm)].map(m => m[1]);
    if (!paths.length) throw new Error('編集先を確認できません。');
    for (const path of paths) fileTarget(path, cwd, owner);
  } else if (input.file_path || input.path) fileTarget(input.file_path ?? input.path, cwd, owner);
  else throw new Error('編集先を明示してください。');
}
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { handle(JSON.parse(readFileSync(0, 'utf8'))); }
  catch (error) { console.error(error.message); process.exit(2); }
}
