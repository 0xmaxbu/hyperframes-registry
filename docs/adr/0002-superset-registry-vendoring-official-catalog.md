# 超集 registry:vendor 官方目录,合并为单一 registry.json

hyperframes.json 的 `registry` 是单字符串,无多 registry 支持:项目指向我们即看不到官方 381 个 item,反之亦然。决定:本仓库做成**超集**——脚本把官方 `heygen-com/hyperframes` 的 `registry/` 目录整体 vendor 进来,与我们的条目合并生成同一份 registry.json;视频项目只需指向本仓库一个地址,官方与自制 item 都可安装。官方更新靠定期重跑同步脚本。

## Considered Options

- **纯我们的 registry**——零成本,但用我们背景的项目失去官方 captions/transitions/vfx,Agent 只能手写;抛弃。
- **仅靠向官方提 PR 合流**——节奏不受我们控制,合并前不可用;作为长期补充,不解决当下。

## Consequences

- 仓库里有一份官方 registry 的 vendored 拷贝(这是有意的,不是误提交);同步脚本是官方更新的唯一入口,勿手改 vendored 文件。
- 我们对官方 item 不做任何修改;上游变更以同步脚本整体覆盖。
