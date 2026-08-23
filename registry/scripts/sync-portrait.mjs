// sync-portrait.mjs —— 从横屏规范源生成竖屏孪生块(通用,覆盖我们全部条目)
//
// 双比例共享一份 DOM + JS(画布自适应:算法按根实际 W×H 重排,禁裁切)。
// 孪生条目与横屏源的唯一差异 = 根 data-composition-id / __timelines 键 / 尺寸互换 / 命名与 tags。
// 改横屏源后必须重跑本脚本;勿手改竖屏副本(重跑即覆盖)。
//
// 用法: node registry/scripts/sync-portrait.mjs [name...]   # 不传 = 全部横屏条目
// 幂等: 重复运行输出相同文件。

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const blocksRoot = join(here, "..", "blocks");

const only = new Set(process.argv.slice(2));

function isOurs(name) { return name.startsWith("bg-") || name.startsWith("preset-") || name.startsWith("text-"); }

let names;
try { names = readdirSync(blocksRoot, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort(); }
catch { names = []; }

let generated = 0, skipped = 0;
for (const name of names) {
  if (!isOurs(name) || name.endsWith("-portrait")) continue;
  if (only.size && !only.has(name)) continue;
  const srcDir = join(blocksRoot, name);
  const manifest = JSON.parse(readFileSync(join(srcDir, "registry-item.json"), "utf8"));
  const W = manifest.dimensions?.width, H = manifest.dimensions?.height;
  if (!W || !H) { console.log(`- ${name}: 无 dimensions,跳过`); skipped++; continue; }
  if (W <= H) { console.log(`- ${name}: 非横屏源,跳过`); skipped++; continue; }
  const htmlFile = join(srcDir, `${name}.html`);
  if (!existsSync(htmlFile)) { console.log(`- ${name}: 无 ${name}.html,跳过`); skipped++; continue; }

  const twin = `${name}-portrait`;
  const outDir = join(blocksRoot, twin);
  mkdirSync(outDir, { recursive: true });

  // HTML:身份/尺寸互换(值替换,不依赖源文件缩进格式);clientWidth 回退字面量保持(真实渲染读实际尺寸)
  const html = readFileSync(htmlFile, "utf8");
  const portraitHtml = html
    .replace(`data-composition-id="${name}"`, `data-composition-id="${twin}"`)
    .replace(`__timelines["${name}"]`, `__timelines["${twin}"]`)
    .replace(`data-width="${W}"`, `data-width="${H}"`)
    .replace(`data-height="${H}"`, `data-height="${W}"`)
    .replace(`width: ${W}px`, `width: ${H}px`)
    .replace(`height: ${H}px`, `height: ${W}px`)
    .replace(`<title>${name}</title>`, `<title>${twin}</title>`);
  writeFileSync(join(outDir, `${twin}.html`), portraitHtml);

  // registry-item.json:命名/标题/尺寸/tags/files;其余原样
  const twinManifest = JSON.parse(JSON.stringify(manifest));
  twinManifest.name = twin;
  twinManifest.title = `${manifest.title} (portrait 9:16)`;
  twinManifest.dimensions = { width: H, height: W };
  twinManifest.tags = (manifest.tags || []).map((t) => (t === "landscape" ? "portrait" : t));
  twinManifest.files = manifest.files.map((f) =>
    f.path === `${name}.html`
      ? { ...f, path: `${twin}.html`, target: `compositions/${twin}.html` }
      : f,
  );
  writeFileSync(join(outDir, "registry-item.json"), JSON.stringify(twinManifest, null, 2) + "\n");

  // 素材目录原样拷(占位资源同内容,安装落点相同,幂等)
  if (existsSync(join(srcDir, "assets"))) cpSync(join(srcDir, "assets"), join(outDir, "assets"), { recursive: true });

  generated++;
  console.log(`✓ ${name} → ${twin}`);
}
console.log(`完成:${generated} 生成,${skipped} 跳过`);
