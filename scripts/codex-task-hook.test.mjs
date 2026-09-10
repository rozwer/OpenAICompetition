import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inspectShell } from './codex-task-hook.mjs';

for (const command of ['mise trust','mise install','mise exec -- bun install --frozen-lockfile','mise run hooks:bootstrap','mise run hooks:install','mise run task:init','mise run task:ready','mise run check','mise run specs:check']) {
  test(`board初期化前の正規導入経路: ${command}`, () => {
    const root=mkdtempSync(join(tmpdir(),'hook-bootstrap-'));
    try { assert.doesNotThrow(() => inspectShell(command, root, '')); }
    finally { rmSync(root,{recursive:true,force:true}); }
  });
}
for (const command of ['mise run hooks:install && touch outside','mise run task:init --manifest /tmp/unowned.json','mise run check -- arbitrary','mise exec -- bun install --frozen-lockfile; touch outside']) {
  test(`導入の許可で任意実行を通さない: ${command}`, () => {
    const root=mkdtempSync(join(tmpdir(),'hook-bootstrap-'));
    try { assert.throws(() => inspectShell(command, root, '')); }
    finally { rmSync(root,{recursive:true,force:true}); }
  });
}
