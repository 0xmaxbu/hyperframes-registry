// sync-portrait.mjs —— 从 landscape 规范源生成竖屏孪生块
//
// sequence-layers 双比例共享一份 DOM + JS if 分支（读 data-width/data-height 排布）。
// 两个 registry 条目唯一差异 = 根 div 的 data-composition-id + data-width/data-height。
// 本脚本从 preset-sequence-layers.html 生成 preset-sequence-layers-portrait.html，
// 保证孪生文件永不漂移。改 landscape 源后运行 `npm run sync:portrait`。
//
// 用法: node scripts/sync-portrait.mjs
// 幂等: 重复运行输出相同文件。

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, "..", "blocks", "preset-sequence-layers");
const srcFile = join(srcDir, "preset-sequence-layers.html");
const outFile = join(here, "..", "blocks", "preset-sequence-layers-portrait", "preset-sequence-layers-portrait.html");

const html = readFileSync(srcFile, "utf8");

const portrait = html
  .replace(
    'data-composition-id="preset-sequence-layers"',
    'data-composition-id="preset-sequence-layers-portrait"',
  )
  .replace(
    '__timelines["preset-sequence-layers"]',
    '__timelines["preset-sequence-layers-portrait"]',
  )
  .replace(
    'data-width="1920"\n        data-height="1080"',
    'data-width="1080"\n        data-height="1920"',
  )
  .replace(/<title>preset-sequence-layers<\/title>/, "<title>preset-sequence-layers-portrait</title>");

writeFileSync(outFile, portrait);
console.log(`✓ wrote ${outFile}`);
