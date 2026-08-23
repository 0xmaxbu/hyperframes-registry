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
以素材(image)本身为画面主体的编排手法,分两支:多素材空间编排(page-turn)与单素材切分重组(card-dance、sliding-stripes、kaleidoscope、highlight-zoom)。与算法生成图案类背景(bg-matrix/bg-particles 等)的分界即在于画面主体是否为素材本体。全部以背景块形态交付;当前整体处于 needs-optimization(未入 registry 索引)。原计划的 9 种 expand.mjs 移植(drop-stack 等)已取消,不再属于本域。
_Avoid_: 素材类、堆叠 preset、"2-3 张卡片编排"(覆盖不了单图切分一支)

**文字编排块 (text block)**:
`text-` 前缀的内容块(前景,无 scrim/dim):CJK 优先的文字动效家族。分词主轴 = `Intl.Segmenter` 真分词(中文按词、英文按词、数字整组),可切字级;官方 72 条文字家族只有 word(空格)/char 二选一,中文逐词全失效——这是本族的存在理由。强调词用内联 `*强调*` 标记。
_Avoid_: 把它当背景块、用空格分词

**叙事规则 (narrative rule)**:
没有视觉形态的编排知识(Murch 剪辑律动、Progressive Disclosure、Narrative Genres)。不属于 registry,将来写进视频工作流的 SKILL 引导。
_Avoid_: 称其为手法或 preset

**双比例条目 (aspect twin)**:
同一视觉算法的横屏(1920×1080)与竖屏(1080×1920)两个 registry 条目,共享一份 DOM 源,由脚本同步生成。**画布自适应**:算法按目标比例完整重排布局(元素数量/密度/构图随 W·H 重算),全画布铺满;**禁止**从横屏渲染画面裁切出竖屏。
_Avoid_: 竖屏副本(手改的)、裁切式竖屏

**scrim / dim**:
背景块的两个可调变量——`scrim` 为文字可读性加的渐变遮罩强度,`dim` 为整体降亮/降饱和程度。二者是"背景化"与"内容块"的分界。
_Avoid_: 遮罩层(泛指时)
