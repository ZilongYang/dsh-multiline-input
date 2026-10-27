# Changelog

## 0.1.0 — 2026-10-28

首个公开发布版本：[npm](https://www.npmjs.com/package/dsh-multiline-input) · [GitHub Release](https://github.com/ZilongYang/dsh-multiline-input/releases/tag/v0.1.0) · [市场 PR #9938](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/9938)（条目校验已过，等仓库满 24h 自动合并门槛）。

- 对话输入框单行 / 多行双态切换，模式按设备持久化。
- 通过 DSH 官方快捷键服务注册 `multiline-input.toggle`：桌面默认 `Cmd+E`（macOS）/ `Ctrl+E`（Windows / Linux），可在「设置 → 通用 → 快捷键」改绑、恢复默认、查看冲突。
- 输入框上沿常驻 tab 提示（与卡片同底色、底部淡分割线）：实时显示当前生效键位与目标模式；点击可切换。
- 多行模式最小高度 4 行，内容变多自动长高（沿用 DSH 的 336px 滚动上限）。
- 多行模式 Enter 换行、Shift+Enter 发送；`Cmd/Ctrl+Enter`、斜杠 / 引用菜单、输入法组合态保持原有语义。
- 卸载 / 禁用后恢复原生输入框，无 DOM、样式、监听残留。
- 市场素材：`screenshots.json` + `assets/` 两张截图（1360 宽）。
