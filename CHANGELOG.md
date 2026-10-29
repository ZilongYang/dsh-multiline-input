# Changelog

## 0.1.1 — 2026-10-29

修复 0.1.0 的 tab 压住输入框上方卡片的问题：[npm](https://www.npmjs.com/package/dsh-multiline-input) · [GitHub Release](https://github.com/ZilongYang/dsh-multiline-input/releases/tag/v0.1.1)

- tab 提示从 `conversation.input.overlay` 浮层改到 `conversation.input.dock` 座位里的一行（`order: 1000`，紧贴输入卡片上方），占 24px 真实布局：不再覆盖目标条（GoalBar）的文案与暂停 / 编辑 / 清除按钮，也不会被待办、队列、额度横条等卡片撞到。
- tab 行按运行时读到的 composer 栈 `row-gap` 自适应（dock 6px / hero 8px），底边始终与卡片上沿齐平，外观与 0.1.0 一致（仍是「卡片肩上的 tab」）。
- 观感变化：输入区比 0.1.0 高约 18px（消息区相应少 18px），composer 上方的 dock 卡片整体上移 24px。
- 测试：新增「tab 座位必须是 `conversation.input.dock`、且 order 排在全部内置条目之后」的断言。

## 0.1.0 — 2026-10-28

首个公开发布版本：[npm](https://www.npmjs.com/package/dsh-multiline-input) · [GitHub Release](https://github.com/ZilongYang/dsh-multiline-input/releases/tag/v0.1.0) · [市场 PR #9938](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/9938)（条目校验已过，等仓库满 24h 自动合并门槛）。

- 对话输入框单行 / 多行双态切换，模式按设备持久化。
- 通过 DSH 官方快捷键服务注册 `multiline-input.toggle`：桌面默认 `Cmd+E`（macOS）/ `Ctrl+E`（Windows / Linux），可在「设置 → 通用 → 快捷键」改绑、恢复默认、查看冲突。
- 输入框上沿常驻 tab 提示（与卡片同底色、底部淡分割线）：实时显示当前生效键位与目标模式；点击可切换。
- 多行模式最小高度 4 行，内容变多自动长高（沿用 DSH 的 336px 滚动上限）。
- 多行模式 Enter 换行、Shift+Enter 发送；`Cmd/Ctrl+Enter`、斜杠 / 引用菜单、输入法组合态保持原有语义。
- 卸载 / 禁用后恢复原生输入框，无 DOM、样式、监听残留。
- 市场素材：`screenshots.json` + `assets/` 两张截图（1360 宽）。
