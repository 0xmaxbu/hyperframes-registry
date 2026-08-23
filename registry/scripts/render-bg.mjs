// render-bg.mjs —— 渲染单个背景块的验收件(横屏或 -portrait 竖屏)
//
// 一次性宿主 + 非默认变量(验收要看可配置性)→ hyperframes render → renders/<name>.mp4。
// renders/ 已 gitignore;产物仅供 Max 人工看片。
//
// 用法: node registry/scripts/render-bg.mjs bg-matrix [bg-aurora ...]

import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { buildHost, cleanup, listOurItems, repoRoot, tmpHost } from "./lib-host.mjs";

// 每块的非默认验收变量 + 宿主时长(约 2×LOOP_CYCLE + 富余;一次性类按 scene_dur)
const ACCEPT = {
  "bg-matrix":       { dur: 18, vars: { charset: "zh", density: 120, color: "#7dd3fc", scrim: 0.2, dim: 0.2 } },
  "bg-data-stream":  { dur: 18, vars: { charset: "digits", density: 70, color: "#a3e635", scrim: 0.2 } },
  "bg-glitch":       { dur: 12, vars: { text: "SYSTEM BREACH", color: "#f43f5e", scrim: 0.15 } },
  "bg-aurora":       { dur: 22, vars: { colors: "#0ea5e9,#a855f7,#f97316", density: 7, base: "dark", scrim: 0.25 } },
  "bg-bauhaus":      { dur: 26, vars: { colors: "#7c5fc4,#3b6fb5,#ffffff,#e8746b", density: 1.4, base: "light" } },
  "bg-particles":    { dur: 26, vars: { colors: "#f472b6,#facc15", density: 130, link_distance: 140, scrim: 0.2 } },
  "bg-image":        { dur: 15, vars: { move: "pan-right", max_zoom: 1.25, scrim: 0.45, dim: 0.3, scene_dur: 15 } },
  "bg-video":        { dur: 15, vars: { move: "push-in", max_zoom: 1.2, scrim: 0.4, dim: 0.25, scene_dur: 15 } },
};
for (const k of Object.keys(ACCEPT)) ACCEPT[k + "-portrait"] = ACCEPT[k];

const names = process.argv.slice(2);
if (!names.length) { console.log("用法: node registry/scripts/render-bg.mjs <name> [name...]"); process.exit(1); }
const all = listOurItems();
let failed = 0;
for (const name of names) {
  const it = all.find((x) => x.name === name);
  if (!it) { console.log(`✗ ${name}: 未找到`); failed++; continue; }
  const acc = ACCEPT[name] || { dur: Math.min(it.manifest.duration, 20), vars: {} };
  const host = tmpHost();
  try {
    buildHost({ name: it.name, dir: it.dir, manifest: it.manifest, vars: acc.vars, dur: acc.dur, outDir: host });
    const outDir = join(repoRoot, "renders");
    mkdirSync(outDir, { recursive: true });
    const out = join(outDir, `${name}.mp4`);
    execSync(`npx --yes hyperframes render ${JSON.stringify(host)} -o ${JSON.stringify(out)}`, { cwd: repoRoot, encoding: "utf8", stdio: "inherit" });
    console.log(`✓ ${name} → renders/${name}.mp4`);
  } catch (e) {
    failed++; console.log(`✗ ${name}: render 失败`);
  } finally {
    cleanup(host);
  }
}
process.exit(failed ? 1 : 0);
