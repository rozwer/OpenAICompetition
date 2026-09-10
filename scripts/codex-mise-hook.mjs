import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseToml } from "smol-toml";
import shellQuote from "shell-quote";

const managers = ["npm", "pnpm", "yarn", "bun"];
const shells = ["sh", "bash", "zsh", "dash"];
const cacheRoot = join(tmpdir(), `codex-mise-hook-${process.getuid?.() ?? "user"}`);

export function repository(cwd) {
  const result = spawnSync("git", ["-C", cwd, "rev-parse", "--show-toplevel"], { encoding: "utf8" });
  return result.status === 0 ? realpathSync(result.stdout.trim()) : null;
}

export function readPolicy(root) {
  const path = root && join(root, "mise.toml");
  if (!path || !existsSync(path)) return null;
  const config = parseToml(readFileSync(path, "utf8"));
  const tools = Object.fromEntries(Object.entries(config.tools ?? {}).map(([name, value]) => [name, typeof value === "string" ? value : value?.version]));
  const candidates = managers.filter((name) => tools[name]);
  const manager = config.vars?.codex_package_manager ?? (candidates.length === 1 ? candidates[0] : null);
  const runtime = config.vars?.codex_runtime ?? (tools.node ? "node" : null);
  if (!managers.includes(manager) || !tools[manager] || !["node", "bun", "deno"].includes(runtime) || !tools[runtime]) {
    throw new Error("mise.toml の [vars] に codex_package_manager と codex_runtime を指定し、両方を [tools] に登録してください。");
  }
  return { path, root, tools, manager, runtime };
}

export function sessionPolicy(cwd, sessionId, directory = cacheRoot) {
  if (!sessionId || typeof sessionId !== "string") throw new Error("Codexのsession_idがありません。");
  const root = repository(cwd);
  const key = createHash("sha256").update(JSON.stringify([sessionId, root ?? resolve(cwd)])).digest("hex");
  const path = join(directory, `${key}.json`);
  if (existsSync(path)) return { ...JSON.parse(readFileSync(path, "utf8")), fresh: false };
  let value;
  try { value = { policy: readPolicy(root) }; }
  catch (error) { value = { policy: null, error: error.message }; }
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const temporary = `${path}.${process.pid}.tmp`;
  writeFileSync(temporary, JSON.stringify(value), { mode: 0o600 });
  renameSync(temporary, path);
  return { ...value, fresh: true };
}

// shell-quote is a tokenizer, not an execution engine. Preserve command boundaries
// and inspect substitutions separately; never evaluate user-provided shell text.
export function shellParts(source) {
  let normalized = "", quote = null;
  const substitutions = [];
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === "\\" && quote !== "'") {
      if (source[i + 1] === "\n") { i++; continue; }
      normalized += c + (source[++i] ?? ""); continue;
    }
    if (c === "'" && quote !== '"') { quote = quote === "'" ? null : "'"; normalized += c; continue; }
    if (c === '"' && quote !== "'") { quote = quote === '"' ? null : '"'; normalized += c; continue; }
    if (quote !== "'" && (c === "`" || (c === "$" && source[i + 1] === "("))) {
      const backtick = c === "`";
      let j = i + (backtick ? 1 : 2), depth = 1, nestedQuote = null, content = "";
      for (; j < source.length; j++) {
        const char = source[j];
        if (char === "\\") { content += char + (source[++j] ?? ""); continue; }
        if (!backtick && ["'", '"'].includes(char)) nestedQuote = nestedQuote === char ? null : nestedQuote ?? char;
        if (backtick && char === "`") break;
        if (!backtick && !nestedQuote) {
          if (char === "(") depth++;
          if (char === ")" && --depth === 0) break;
        }
        content += char;
      }
      if (j >= source.length) throw new Error("シェル式を解析できません。コマンドを分けて指定してください。");
      substitutions.push(content);
      normalized += "__COMMAND_SUBSTITUTION__";
      i = j; continue;
    }
    if (c === "#" && !quote && (i === 0 || /\s/.test(source[i - 1]))) {
      while (i < source.length && source[i] !== "\n") i++;
      normalized += ";"; continue;
    }
    normalized += c === "\n" && !quote ? ";" : c;
  }
  if (quote) throw new Error("引用符を閉じ、コマンドを分けて指定してください。");
  return { normalized, substitutions };
}

