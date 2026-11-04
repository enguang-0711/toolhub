
## Toolhub 多工具卡片首页

- 首页改为独立的卡片目录，现有音频应用迁移到 `tools/audio-match-editor/`，由卡片导航进入；未来工具可以继续以 `tools/<id>/` 独立子目录加入。
- Pages workflow 构建后同步发布根首页与工具子目录；README 列出新增工具的三步接入方法。
- 验证：`npm test`、`npm run build` 全通过，确认首页链接和发布路径有效。
