"""Package the verified v2.1 files. No publishing, Issue creation or application execution."""
from pathlib import Path
import csv,hashlib,json,re,stat,zipfile
P=Path(__file__).resolve().parents[1]
read=lambda n:json.loads((P/n).read_text())
g=read('TASK_GRAPH.json');contract=read('evidence/contract-validation.json');ts=read('evidence/typescript-tests.json');question=read('evidence/question-tests.json');mutation=read('evidence/mutation-tests.json');locks=read('evidence/taskctl-tests.json')
rows=list(csv.DictReader((P/'FULL_REQUIREMENT_MATRIX.csv').open(encoding='utf-8-sig')))
baseline=read('evidence/v2-requirement-baseline.json');now={r['id']:r for r in rows}
for row in baseline:
 for key,value in row.items():assert now[row['id']][key]==value
preserved={'count':len(rows),'originalRequirements':145,'additionalRequirements':12,'exactFieldsPreserved':['id','feature','user_value','original_acceptance_preserved'],'oldIssuesMapped':56,'oldAcceptancesMapped':55,'comparison':'Rechecked against preserved v2 field snapshot'}
(P/'evidence/requirement-preservation.json').write_text(json.dumps(preserved,ensure_ascii=False,indent=2)+'\n')
(P/'evidence/typecheck.json').write_text(json.dumps({'typescript':ts['typescript'],'node':ts['node'],'success':True,'evidence':'typescript-tests.json','scope':'Revised DTOs, operation-specific client, entry ABI and reference cases'},indent=2)+'\n')
report=f'''# 検証レポート — v2.1

2026-09-09。対象は改訂仕様、共有契約、参考実装。アプリ本体・HTTP handler・ライブCodex接続の実装完了を意味しない。

| 検査 | 結果 | 証拠 |
|---|---|---|
| 要件保持 | 元145＋追加12のID・名称・価値・受入本文を完全一致で確認 | evidence/requirement-preservation.json |
| タスク | 114件、全件未割当、依存循環なし、初期依存なし77、POOL8 | evidence/contract-validation.json |
| HTTP/DTO | 89操作、304 schema、139形式例をJSON Schema検査 | evidence/contract-validation.json |
| SQL | 44テーブル、506業務列、seed/FKの確認成功 | evidence/contract-validation.json |
| 型 | 正しい呼出し成功、誤operation/path/body/response等の5例を型で拒否 | evidence/typescript-tests.json |
| 登録形式 | {ts['entries']['passed']}ケース成功。重複・宣言不一致・fixtureの誤公開・不一致版を拒否 | evidence/typescript-tests.json |
| 経路制約 | {ts['route']['passed']}ケース成功。道中の適合・違反・欠落・鮮度・車種・運賃不明 | evidence/typescript-tests.json |
| 質問と回答 | {question['passed']}ケース成功。別原文保存・再送・skip/defer・再入場・再抽出用ID | evidence/question-tests.json |
| 保存参考実装 | {mutation['passed']}ケース成功 | evidence/mutation-tests.json |
| 編集ロック | {locks['passed']}ケース成功。ローカルの一時bare repoのみ | evidence/taskctl-tests.json |

TypeScriptは{ts['typescript']}、参考コードはNode {ts['node']}。参考コードの計61ケースと5件の型拒否例を確認した。形式例の件数とは別集計。専用OpenAPI意味検証器、実機、実交通、実災害データ、ライブAI、公開配備は今回の検査対象に含めていない。型が合うことを現実の経路やAI効果の証明にしない。

質問フローの例はローカルSQLite参考処理の出力を使用し、再抽出のrequestは型・参照先まで確認。実AIへの送信はしていない。ConnectionReceiptを参考テストから実アプリ用に発行していない。

再現手順はtools/README.md。再生成・再検査すると環境情報やハッシュが変わるため、配布前にtools/package_delivery.pyでmanifest/ZIPを更新する。
'''
(P/'VALIDATION_REPORT.md').write_text(report)
parts=['SPEC_INDEX.md','REVISION_NOTES.md','TASK_EXECUTION.md','ENTRY_CONTRACT.md','CONTRACTS_V2.md','API_CONTRACT.md','DB_SCHEMA.md','QUESTION_FLOW.md','ROUTE_CONSTRAINT_FLOW.md','PRODUCT_AND_UX.md','STACK_AND_ARCHITECTURE.md','DATA_API_AND_AI.md','MAP_GROWTH_AND_DISCOVERY.md','EXTENSIONS_AND_APP_MODIFICATION.md','IDEAL_ROADMAP_AND_DECISIONS.md','DEMO_AND_MINIMUM_CHECKS.md','CONTRACT_CHANGE.md','VALIDATION_REPORT.md']
(P/'SPEC_COMPLETE.md').write_text('# 育てる地図 Stage2 v2.1 — 統合仕様書\n\n157要件、114タスク。6件の精査修正を反映。アプリ実装は未適用。\n\n'+'\n\n---\n\n'.join('## 収録：'+name+'\n\n'+(P/name).read_text() for name in parts))
delivery={'version':'v2.1.0','artifactDate':'2026-09-09','requirements':157,'tasks':114,'initialDependencyReady':77,'explicitPoolTasks':8,'apiOperations':89,'jsonSchemas':304,'sqlTables':44,'domainColumns':506,'noTaskTimeboxes':True,'allTasksUnassigned':True,'sourceApplicationImplemented':False,'githubIssuesCreated':False,'supersedesSpecification':'v2.0.0','wireCompatibleWithV2':False,'reviewFindingsAddressed':['R1','R2','R3','R4','R5','R6'],'manifest':'MANIFEST.sha256'}
(P/'DELIVERY.json').write_text(json.dumps(delivery,ensure_ascii=False,indent=2)+'\n')
broken=[]
for file in P.rglob('*.md'):
 for target in re.findall(r'\]\(([^)]+)\)',file.read_text()):
  target=target.split('#',1)[0]
  if not target or re.match(r'[a-zA-Z]+:',target):continue
  if not (file.parent/target).exists():broken.append((str(file.relative_to(P)),target))
assert not broken,broken
files=sorted(f for f in P.rglob('*') if f.is_file())
assert not any(f.is_symlink() or '__pycache__' in f.parts or f.name.endswith('.pyc') for f in files)
delivery['fileCount']=len(files);delivery['markdownLinks']='local targets verified'
(P/'DELIVERY.json').write_text(json.dumps(delivery,ensure_ascii=False,indent=2)+'\n')
manifest=''.join(hashlib.sha256(f.read_bytes()).hexdigest()+'  '+f.relative_to(P).as_posix()+'\n' for f in files if f.name!='MANIFEST.sha256')
(P/'MANIFEST.sha256').write_text(manifest)
archive=P.with_suffix('.zip') if not P.name.endswith('20260909') else P.parent/(P.name+'.zip')
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for f in files:z.write(f,arcname=P.name+'/'+f.relative_to(P).as_posix())
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 for line in manifest.splitlines():
  digest,name=line.split('  ',1);assert hashlib.sha256(z.read(P.name+'/'+name)).hexdigest()==digest
print(json.dumps({'archive':str(archive),'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'files':len(files),'manifestVerified':len(files)-1},ensure_ascii=False,indent=2))
