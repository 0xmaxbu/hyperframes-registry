// verify.mjs —— 我们的每个 block:宿主挂载 → hyperframes snapshot 抽帧 → 三判据
//
// 判据照抄旧 backgrounds/verify.mjs(机制换成 hyperframes snapshot):
//   1. 非黑屏 — 循环段采样 max luma ≥ 30(判 max 非 avg)
//   2. 在动   — 4 非对称相位截图字节去重 ≥ 3 种
//   3. 无缝   — seek(0.5·LC) vs seek(1.5·LC) 的 {max, meanLuma, brightRatio} 相对差 < 8%/8%/12%
// LOOP_CYCLE 表来自移植源;LC=0(非循环)→ seamless N/A。
//
// 用法: node registry/scripts/verify.mjs [name...]

import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { inflateSync } from "node:zlib";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildHost, cleanup, listOurItems, repoRoot, tmpHost } from "./lib-host.mjs";

const LOOP_CYCLE = {
  "bg-matrix": 8, "bg-matrix-portrait": 8,
  "bg-data-stream": 8, "bg-data-stream-portrait": 8,
  "bg-glitch": 4, "bg-glitch-portrait": 4,
  "bg-bauhaus": 12, "bg-bauhaus-portrait": 12,
  "bg-particles": 12, "bg-particles-portrait": 12,
  "bg-image": 0, "bg-image-portrait": 0,
  "bg-video": 0, "bg-video-portrait": 0,
};

// ---- 极简 PNG 统计解码(8-bit, color type 2/6, 非交错):返回 {max, meanLuma, brightRatio} ----
function pngStats(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not png");
  let off = 8, w = 0, h = 0, colorType = 0, idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); colorType = data[9]; }
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    off += 12 + len;
  }
  const bpp = colorType === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  const px = Buffer.alloc(stride);
  let max = 0, sum = 0, bright = 0, n = 0;
  const step = Math.max(1, Math.floor(w / 480));   // 采样降速:统计不需要全像素
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[x - bpp] : 0, b = y > 0 ? px[x] : 0, c = y > 0 && x >= bpp ? px[x - bpp] : 0;
      let v = line[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += Math.floor((a + b) / 2);
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      px[x] = v;
    }
    for (let x = 0; x < w; x += step) {
      const r = px[x * bpp], g = px[x * bpp + 1], b = px[x * bpp + 2];
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (l > max) max = l; sum += l; if (l >= 200) bright++; n++;
    }
  }
  return { max: Math.round(max), meanLuma: +(sum / n).toFixed(2), brightRatio: +(bright / n).toFixed(5) };
}

function relDiff(a, b) { return Math.abs(a - b) / Math.max(1e-9, Math.max(Math.abs(a), Math.abs(b))); }

const only = process.argv.slice(2);
const items = listOurItems().filter((it) => it.typeDir === "blocks" && (only.length ? only.includes(it.name) : true));
if (!items.length) { console.log("no matching items"); process.exit(0); }

let failed = 0;
for (const it of items) {
  const lc = LOOP_CYCLE[it.name] ?? 0;
  const dur = it.manifest.duration;
  const host = tmpHost();
  try {
    buildHost({ name: it.name, dir: it.dir, manifest: it.manifest, outDir: host });
    const loopAt = [0.25, 0.5, 0.75, 0.95].map((k) => +(k * dur).toFixed(2));
    // 在动采样须相位分散:时长是 LC 整数倍时,按 dur 的等分取样会混叠到同一相位
    // 相位 0.13/0.46/0.79 跨圈循环取点(LC 大时单圈放不满 3 个)直到取满 4 个或到达 dur
    // "在动"判据只适用循环块(LC>0):一次性块(ken-burns/入场后驻留)静止是正确行为,由人工验收件覆盖
    const animAt = [];
    if (lc > 0) {
      for (let n = 0; animAt.length < 4; n++) {
        let added = false;
        for (const f of [0.13, 0.46, 0.79]) {
          const t = +((n + f) * lc).toFixed(2);
          if (t < dur - 0.01) { animAt.push(t); added = true; if (animAt.length >= 4) break; }
        }
        if (!added) break;
      }
    }
    const seamAt = lc > 0 ? [+(0.5 * lc).toFixed(2), +(1.5 * lc).toFixed(2)] : [];
    const times = [...new Set([...loopAt, ...animAt, ...seamAt])].sort((a, b) => a - b)
      .filter((t) => t < dur);
    const snapDir = join(host, "snaps");
    execSync(`npx --yes hyperframes snapshot ${JSON.stringify(host)} --at "${times.join(",")}" --no-end -o ${JSON.stringify(snapDir)}`, { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    const pngs = readdirSync(snapDir).filter((f) => f.endsWith(".png")).sort();
    if (pngs.length !== times.length) { console.log(`✗ ${it.name}: snapshot 帧数不符(${pngs.length}/${times.length})`); failed++; continue; }
    const byTime = new Map(times.map((t, i) => [t, readFileSync(join(snapDir, pngs[i]))]));

    const errs = [];
    // 1 非黑屏
    for (const t of loopAt) {
      if (t >= dur) continue;
      const s = pngStats(byTime.get(t));
      if (s.max < 30) errs.push(`非黑屏@${t}s: max=${s.max} < 30`);
    }
    // 2 在动(仅循环块;一次性块 N/A)
    if (lc > 0 && animAt.length) {
      const uniq = new Set(animAt.filter((t) => t < dur).map((t) => createHash("sha1").update(byTime.get(t)).digest("hex")));
      if (uniq.size < 3) errs.push(`在动: 仅 ${uniq.size} 种不同画面`);
    }
    // 3 无缝
    if (lc > 0) {
      const s1 = pngStats(byTime.get(seamAt[0])), s2 = pngStats(byTime.get(seamAt[1]));
      const d = { max: relDiff(s1.max, s2.max), mean: relDiff(s1.meanLuma, s2.meanLuma), br: relDiff(s1.brightRatio, s2.brightRatio) };
      if (d.max >= 0.08 || d.mean >= 0.08 || d.br >= 0.12) errs.push(`无缝: Δmax=${(d.max * 100).toFixed(1)}% Δmean=${(d.mean * 100).toFixed(1)}% Δbright=${(d.br * 100).toFixed(1)}%`);
    }
    if (errs.length) { failed++; console.log(`✗ ${it.name}\n    ${errs.join("\n    ")}`); }
    else console.log(`✓ ${it.name} — 非黑${lc > 0 ? `/在动/无缝(LC=${lc}s)` : "(一次性:在动/无缝 N/A,人工验收件覆盖)"}`);
  } catch (e) {
    failed++; console.log(`✗ ${it.name}: ${e.message.split("\n")[0]}`);
  } finally {
    cleanup(host);
  }
}
process.exit(failed ? 1 : 0);
