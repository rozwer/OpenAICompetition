"""Exact root-Markdown relocation, also used to validate historical task path changes."""
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'docs/team/document-paths.json'
def moves():
    data=json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    for old,new in data.items():
        if '/' in old or old in ('README.md','AGENTS.md') or not old.endswith('.md') or new!='docs/spec/'+old:
            raise ValueError('Only exact root Markdown -> docs/spec moves are allowed')
    return data

def rewrite(text,mapping=None):
    mapping=moves() if mapping is None else mapping
    if not mapping:return text
    pattern=r'(?<![A-Za-z0-9_/-])((?:\.\./)*)('+ '|'.join(re.escape(k) for k in sorted(mapping,key=len,reverse=True)) +r')(?![A-Za-z0-9_])'
    return re.sub(pattern,lambda m:m.group(1)+mapping[m.group(2)],text)

def relocate(value,mapping=None):
    mapping=moves() if mapping is None else mapping
    if isinstance(value,str):return rewrite(value,mapping)
    if isinstance(value,list):return [relocate(v,mapping) for v in value]
    if isinstance(value,dict):return {k:relocate(v,mapping) for k,v in value.items()}
    return value
