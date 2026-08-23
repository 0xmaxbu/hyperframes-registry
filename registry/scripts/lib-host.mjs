// lib-host.mjs —— 验证链共享:为单个 registry block 生成一次性宿主项目
//
// 模式仿官方 scripts/lint-registry-items.mjs:把 item 文件放到 hyperframes add 会放的位置
// (compositions/<name>.html),生成骨架 index.html(根合成 + 底轨挂载 + 哑 clip)。
// lint / verify / render-bg 三个脚本共用。

import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const registryRoot = join(here, "..");
export const repoRoot = join(registryRoot, "..");

// 我们的条目前缀(vendored 官方条目不进我们的验证链)
export function isOurs(name) {
  return name.startsWith("bg-") || name.startsWith("preset-");
}

export function listOurItems() {
  // 返回 [{name, typeDir, dir, manifest}],按 name 排序
  const out = [];
  for (const typeDir of ["blocks", "components"]) {
    const typePath = join(registryRoot, typeDir);
    let names = [];
    try {
      names = readdirSync(typePath, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
    } catch { continue; }
    for (const name of names) {
      if (!isOurs(name)) continue;
      const dir = join(typePath, name);
      try {
        const manifest = JSON.parse(readFileSync(join(dir, "registry-item.json"), "utf8"));
        out.push({ name, typeDir, dir, manifest });
      } catch { /* 无 manifest,跳过 */ }
    }
  }
  return out;
}

export function buildHost({ name, dir, manifest, vars, dur, outDir }) {
  // 复制 item 文件到 manifest.files[].target(add 的落点),写骨架宿主 index.html
  const W = manifest.dimensions.width, H = manifest.dimensions.height;
  const portrait = H > W;
  const hostDur = dur != null ? dur : manifest.duration;
  for (const f of manifest.files) {
    const dst = join(outDir, f.target);
    mkdirSync(dirname(dst), { recursive: true });
    cpSync(join(dir, f.path), dst);
  }
  const varAttr = vars ? ` data-variable-values='${JSON.stringify(vars)}'` : "";
  const html = `<!doctype html>
<html lang="en">
<head><meta charset="UTF-8"/><title>host — ${name}</title></head>
<body>
<div id="stage" data-hf-root data-composition-id="host" data-start="0" data-duration="${hostDur}" data-width="${W}" data-height="${H}">
  <div id="mount-${name}" data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-start="0" data-duration="${hostDur}" data-track-index="0" data-width="${W}" data-height="${H}"${varAttr}></div>
  <div id="drv" class="clip" data-start="0" data-duration="${hostDur}" data-track-index="10" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none"></div>
</div>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<script>
(function(){ "use strict";
  window.__timelines = window.__timelines || {};
  window.__timelines["host"] = gsap.timeline({ paused: true });
})();
</script>
</body>
</html>
`;
  writeFileSync(join(outDir, "index.html"), html);
  return { portrait, W, H, hostDur };
}

export function tmpHost() {
  return mkdtempSync(join(tmpdir(), "hf-item-"));
}

export function cleanup(d) { rmSync(d, { recursive: true, force: true }); }
