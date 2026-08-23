// lint-items.mjs —— 我们的每个 item:一次性宿主挂载 → hyperframes lint(仿官方 lint-registry-items)
//
// item 交付的是 <name>.html(lint 需要 index.html),故挂进骨架宿主后跑 lint,
// 只报 item 自身文件的 findings;忽略三条独立运行才适用的规则(官方同款忽略表)。
//
// 用法: node registry/scripts/lint-items.mjs [name...]   # 不传 = 全部我们的 item

import { execSync } from "node:child_process";
import { buildHost, cleanup, listOurItems, repoRoot, tmpHost } from "./lib-host.mjs";

const STANDALONE_ONLY = new Set([
  "root_missing_composition_id",
  "root_missing_dimensions",
  "multiple_root_compositions",
]);

const only = process.argv.slice(2);
const items = listOurItems().filter((it) => (only.length ? only.includes(it.name) : true));
if (!items.length) { console.log("no matching items"); process.exit(0); }

let failed = 0;
for (const it of items) {
  const host = tmpHost();
  try {
    buildHost({ name: it.name, dir: it.dir, manifest: it.manifest, outDir: host });
    let raw = "";
    try {
      raw = execSync(`npx --yes hyperframes lint ${JSON.stringify(host)} --json`, { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    } catch (e) { raw = e.stdout || ""; }
    let findings = [];
    try {
      const j = JSON.parse(raw || "{}");
      findings = (j.findings || j.errors || j || []).map((f) => (typeof f === "string" ? { rule: f, severity: "error", message: f } : f));
    } catch { console.log(`  ${it.name}: lint 输出不可解析\n${raw.slice(0, 400)}`); failed++; continue; }
    const relevant = findings.filter((f) => !STANDALONE_ONLY.has(f.rule || f.id || ""));
    const errs = relevant.filter((f) => (f.severity || f.level) === "error" || f.level == null);
    if (errs.length) {
      failed++;
      console.log(`✗ ${it.name}`);
      for (const f of errs) console.log(`    ${f.rule || f.id}: ${f.message || ""} ${f.file ? `(${f.file}${f.line ? ":" + f.line : ""})` : ""}`);
    } else {
      console.log(`✓ ${it.name} — lint clean`);
    }
  } finally {
    cleanup(host);
  }
}
process.exit(failed ? 1 : 0);
