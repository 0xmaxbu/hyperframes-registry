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
| 我们 | `preset-sequence-layers` / `-portrait` | 逐层翻开卡片(内容块),数据驱动(items/config/accent/ink/surface/bg 变量) |
| 官方 vendored | 381 条(blocks 154 / components 218 / examples 9) | 原样拷贝,勿手改;重跑 vendor 即覆盖同步 |

v1 规划(阶段 1-3):`bg-image/video/matrix/particles/aurora/bauhaus/data-stream/glitch` + 14 个素材堆叠背景块,全部横竖双比例。见 issue #1。

## 脚本

```bash
npm run vendor:official   # 同步官方 registry(官方更新唯一入口;冲突时我们的条目优先)
npm run gen:registry      # 扫 registry/{blocks,components,examples} → registry.json(勿手改)
npm run sync:portrait     # 横屏规范源 → 竖屏孪生块(改横屏后必跑,勿手改竖屏)
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
