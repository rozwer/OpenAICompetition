import { runHook } from "./hook-test-runner.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { handle, inspectCommand, inspectPowerShell, readPolicy, sessionPolicy } from "./codex-mise-hook.mjs";

const source = fileURLToPath(new URL("../", import.meta.url));
const policy = readPolicy(source);
const allowed = [
  "mise exec -- bun install", "mise exec -- bun add zod", "mise exec -- bun run dev",
  "mise exec -- bunx tsc --noEmit", "mise exec -- node --test", "mise exec -- gh issue list",
  "mise run check", "git status", 'echo "npm install"', "printf '%s' 'pnpm add x'",
  "# npm install\ngit status", "mise exec -- sh -c 'node --version'",
];
for (const command of allowed) test(`許可: ${command}`, () => assert.doesNotThrow(() => inspectCommand(command, policy)));

const denied = [
  "npm install", "npm ci", "pnpm add zod", "yarn install", "npx tsc", "corepack pnpm install",
  "env CI=1 npm install", "command npm install", "/usr/local/bin/npm install",
  "true && pnpm install", "true; yarn install", "true\nnpm install", "true | npm install",
  "sh -c 'npm install'", "bash -lc 'pnpm install'", "echo $(npm --version)", "echo `yarn --version`",
  "npm \\\ninstall", "mise exec -- npm install", "mise exec node@20 -- node index.js",
  "node index.js", "bun install", "mise exec -- /usr/bin/node index.js",
  "mise exec -- bun index.js", "mise exec -- bun run index.ts", "mise exec -- bun test",
  "mise exec -- bun --bun run dev", "mise exec -- bunx --bun tsc", "deno run index.ts",
  "volta run node index.js", "$PM install",
];
for (const command of denied) test(`拒否: ${command}`, () => assert.throws(() => inspectCommand(command, policy)));

function fixture(fn) {
  const root = mkdtempSync(join(tmpdir(), "codex-mise-test-"));
  const env = { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1" };
  try {
    const repo = join(root, "repo"); mkdirSync(repo);
    assert.equal(spawnSync("git", ["init", "-b", "main"], { cwd: repo, env }).status, 0);
    writeFileSync(join(repo, "mise.toml"), readFileSync(join(source, "mise.toml")));
    fn({ root, repo, cache: join(root, "cache"), env });
  } finally { rmSync(root, { recursive: true, force: true }); }
}

test("初回だけ設定を読み、同一セッションでは保持、新セッションで再検出", () => fixture(({ repo, cache }) => {
  assert.equal(sessionPolicy(repo, "session1", cache).fresh, true);
  // A later broken file would throw if reread. The existing session keeps its snapshot.
  writeFileSync(join(repo, "mise.toml"), "[broken");
  assert.equal(sessionPolicy(repo, "session1", cache).policy.manager, "bun");
  assert.ok(sessionPolicy(repo, "session2", cache).error);
}));

test("子ディレクトリでも同じリポジトリを初回検出する", () => fixture(({ repo, cache }) => {
  mkdirSync(join(repo, "sub"));
  assert.equal(sessionPolicy(join(repo, "sub"), "s", cache).policy.manager, "bun");
  assert.equal(sessionPolicy(repo, "s", cache).fresh, false);
}));

test("mise.tomlのないリポジトリを勝手にBunへ固定しない", () => fixture(({ repo, cache }) => {
  rmSync(join(repo, "mise.toml"));
  assert.equal(handle({ hook_event_name: "PreToolUse", session_id: "s", cwd: repo, tool_input: { command: "npm install" } }, cache), null);
}));

test("SessionStartは初回案内だけ、PreToolUseは毎回検査する", () => fixture(({ repo, cache }) => {
  const event = { hook_event_name: "SessionStart", session_id: "s", cwd: repo };
  assert.match(handle(event, cache).hookSpecificOutput.additionalContext, /bun/);
  assert.equal(handle(event, cache), null);
  for (let i = 0; i < 2; i++) assert.throws(() => handle({ ...event, hook_event_name: "PreToolUse", tool_input: { command: "npm install" } }, cache), /bun install/);
}));

test("tool_input.workdirを優先し、別リポジトリの設定を独立検出する", () => fixture(({ root, repo, cache, env }) => {
  const other = join(root, "other"); mkdirSync(other);
  assert.equal(spawnSync("git", ["init"], { cwd: other, env }).status, 0);
  writeFileSync(join(other, "mise.toml"), '[tools]\nnode="22.22.1"\npnpm="10.32.1"\n');
  const event = { hook_event_name: "PreToolUse", session_id: "s", cwd: repo, tool_input: { workdir: other, command: "mise exec -- pnpm install" } };
  assert.doesNotThrow(() => handle(event, cache));
  assert.throws(() => handle({ ...event, tool_input: { workdir: repo, command: event.tool_input.command } }, cache), /bun/);
}));

test("設定不正・入力不正を拒否する", () => fixture(({ repo, cache }) => {
  writeFileSync(join(repo, "mise.toml"), '[tools]\nnode="22.22.1"\nbun="1.3.14"\npnpm="10"\n');
  assert.throws(() => handle({ hook_event_name: "PreToolUse", session_id: "s", cwd: repo, tool_input: { command: "npm install" } }, cache), /codex_package_manager/);
  assert.throws(() => handle({}, cache));
}));

test("実hookプロセスは拒否をexit 2で返し、代替コマンドを表示する", () => fixture(({ repo }) => {
  const event = { hook_event_name: "PreToolUse", session_id: `process-${Date.now()}`, cwd: repo, tool_input: { command: "npm install" } };
  const result = spawnSync(process.execPath, [join(source, "scripts/codex-mise-hook.mjs")], { input: JSON.stringify(event), encoding: "utf8" });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /mise exec -- bun install/);
  const allowed = spawnSync(process.execPath, [join(source, "scripts/codex-mise-hook.mjs")], {
    input: JSON.stringify({ ...event, tool_input: { command: "mise exec -- node --version" } }), encoding: "utf8",
  });
  assert.equal(allowed.status, 0, allowed.stderr);
}));

