"""Regenerate task-derived documentation from TASK_GRAPH; does not create GitHub issues."""
from pathlib import Path
import csv,json
P=Path(__file__).resolve().parents[1]
g=json.loads((P/'TASK_GRAPH.json').read_text());tasks=g['tasks'];ops={o['operation_id']:o for o in json.loads((P/'contracts/operations.json').read_text())}
def csv_write(name,fields,rows):
 with (P/name).open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,fieldnames=fields);w.writeheader()
  for row in rows:w.writerow({k:';'.join(row[k]) if isinstance(row.get(k),list) else row.get(k) for k in fields})
fields=['id','title','priority','effective_priority','kind','assignee','status','hard_dependencies','connect_after','contracts','write_paths','complexity','suggested_skills','operation_ids','requirement_ids','legacy_issue_ids','body_file']
csv_write('ISSUE_BACKLOG.csv',fields,tasks)
short=['id','title','priority','effective_priority','kind','assignee','write_paths','complexity']
csv_write('READY_TASKS.csv',short,[t for t in tasks if not t['hard_dependencies']])
csv_write('POOL_TASKS.csv',short,[t for t in tasks if t['kind']=='pool'])
index=['# タスク一覧 v2.1','',f'{len(tasks)}件。全件未割当。時間枠・固定担当はない。READYは実行boardの依存と編集ロックで判断する。','','| ID | 完成物 | 優先度 | 必須依存 |','|---|---|---|---|']
for t in tasks:
 integrated=t['kind'] in ('integration','gate')
 index.append(f"| [{t['id']}]({t['body_file']}) | {t['title']} | {t['priority']} | {', '.join(t['hard_dependencies']) or 'なし'} |")
 api=['| Endpoint | operationId | Request | Response |','|---|---|---|---|']
 for id in t['operation_ids']:
  o=ops[id];api.append(f"| `{o['method'].upper()} {o['path']}` | {id} | {o['request_schema'] or 'path/query'} | {o['response_schema']} |")
 api_text='\n'.join(api) if t['operation_ids'] else 'HTTPを新設しない。提供済みのOperationMapとPortを使う。'
 criterion='対象の実API・実DB・配線を使う。ライブAIを受入に含む場合は実応答を使う。fixture/Port fakeだけでは本Issueを完了にしない。' if integrated else '接続先が未完成でも契約fixtureでmodule単体を確認できる。未接続箇所を記録し、実接続の成功とは区別する。'
 failure='対象の実接続が不足する場合は未完了として阻害要因と動く範囲を残す。fakeでINT/GATEを完了にしない。必要なmoduleは本Issue内で再実装せず、該当taskへ戻す。' if integrated else 'Port fakeで確認できるのはmodule境界まで。接続先の実装やINTの完了を主張しない。契約不足はCONTRACT_CHANGE.mdに従って修正する。'
 text=f"""# [{t['id']}] {t['title']}

| 項目 | 契約 |
|---|---|
| 優先度 / 種別 | {t['priority']} / {t['kind']} |
| 担当 | 未割当。claim成功者がこのtaskだけを担当する |
| 着手の必須依存 | {', '.join(t['hard_dependencies']) or 'なし。提供済み契約で独立着手可能'} |
| 接続時に必要な実装 | {', '.join(t['connect_after']) or '上記の必須依存と受入操作に従う'} |
| 共有契約 | v2.1.0 / entries.ts / OperationMap / domain.ts / ports.ts |
| 編集ロック | {'; '.join('`'+p+'`' for p in t['write_paths'])} |
| 規模 | {t['complexity']}。時間・期限ではない |
| 元Issue追跡 | {', '.join(t['legacy_issue_ids']) or 'v2.1で追加・分割'} |
| 対応要件 | {', '.join(t['requirement_ids'])} |
| 状態 | 未着手。アプリ実装済みではない |

## 完成させるもの

{t['deliverable']}

## APIと保存境界

{api_text}

[登録形式](../ENTRY_CONTRACT.md)、[HTTP](../API_CONTRACT.md)、[OpenAPI](../contracts/openapi.yaml)、[DTO](../contracts/domain.ts)、[操作別の型](../contracts/operations.ts)、[SQL](../db/schema.sql)を使用する。機能は独自のentryやpath/body形式を作らない。

## 実装と受入

1. taskctlで依存と全編集pathを確認しclaimする。返されたbase_commitから専用worktreeを作る。
2. descriptorと注入Portを実装する。feature間の具象importはしない。契約変更は別の明示的な差分として調整する。
3. {criterion}
4. 次の操作を実行し、使用したデータmode・接続mode・保存結果を証拠へ残す。
5. submit→通常mergeまたはfast-forward→main到達確認→land。未完了ならbranchと引継ぎを残してreleaseする。

**受入操作**：{t['acceptance']}

サンプル地理データで本物の保存APIを確認することと、保存APIをfakeにすることは異なる。未知の高さ・架空経路を実測・実案内として示さない。

## 失敗・引継ぎ

{failure} 追加編集pathは先に全取得する。ロックの待ちが解消できなければ未完了として引き継ぎ、別のREADY/POOLを取得する。
"""
 (P/t['body_file']).write_text(text)
(P/'ISSUE_INDEX.md').write_text('\n'.join(index)+'\n')
print('Regenerated task docs:',len(tasks))
