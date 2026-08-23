// vendor-official-registry.mjs —— 把官方 registry 超集进本仓库(ADR-0002)
//
// 下载 heygen-com/hyperframes main 分支 tarball,提取 registry/{blocks,components,examples}
// 的 item 目录拷入本仓库 registry/ 同名目录(已存在的目录跳过 = 我们的条目优先),
// 并把官方 registry.json 的 catalogArtifact 等元信息存入 registry/.vendor-meta.json,
// 供 generate-registry-items.mjs 透传(on-device 语义检索依赖该工件)。
//
// 用法: node registry/scripts/vendor-official-registry.mjs
// 同步官方更新的唯一入口;勿手改 vendored 条目(重跑即被覆盖)。

import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const TARBALL_URL = "https://codeload.github.com/heygen-com/hyperframes/tar.gz/refs/heads/main";
const here = new URL(".", import.meta.url).pathname;
const registryRoot = join(here, "..");

const tmp = mkdtempSync(join(tmpdir(), "hf-vendor-"));
try {
  // 1) 下载 + 解包
  const tarPath = join(tmp, "official.tar.gz");
  execSync(`curl -fsSL "${TARBALL_URL}" -o "${tarPath}"`);
  execSync(`tar -xzf "${tarPath}" -C "${tmp}"`);
  const top = readdirSync(tmp).find((d) => d !== "official.tar.gz" && !d.startsWith("."));
  if (!top) throw new Error("tarball 解包后找不到顶层目录");
  const officialRegistry = join(tmp, top, "registry");
  if (!existsSync(officialRegistry)) throw new Error(`tarball 中无 registry/ 目录: ${officialRegistry}`);

  // 2) 拷贝 item 目录(已存在 = 我们的条目,跳过并告警)
  let copied = 0;
  const skipped = [];
  for (const typeDir of ["blocks", "components", "examples"]) {
    const srcDir = join(officialRegistry, typeDir);
    if (!existsSync(srcDir)) continue;
    for (const name of readdirSync(srcDir)) {
      const src = join(srcDir, name);
      const dst = join(registryRoot, typeDir, name);
      if (existsSync(dst)) {
        skipped.push(`${typeDir}/${name}`);
        continue;
      }
      mkdirSync(join(registryRoot, typeDir), { recursive: true });
      cpSync(src, dst, { recursive: true });
      copied++;
    }
  }

  // 3) 官方 manifest 元信息 → .vendor-meta.json(catalogArtifact 是 on-device 检索工件标识)
  const officialManifest = JSON.parse(readFileSync(join(officialRegistry, "registry.json"), "utf8"));
  const meta = {
    source: "heygen-com/hyperframes@main",
    officialItemCount: officialManifest.items.length,
    catalogArtifact: officialManifest.catalogArtifact ?? null,
    vendoredAt: new Date().toISOString(),
    copiedItems: copied,
    skippedOurs: skipped,
  };
  writeFileSync(join(registryRoot, ".vendor-meta.json"), JSON.stringify(meta, null, 2) + "\n");

  console.log(`✓ vendored ${copied} official items (skipped ${skipped.length} ours: ${skipped.join(", ") || "—"})`);
  console.log(`✓ wrote registry/.vendor-meta.json (official items: ${meta.officialItemCount}, catalogArtifact: ${meta.catalogArtifact?.revision?.slice(0, 12) ?? "none"})`);
  console.log("→ 接着运行: node registry/scripts/generate-registry-items.mjs");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
