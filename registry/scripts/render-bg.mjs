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
  "bg-matrix":       { dur: 18, vars: { charset: "katakana", density: 260, scrim: 0.15, dim: 0.1 } },
  "bg-data-stream":  { dur: 18, vars: { charset: "digits", density: 220, color: "#a3e635", scrim: 0.15 } },
  "bg-glitch":       { dur: 12, vars: { text: "SYSTEM BREACH", color: "#f43f5e", scrim: 0.15 } },
  "bg-bauhaus":      { dur: 26, vars: { colors: "#7c5fc4,#3b6fb5,#ffffff,#e8746b", density: 1.4, base: "light" } },
  "bg-particles":    { dur: 26, vars: { colors: "#f472b6,#facc15", density: 130, link_distance: 140, scrim: 0.2 } },
  "bg-image":        { dur: 15, vars: { move: "pan-right", max_zoom: 1.25, scrim: 0.45, dim: 0.3, scene_dur: 15 } },
  "bg-video":        { dur: 15, vars: { move: "push-in", max_zoom: 1.2, scrim: 0.4, dim: 0.25, scene_dur: 15 } },
  "bg-page-turn":    { dur: 15, vars: { turn_dur: 2.0, dwell: 1.0, scrim: 0.45, dim: 0.15, scene_dur: 15 } },
  "bg-card-dance":   { dur: 18, vars: { wave_amp: 0.7, wave_speed: 1.5, gap: 3, angle: "0", scrim: 0.3 } },
  "bg-sliding-stripes": { dur: 16, vars: { stripes: 18, speed: 2, max_shift: 200, scrim: 0.3 } },
  "bg-kaleidoscope":  { dur: 18, vars: { segments: 10, speed: 1, breathe: 0.8, center_scale: 1.15, scrim: 0.3 } },
  "bg-highlight-zoom": { dur: 15, vars: { focuses: "0.25,0.35;0.75,0.6;0.5,0.8", zoom: 3.0, dip: 0.8, drift: 8, scrim: 0.4, scene_dur: 15 } },
  "text-word-stagger": { dur: 8, vars: { text: "用户增长的本质是 *复购率*", unit: "word", direction: "up", accent: "#f472b6", font_size: 92 } },
  "text-center-burst": { dur: 8, vars: { text: "效率提升 *三倍*", scatter: 360, accent: "#fbbf24", font_size: 110 } },
  "text-word-echo":   { dur: 8, vars: { text: "第二曲线", echoes: 5, spread: 26, accent: "#f97316", font_size: 150 } },
  "text-bar-escort":  { dur: 8, vars: { text: "智能驾驶元年\\n*激光雷达* 降本 70%", accent: "#38bdf8", font_size: 76 } },
  "text-focus-cycle": { dur: 14, vars: { accent: "#34d399", font_size: 96 } },
  "text-fold-swap":   { dur: 9, vars: { text_a: "人口红利见顶", text_b: "*人才红利* 接棒", accent: "#f472b6", font_size: 96 } },
  "text-masked-reveal": { dur: 8, vars: { text: "供应链 *全链路* 重构", direction: "left", accent: "#38bdf8", font_size: 88 } },
  "text-line-cascade":  { dur: 9, vars: { text: "三个信号同时出现\\n*拐点*得到确认\\n仓位管理是核心", accent: "#f472b6", font_size: 72 } },
  "text-bpm-bounce":    { dur: 12, vars: { text: "稳 增 长 提 质 增 效", bpm: 132, accent: "#f97316", font_size: 104 } },
  "text-flip-3d":       { dur: 8, vars: { text: "新品 *全球首发*", axis: "y", alternate: "on", accent: "#34d399", font_size: 96 } },
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
