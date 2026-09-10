"""Compile the contract tests and execute reference checks in a temporary CommonJS directory."""
from pathlib import Path
import argparse,json,shutil,subprocess,tempfile
P=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--tsc',default='tsc');parser.add_argument('--node',default='node');args=parser.parse_args()
tsc=shutil.which(args.tsc) or str(Path(args.tsc).resolve());node=shutil.which(args.node) or args.node
def run(cmd):return subprocess.run(cmd,check=True,capture_output=True,text=True).stdout.strip()
version=run([tsc,'--version']);nodeversion=run([node,'--version'])
base=[tsc,'--strict','--skipLibCheck','--target','es2022']
run(base+['--noEmit','--module','esnext','--moduleResolution','bundler',str(P/'examples/api-contract.typecheck.ts'),str(P/'examples/entry-wiring.ts'),str(P/'contracts/map-ports.ts')])
with tempfile.TemporaryDirectory(prefix='map-v21-ts-') as temp:
 out=Path(temp);(out/'package.json').write_text('{"type":"commonjs"}\n')
 run(base+['--module','commonjs','--esModuleInterop','--outDir',str(out),str(P/'tools/test_entries.ts'),str(P/'tools/test_route_constraints.ts')])
 entries=json.loads(run([node,str(out/'tools/test_entries.js')]))
 route=json.loads(run([node,str(out/'tools/test_route_constraints.js'),str(P/'examples/route-constraint-cases.json')]))
report={'kind':'typescript-v2.1-contracts','typescript':version,'node':nodeversion,'positiveApiCalls':'passed','negativeApiCalls':5,'negativeCheckMethod':'@ts-expect-error fails the compilation if an invalid call becomes accepted','entries':entries,'route':route,'scope':'Contract compilation and local reference examples, not app/live-AI integration'}
(P/'evidence/typescript-tests.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False,indent=2))