test("hooks.jsonに登録した起動コマンドでも許可・拒否が動く", () => {
  const config = JSON.parse(readFileSync(join(source, ".codex/hooks.json"), "utf8"));
  const handler = config.hooks.PreToolUse[0].hooks[0];
  const command = handler.command;
  assert.equal(config.hooks.PreToolUse[0].matcher, "^Bash$");
  assert.equal(config.hooks.SessionStart[0].hooks[0].command, command);
  for (const [requested, status] of [["npm install", 2], ["mise exec -- node --version", 0]]) {
    const result = runHook(handler, {
      cwd: source, encoding: "utf8",
      input: JSON.stringify({ hook_event_name: "PreToolUse", session_id: `config-test-${process.pid}`, cwd: source, tool_input: { command: requested } }),
    });
    assert.equal(result.status, status, result.stderr);
    if (status === 2) assert.match(result.stderr, /mise exec -- bun install/);
  }
});

if (process.platform === 'win32') {
  for (const command of ['mise exec -- node --version', '$env:MODE = "test"; mise exec -- bun install', '& mise exec -- node --version', 'Get-Content README.md']) {
    test(`PowerShell許可: ${command}`, () => assert.doesNotThrow(() => inspectPowerShell(command, policy)));
  }
  for (const command of ['NPM install', '& npm.cmd install', '$tool="npm"; & $tool install', '$env:X = $(npm install)', 'mise exec -- npm install', 'node.exe --version', 'mise exec -- $tool', 'pwsh -Command "npm install"', 'powershell -EncodedCommand AAAA']) {
    test(`PowerShell拒否: ${command}`, () => assert.throws(() => inspectPowerShell(command, policy)));
  }
}

if (process.platform === 'win32' && spawnSync('pwsh.exe', ['-NoProfile', '-Command', '$PSVersionTable.PSVersion.Major']).status === 0) {
  test('PowerShell 7 pipeline chains', () => {
    assert.doesNotThrow(() => inspectPowerShell('mise exec -- node --version && git status', policy));
    assert.throws(() => inspectPowerShell('git status && npm install', policy));
  });
}
