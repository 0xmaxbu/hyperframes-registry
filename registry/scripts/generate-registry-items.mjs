// generate-registry-items.mjs —— 扫描 registry/blocks + registry/components → 顶层 registry.json
//
// 仿官方 generate-registry-items(https://github.com/heygen-com/hyperframes/blob/main/scripts/generate-registry-items.ts)：
// 逐 registry-item.json 收集 {name, type} 写入顶层 registry.json（勿手改）。
//
// 用法: node scripts/generate-registry-items.mjs
// 幂等: 重复运行输出相同文件（目录顺序稳定排序）。

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const registryRoot = join(here, "..");

const items = [];
for (const typeDir of ["blocks", "components", "examples"]) {
  const typePath = join(registryRoot, typeDir);
  let names = [];
  try {
    names = readdirSync(typePath, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
  } catch {
    continue; // 目录尚不存在（批次未开始）
  }
  for (const name of names) {
    const manifestPath = join(typePath, name, "registry-item.json");
    let manifest;
    try {
      manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    } catch {
      console.warn(`skip ${typeDir}/${name}: no readable registry-item.json`);
      continue;
    }
    items.push({ name: manifest.name, type: manifest.type });
  }
}

const registry = {
  $schema: "https://hyperframes.heygen.com/schema/registry.json",
  name: "hyperframes-registry",
  homepage: "https://github.com/0xmaxbu/hyperframes-registry",
  items,
};

// 超集(ADR-0002):透传官方 catalogArtifact(on-device 语义检索工件标识),
// 来自 vendor-official-registry.mjs 写入的 .vendor-meta.json。
const vendorMetaPath = join(registryRoot, ".vendor-meta.json");
if (existsSync(vendorMetaPath)) {
  const meta = JSON.parse(readFileSync(vendorMetaPath, "utf8"));
  if (meta.catalogArtifact) registry.catalogArtifact = meta.catalogArtifact;
}

const out = join(registryRoot, "registry.json");
writeFileSync(out, JSON.stringify(registry, null, 2) + "\n");
console.log(`✓ wrote ${out} (${items.length} items)`);
