# Registry item = 自包含 block + 官方 variables 注入,不导出 create()

动画叙事项目的 dev 副本(hyperframes-registry-dev)原 M4 计划把背景做成 component、导出 `create(container, params, tl, sceneDur)` helper 让宿主接线——即旧 preset 管线的延续。v1 决定:全部 22 个条目(8 个移植背景 + 14 个素材堆叠背景)做成**自包含 block**,数据经 HyperFrames 官方 variables 机制注入(`<html data-composition-variables>` 声明 + 宿主 `data-variable-values` 覆盖 + `getVariables()` 初始化读取),媒体播放归框架托管。理由:`add` → 贴 snippet → 传变量即用,宿主 Agent 零代码;官方机制向前兼容,旧 helper 管线(PRESET-CONTRACT、expand.mjs 消费链)不再进入本仓库。

## Considered Options

- **component + create() 导出**(dev 副本 M4 原计划)——每次使用都要求宿主写 timeline 代码,Agent 出错面大;抛弃。
- **`json` 类型变量传复杂数据**(dev 副本 sequence-layers 现状,今天能跑)——官方类型系统只有 `string/number/color/boolean/enum/font/image`,畸形声明被 parser 静默丢弃,CLI 收紧即碎;改为官方先例(bar-chart-race)的**多行 string + init 解析**。

## Consequences

- video 背景从"手动 seek `video.currentTime`"改为框架托管媒体(`data-media-start`/`data-playback-rate`),运镜动 wrapper transform——效果一致,机制全换。
- 宿主 `data-duration` 超过 block 内时长**停末帧不循环**:一次性动效(ken-burns、素材堆叠入场)通过 `scene_dur` 变量让宿主声明计划时长,block 按它铺满运动;循环类背景靠无缝循环,任意裁剪安全。
- intro 留 block 内(number 变量),outro 交给宿主(对挂载 div fade opacity,各 item 的 usage 注释给出示例)。
