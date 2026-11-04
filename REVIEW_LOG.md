
## Vue 3 + Naive UI 管理台迁移

- 根入口已改为 Vue 3 + Naive UI 管理后台：左侧菜单、概览、工具目录、搜索、分类筛选、统计卡片、响应式移动端菜单和工具打开入口。
- 工具清单集中在 `src/dashboard/App.vue`，音频工具保持 `tools/audio-match-editor/` 独立多页面；`vite.config.js` 配置管理台和工具页的 Pages 多入口构建。
- Actions 改为 `npm ci && npm run build` 后直接上传 `dist/`，Node 18、package-lock 已固定；GitHub Pages 构建环境自动使用 `/toolhub/` base。
- 验证：纯测试、普通生产构建、`GITHUB_ACTIONS=true` Pages 构建全部通过；真实 Headless Chrome 已挂载管理台并显示工具导航/卡片，无运行时错误。

- 首页改为独立的卡片目录，现有音频应用迁移到 `tools/audio-match-editor/`，由卡片导航进入；未来工具可以继续以 `tools/<id>/` 独立子目录加入。
- Pages workflow 构建后同步发布根首页与工具子目录；README 列出新增工具的三步接入方法。
- 验证：`npm test`、`npm run build` 全通过，确认首页链接和发布路径有效。
