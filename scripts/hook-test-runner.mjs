import { spawnSync } from 'node:child_process';

// Exercise the configured command, including the Windows override, not just its JS body.
export function runHook(handler, options) {
  if (process.platform === 'win32') {
    if (!handler.commandWindows) throw new Error('Missing Windows hook command');
    return spawnSync(handler.commandWindows, { ...options, shell: true, timeout: 10000 });
  }
  return spawnSync('/bin/sh', ['-c', handler.command], { ...options, timeout: 10000 });
}