function recommendation(name, args, policy) {
  const pm = policy.manager;
  const format = (words) => shellQuote.quote(["mise", "exec", "--", ...words]);
  if (["npx", "bunx"].includes(name) || ["dlx", "exec"].includes(args[0])) {
    const rest = ["npx", "bunx"].includes(name) ? args : args.slice(1);
    return format([...(pm === "bun" ? ["bunx"] : [pm, "exec"]), ...rest]);
  }
  if (["--version", "-v", "--help", "-h"].includes(args[0])) return format([pm, args[0]]);
  if (args[0] === "ci" && pm === "bun") return format([pm, "install", "--frozen-lockfile", ...args.slice(1)]);
  if (["install", "i"].includes(args[0])) {
    const hasPackage = args.slice(1).some((arg) => !arg.startsWith("-"));
    return format([pm, pm === "bun" && hasPackage ? "add" : "install", ...args.slice(1)]);
  }
  if (["add", "remove", "uninstall", "run"].includes(args[0])) return format([pm, args[0] === "uninstall" ? "remove" : args[0], ...args.slice(1)]);
  return format([pm, "run", ...args]);
}

function checkWords(words, policy, managed = false, depth = 0) {
  if (depth > 12) throw new Error("コマンドの入れ子を減らしてください。");
  words = [...words];
  while (words.length && (/^[A-Za-z_][A-Za-z0-9_]*=/.test(words[0]) || ["if", "then", "do", "elif", "!"].includes(words[0]))) words.shift();
  if (!words.length) return;
  const [executable, ...args] = words;
  const name = process.platform === 'win32'
    ? executable.replaceAll('\\', '/').split('/').at(-1).replace(/\.(exe|cmd|bat)$/i, '').toLowerCase()
    : basename(executable);
  if (/\$|__COMMAND_SUBSTITUTION__|__DYNAMIC_ARGUMENT__/.test(executable)) throw new Error("実行するコマンド名を変数や置換で隠さず、mise exec -- <コマンド> と明記してください。");
  if (["env", "command", "exec", "sudo", "nohup"].includes(name)) {
    let i = 0;
    while (i < args.length && (args[i].startsWith("-") || /^[A-Za-z_][A-Za-z0-9_]*=/.test(args[i]))) {
      if (["-u", "--unset", "-C", "--chdir", "--user", "-g"].includes(args[i])) i++;
      i++;
    }
    return checkWords(args.slice(i), policy, managed, depth + 1);
  }
  if (shells.includes(name)) {
    const i = args.findIndex((arg) => /^-[^-]*c/.test(arg));
    if (i >= 0 && args[i + 1]) return inspectCommand(args[i + 1], policy, managed, depth + 1);
    return;
  }
  if (process.platform === 'win32' && ['powershell', 'pwsh'].includes(name)) {
    if (args.some((arg) => /^-(?:e|enc|encodedcommand)$/i.test(arg))) throw new Error('Encoded PowerShell commands are not supported; use an explicit command.');
    const index = args.findIndex((arg) => /^-(?:c|command)$/i.test(arg));
    if (index >= 0) {
      const nested = args.slice(index + 1).join(' ');
      if (!nested || nested.includes('__DYNAMIC_ARGUMENT__')) throw new Error('Write the nested PowerShell command explicitly.');
      return inspectPowerShell(nested, policy, managed, depth + 1);
    }
    return;
  }
  if (["nvm", "fnm", "volta", "asdf", "corepack"].includes(name)) throw new Error(`このリポジトリのツール管理はmiseです。${name}の代わりに mise install または mise exec -- <コマンド> を使ってください。`);
  if (name === "mise") {
    if (args[0]?.startsWith("-")) throw new Error("作業先はツールのworkdirで指定し、mise exec -- <コマンド> または mise run <タスク> を使ってください。");
    if (["exec", "x"].includes(args[0])) {
      const separator = args.indexOf("--");
      if (separator < 0) throw new Error("mise exec -- <コマンド> の形式にしてください。");
      if (args.slice(1, separator).length) throw new Error("mise.tomlの指定を使うため、ツール版や別ディレクトリを上書きせず mise exec -- <コマンド> を使ってください。");
      return checkWords(args.slice(separator + 1), policy, true, depth + 1);
    }
    return;
  }
  if ((managers.includes(name) && name !== policy.manager) || (name === "npx" && policy.manager !== "npm") || (name === "bunx" && policy.manager !== "bun")) {
    throw new Error(`mise.tomlではパッケージ管理に${policy.manager}を指定しています。${name}は使えません。代わりに ${recommendation(name, args, policy)} を使ってください。`);
  }
  if (name === "deno" && policy.runtime !== "deno") throw new Error(`実行環境は${policy.runtime}です。mise exec -- ${policy.runtime} <ファイル> を使ってください。`);
  if (["bun", "bunx"].includes(name) && policy.runtime !== "bun") {
    const file = name === "bun" && args.find((arg, i) => (i === 0 || args[i - 1] === "run") && /\.(?:[cm]?[jt]sx?)$/.test(arg));
    if (file || args.some((arg) => ["--bun", "-b", "-e", "--eval", "-p", "--print"].includes(arg)) || (name === "bun" && args[0] === "test")) {
      throw new Error(`実行環境は${policy.runtime}です。mise exec -- ${policy.runtime} ${args[0] === "test" ? "--test" : "<ファイル>"} を使ってください。package.jsonのスクリプト実行は mise exec -- bun run <スクリプト名> を使えます。`);
    }
  }
  if ((policy.tools[name] || name === "bunx") && (!managed || executable !== name)) {
    throw new Error(`mise.tomlの版を使うため、${name}を直接起動せず ${shellQuote.quote(["mise", "exec", "--", name, ...args])} を使ってください。`);
  }
}

