# Toolhub 管理台

这是一个可扩展的 Vue 3 + Naive UI 多工具箱。管理台提供总览、可搜索/筛选的工具目录和独立的工具入口卡片。新增工具时将页面加入 `vite.config.js` 的多页面入口，并在 `src/dashboard/App.vue` 的 `tools` 清单登记工具名称、简介、分类、图标和子页面链接。

## 开发

```bash
npm ci
npm run dev
```

## 测试与构建

```bash
npm test
npm run build
```

Vite 将管理台和工具页面构建到 `dist/`。`GITHUB_ACTIONS` 环境开启时自动使用 Pages 仓库子路径 `/toolhub/`。GitHub Actions 在每次推送 `main` 后执行安装、测试、构建并部署 Pages。

## 现有工具

- **音频匹配与编辑**：位于 [`tools/audio-match-editor/`](tools/audio-match-editor/)，离线导入本地音频、匹配片段、编辑并导出 WAV。
