# hyperframes-registry

我们自维护的 HyperFrames registry:把动画叙事项目的背景与素材堆叠手法做成可安装的 block,让 Agent 在 HyperFrames 创作时自动发现并复用。

## Language

**背景块 (background block)**:
`bg-` 前缀的 block,铺满画布、挂载在底层轨道、供文字压顶使用。带 `scrim`/`dim` 变量保证文字可读。
_Avoid_: 背景 preset、background helper、背景组件

**内容块 (content block)**:
`preset-` 前缀的 block,作为画面主体的前景叙事单元(如 `preset-sequence-layers`)。
_Avoid_: 前景 preset

**素材堆叠类 (material-stack family)**:
以 2-3 张素材卡片的空间编排构成运动的 14 种手法:9 种已有确定性实现(drop-stack、card-fan、sequence-layers、photo-cascade、hanging-polaroids、domino、pip-grid、scatter、flat-carousel)+ 5 种待实现(card-dance、sliding-stripes、kaleidoscope、page-turn、highlight-zoom)。v1 中全部以背景块形态交付。
_Avoid_: 素材类、堆叠 preset

**叙事规则 (narrative rule)**:
没有视觉形态的编排知识(Murch 剪辑律动、Progressive Disclosure、Narrative Genres)。不属于 registry,将来写进视频工作流的 SKILL 引导。
_Avoid_: 称其为手法或 preset

**双比例条目 (aspect twin)**:
同一视觉算法的横屏(1920×1080)与竖屏(1080×1920)两个 registry 条目,共享一份 DOM 源,由脚本同步生成。**画布自适应**:算法按目标比例完整重排布局(元素数量/密度/构图随 W·H 重算),全画布铺满;**禁止**从横屏渲染画面裁切出竖屏。
_Avoid_: 竖屏副本(手改的)、裁切式竖屏

**scrim / dim**:
背景块的两个可调变量——`scrim` 为文字可读性加的渐变遮罩强度,`dim` 为整体降亮/降饱和程度。二者是"背景化"与"内容块"的分界。
_Avoid_: 遮罩层(泛指时)
