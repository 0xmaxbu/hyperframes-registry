# hyperframes-registry

自制 [HyperFrames](https://github.com/heygen-com/hyperframes) **超集 registry** = 官方目录(vendored)+ 我们的背景块。视频项目只需把 `hyperframes.json` 指向本仓库一个地址,官方 captions/transitions/vfx 与我们的 `bg-*` 背景块都能 `add`。

- v1 需求与实现/测试决策:[issue #1](https://github.com/0xmaxbu/hyperframes-registry/issues/1)
- 术语表:[CONTEXT.md](./CONTEXT.md) · 架构决策:[docs/adr/](./docs/adr/)(0001 自包含 block + 官方 variables;0002 超集 vendor)

## 视频项目接入

在视频项目的 `hyperframes.json` 里:

```json
{
  "registry": "https://raw.githubusercontent.com/0xmaxbu/hyperframes-registry/main/registry"
}
```

之后照常发现与安装(查询用英文):

```bash
npx hyperframes catalog --query "seamless aurora background"
npx hyperframes add preset-sequence-layers
```

## 条目

| 来源 | 条目 | 说明 |
|---|---|---|
| 我们 | `bg-image` / `bg-video` / `bg-matrix` / `bg-particles` / `bg-bauhaus` / `bg-data-stream` / `bg-glitch`(各含 `-portrait`) | 背景块:一次性素材类(image/video,ken-burns + scrim)+ 循环算法类(其余,无缝 loop);全屏 track-0,横竖双比例画布自适应(算法重排,非裁切) |
| 我们 | `bg-page-turn` / `bg-card-dance` / `bg-sliding-stripes` / `bg-kaleidoscope` / `bg-highlight-zoom`(各含 `-portrait`) | 素材堆叠类背景(issues #2-6,已验收):线条扫过硬切翻页 / AE 三合一瓦片波浪 / 奇偶反向条带 / 花瓣环绕万花筒 / 多跳焦点推近;条带+瓦片+万花筒无缝 loop,翻页与推近一次性 scene_dur |
| 我们 | `text-word-stagger` / `text-center-burst` / `text-bar-escort` / `text-focus-cycle` / `text-fold-swap` / `text-masked-reveal` / `text-line-cascade` / `text-bpm-bounce` / `text-flip-3d`(各含 `-portrait`) | 文字编排族(issue #7,已验收):**中文优先**(Intl.Segmenter 分词,官方 72 条文字家族只有 word 空格/char,中文逐词全失效);`*词*` 内联强调;循环块 focus-cycle(LC=词数×step)/ bpm-bounce(LC=词数×60/bpm)。text-word-echo 已移除(Max 不取) |
| 搁置 | `bg-aurora` | 暂不实现(11 轮验收未收敛);约束全集与已证死的路见 [docs/deferred/bg-aurora.md](./docs/deferred/bg-aurora.md) |
| 我们 | `preset-sequence-layers` / `-portrait` | 逐层翻开卡片(内容块),数据驱动(items/config/accent/ink/surface/bg 变量) |
| 官方 vendored | 381 条(blocks 154 / components 218 / examples 9) | 原样拷贝,勿手改;重跑 vendor 即覆盖同步 |

阶段 2(9 个 expand.mjs 素材堆叠移植)已取消(2026-08-23 Max 裁定),不做。

## 脚本

```bash
npm run vendor:official   # 同步官方 registry(官方更新唯一入口;冲突时我们的条目优先)
npm run gen:registry      # 扫 registry/{blocks,components,examples} → registry.json(勿手改)
npm run sync:portrait     # 横屏规范源 → 竖屏孪生块(改横屏后必跑,勿手改竖屏)
npm run lint:items        # 我们的每个条目:抛弃式宿主 + 官方 lint
npm run verify            # 我们的每个 block:挂载 → snapshot 抽帧 → 非黑/在动/无缝三判据
npm run render:bg -- <name>...   # 渲染验收件到 renders/(gitignored,人工看片)
npm run check:landscape   # examples 16:9 宿主 hyperframes check
npm run check:portrait    # examples 9:16 宿主 hyperframes check
```

## 约定

- 自制条目命名:`bg-`(背景块)/ `preset-`(内容块)+ `-portrait` 竖屏孪生;统一 tag:`background`(背景块族)。
- **元数据(name/title/description/tags)全英文**——`catalog --query` 仅英文有效;中文写在仓库文档。
- 变量走官方机制(`<html data-composition-variables>` 声明 / 宿主 `data-variable-values` 覆盖);数组/对象用 string + init 解析,不用 json 类型(ADR-0001)。
- 确定性铁律:paused timeline、字面量 id 注册 `window.__timelines`、无 `Math.random`/`Date.now`、repeat 有限。
- 新增 block:`registry/blocks/<name>/{<name>.html, registry-item.json}` → `gen:registry` → examples 挂载验证 `check` + `render`。

## 目录

```
registry/
├── registry.json            # 顶层索引(gen:registry 生成)
├── .vendor-meta.json        # 官方同步元信息(catalogArtifact 透传源)
├── blocks/ components/ examples/   # 我们的 + vendored 条目混居
└── scripts/                 # vendor / gen / sync-portrait
examples/                    # 横竖宿主(check/render 验证)
demos/                       # 单手法 demo 预览页
docs/adr/                    # 架构决策记录
```