export function inspectCommand(source, policy, managed = false, depth = 0) {
  if (depth > 12) throw new Error("コマンドの入れ子を減らしてください。");
  const { normalized, substitutions } = shellParts(source);
  for (const command of substitutions) inspectCommand(command, policy, false, depth + 1);
  const tokens = shellQuote.parse(normalized, (key) => `$${key}`);
  let words = [], redirect = false;
  const flush = () => { checkWords(words, policy, managed, depth); words = []; };
  for (const token of tokens) {
    if (typeof token === "string") { if (!redirect) words.push(token); redirect = false; }
    else if (token.comment !== undefined) break;
    else if ([">", ">>", "<", ">&", "<&"].includes(token.op)) redirect = true;
    else if (token.op === "glob") words.push(token.pattern);
    else { flush(); redirect = false; }
  }
  flush();
}

export function inspectPowerShell(source, policy, managed = false, depth = 0) {
  if (depth > 12) throw new Error('Reduce nested shell commands.');
  const args = ['-NoProfile', '-NonInteractive', '-File', fileURLToPath(new URL('./powershell-command-words.ps1', import.meta.url))];
  // Do not carry Windows PowerShell's module search paths into a nested pwsh.
  // The parser uses only built-in modules from its own PowerShell installation.
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => name.toLowerCase() !== 'psmodulepath'));
  const options = { input: source, encoding: 'utf8', timeout: 5000, env };
  let parsed = spawnSync('pwsh.exe', args, options);
  if (parsed.error?.code === 'ENOENT') parsed = spawnSync('powershell.exe', args, options);
  if (parsed.error || parsed.status !== 0) throw new Error(parsed.stderr || parsed.error?.message || 'PowerShell parsing failed');
  for (const words of JSON.parse(parsed.stdout.replace(/^\uFEFF/, ''))) checkWords(words, policy, managed, depth);
}

export function handle(event, directory) {
  if (!["SessionStart", "PreToolUse"].includes(event.hook_event_name) || typeof event.cwd !== "string") throw new Error("Codex hookの入力が不正です。");
  const input = event.tool_input ?? {};
  const cwd = resolve(event.cwd, input.workdir ?? input.cwd ?? ".");
  const state = sessionPolicy(cwd, event.session_id, directory);
  if (state.error) throw new Error(state.error);
  if (!state.policy) return null;
  if (event.hook_event_name === "PreToolUse") {
    const command = input.command ?? input.cmd;
    if (typeof command !== "string") throw new Error("シェルコマンドを読み取れません。");
    const shell = input.shell ?? (process.platform === 'win32' ? 'powershell' : 'sh');
    if (/(?:powershell|pwsh)(?:\.exe)?$/i.test(shell)) inspectPowerShell(command, state.policy);
    else inspectCommand(command, state.policy);
  }
  if (state.fresh) return { hookSpecificOutput: { hookEventName: event.hook_event_name, additionalContext: `${state.policy.path}を検出しました。パッケージ管理: ${state.policy.manager}、実行環境: ${state.policy.runtime}。管理対象ツールは mise exec -- <コマンド>、登録済みタスクは mise run <タスク> で実行してください。設定変更後は新しいセッションで再検出します。` } };
  return null;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = handle(JSON.parse(readFileSync(0, "utf8")));
    if (result) console.log(JSON.stringify(result));
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
}
