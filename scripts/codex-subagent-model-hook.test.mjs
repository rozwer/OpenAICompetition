import { runHook } from "./hook-test-runner.mjs";
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { checkModel } from './codex-subagent-model-hook.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const event = input => ({ hook_event_name: 'PreToolUse', tool_name: 'spawn_agent', model: 'parent-model', tool_input: input });
for (const input of [{}, {model:null}, {model:''}, {model:'  \n'}, {model:1}, {model:false}, undefined]) {
  test(`モデル省略・空・不正型を拒否: ${JSON.stringify(input)}`, () => assert.throws(() => checkModel(event(input)), /modelを明示/));
}
for (const model of ['gpt-5.6-luna','gpt-6-astra','future-model']) {
  test(`指定されたモデルを変更せず許可: ${model}`, () => {
    const input={model};const e=event(input);
    for(let i=0;i<10;i++) assert.doesNotThrow(() => checkModel(e));
    assert.deepEqual(input,{model});
  });
}
test('Agent別名・他ツール・不正イベント', () => {
  assert.throws(() => checkModel({...event({}),tool_name:'Agent'}));
  assert.doesNotThrow(() => checkModel({...event({}),tool_name:'Bash'}));
  assert.throws(() => checkModel({hook_event_name:'SubagentStart'}));
});
test('登録された実hookコマンドでexit 2と許可を確認', () => {
  const config=JSON.parse(readFileSync(new URL('../.codex/hooks.json',import.meta.url),'utf8'));
  const group=config.hooks.PreToolUse.find(g=>g.matcher==='^(spawn_agent|Agent)$');
  assert.ok(group);
  for(const [input,status] of [[JSON.stringify(event({})),2],[JSON.stringify(event({model:'gpt-5.6-luna'})),0],['invalid json',2]]) {
    const r=runHook(group.hooks[0],{cwd:root,input,encoding:'utf8'});
    assert.equal(r.status,status,r.stderr);
    if(status===0) assert.equal(r.stdout,'');
    else assert.ok(r.stderr);
  }
});
