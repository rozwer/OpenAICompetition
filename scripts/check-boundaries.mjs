import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
const root = resolve("src");
let violations = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(file);
      continue;
    }
    if (!/\.tsx?$/.test(file)) continue;
    const own = relative(root, file).replaceAll("\\", "/");
    for (const match of readFileSync(file, "utf8").matchAll(
      /(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g,
    )) {
      const spec = match[1];
      let target = spec.startsWith(".")
        ? relative(root, resolve(dirname(file), spec)).replaceAll("\\", "/")
        : spec.startsWith("@/")
          ? spec.slice(2)
          : spec;
      const feature = own.match(/^features\/([^/]+)\//)?.[1],
        other = target.match(/^features\/([^/]+)\//)?.[1];
      if (
        feature &&
        ((other && other !== feature) ||
          /^(server|infrastructure)\//.test(target))
      )
        violations.push(`${own} -> ${target}`);
      if (
        /^(contracts|domain)\//.test(own) &&
        /^(features|server|infrastructure|client|app)\//.test(target)
      )
        violations.push(`${own} -> ${target}`);
    }
  }
}
walk(root);
if (violations.length) {
  console.error(violations.join("\n"));
  process.exit(1);
}
console.log(
  "Module boundaries passed: features are independent; domain/contracts have no outer dependencies.",
);
