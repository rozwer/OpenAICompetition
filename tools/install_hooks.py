"""Compose OS-specific Codex sources and install this clone's Git hooks."""
from pathlib import Path
import argparse, copy, json, os, subprocess
ROOT = Path(__file__).resolve().parents[1]

def compose(root):
    mac = json.loads((root / '.codex/hooks.macos.json').read_text(encoding='utf-8'))
    win = json.loads((root / '.codex/hooks.windows.json').read_text(encoding='utf-8'))
    merged = copy.deepcopy(mac)
    merged['description'] = 'Generated from hooks.macos.json and hooks.windows.json by tools/install_hooks.py. Edit the OS sources.'
    if mac['hooks'].keys() != win['hooks'].keys():
        raise ValueError('OS hook events differ')
    for event, groups in mac['hooks'].items():
        other = win['hooks'][event]
        if len(groups) != len(other):
            raise ValueError('OS hook groups differ: ' + event)
        for index, (group, windows) in enumerate(zip(groups, other)):
            if {k:v for k,v in group.items() if k != 'hooks'} != {k:v for k,v in windows.items() if k != 'hooks'}:
                raise ValueError('OS hook matchers differ: ' + event)
            if len(group['hooks']) != len(windows['hooks']):
                raise ValueError('OS hook handlers differ: ' + event)
            for number, (handler, whandler) in enumerate(zip(group['hooks'], windows['hooks'])):
                if 'commandWindows' in handler or 'commandWindows' in whandler:
                    raise ValueError('Use command in each OS source, not commandWindows')
                if {k:v for k,v in handler.items() if k != 'command'} != {k:v for k,v in whandler.items() if k != 'command'}:
                    raise ValueError('OS hook policy differs: ' + event)
                if handler.get('type') != 'command' or not handler.get('command') or not whandler.get('command'):
                    raise ValueError('Expected nonempty command hooks')
                merged['hooks'][event][index]['hooks'][number]['commandWindows'] = whandler['command']
    return json.dumps(merged, ensure_ascii=False, indent=2) + '\n'

def git(root, *args):
    return subprocess.run(['git', *args], cwd=root, text=True, encoding='utf-8', capture_output=True, check=True).stdout.strip()

def validate_existing(root, current, expected):
    if not current or current == expected:
        return
    previous = Path(current)
    if not previous.is_absolute():
        if current.replace('\\', '/') in ('.githooks', '.githooks/windows', '.githooks/macos'):
            return
    else:
        parent = previous.parent if previous.name == '.githooks' else previous.parent.parent
        suffix = previous.relative_to(parent).as_posix()
        if suffix in ('.githooks', '.githooks/windows', '.githooks/macos'):
            try:
                if git(parent, 'rev-parse', '--path-format=absolute', '--git-common-dir') == git(root, 'rev-parse', '--path-format=absolute', '--git-common-dir'):
                    return
            except (subprocess.CalledProcessError, OSError):
                pass
    raise ValueError('Existing core.hooksPath differs; inspect before replacing it: ' + current)

def read_config(root, *args):
    result = subprocess.run(['git', 'config', *args], cwd=root, text=True,
                            encoding='utf-8', capture_output=True)
    if result.returncode not in (0, 1):
        raise ValueError(result.stderr.strip() or 'git config failed')
    return result.stdout.strip() if result.returncode == 0 else ''

def bootstrap(root=ROOT):
    """Enable config.worktree explicitly; this is the one shared clone change."""
    enabled = read_config(root, '--local', '--bool', '--get', 'extensions.worktreeConfig')
    if enabled != 'true':
        git(root, 'config', '--local', 'extensions.worktreeConfig', 'true')
    print('Enabled Git config.worktree for this clone.')

def install(root=ROOT, *, check=False, generate_only=False):
    content = compose(root)
    output = root / '.codex/hooks.json'
    if check:
        if not output.is_file() or output.read_text(encoding='utf-8') != content:
            raise ValueError('Generated hooks.json is stale; run mise run hooks:install')
        return
    expected = '.githooks/windows' if os.name == 'nt' else '.githooks/macos'
    if not generate_only:
        enabled = read_config(root, '--local', '--bool', '--get', 'extensions.worktreeConfig')
        if enabled != 'true':
            raise ValueError('config.worktree is not enabled; run mise run hooks:bootstrap once in this clone')
        current = read_config(root, '--worktree', '--get', 'core.hooksPath')
        if not current:
            # A worktree-local value will take precedence, but do not silently hide
            # an unrelated clone-wide custom hook selection.
            current = read_config(root, '--local', '--get', 'core.hooksPath')
        validate_existing(root, current, expected)
        for name in ('pre-commit', 'pre-push', 'reference-transaction'):
            path = root / expected / name
            if not path.is_file():
                raise ValueError('Missing Git hook: ' + str(path))
    # Same generated file on both OSes: installation creates no OS-only Git diff.
    if not output.is_file() or output.read_text(encoding='utf-8') != content:
        output.write_text(content, encoding='utf-8', newline='\n')
    if not generate_only:
        git(root, 'config', '--worktree', 'core.hooksPath', expected)
        print('Installed Git hooks:', expected)
    print('Codex hooks composed from separate macOS/Windows sources. Review changed hooks in Codex.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--generate-only', action='store_true')
    parser.add_argument('--bootstrap', action='store_true')
    args = parser.parse_args()
    try:
        if args.bootstrap:
            bootstrap()
        else:
            install(check=args.check, generate_only=args.generate_only)
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        raise SystemExit(str(error))
