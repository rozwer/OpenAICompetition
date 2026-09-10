import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function checkModel(event) {
  if (event?.hook_event_name !== 'PreToolUse') throw new Error('PreToolUseの入力が必要です。');
  if (!['spawn_agent', 'Agent'].includes(event.tool_name)) return;
  const model = event.tool_input?.model;
  if (typeof model !== 'string' || !model.trim()) {
    throw new Error('subagent起動時はmodelを明示してください。使用するモデルを選び、spawn_agentの引数にmodelを指定して再実行してください。既定値や親モデルの継承は明示指定として扱いません。');
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { checkModel(JSON.parse(readFileSync(0, 'utf8'))); }
  catch (error) { console.error(error.message); process.exit(2); }
}
