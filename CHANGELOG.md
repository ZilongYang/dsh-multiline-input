# Changelog

## 0.2.0 — 2026-10-30

面向 DSH **0.2.1-rc.5** 的交互更新（本轮不发布 npm / GitHub / 官网）：

- **tab 可收起**：tab 右侧新增收起按钮，点击后变成输入卡片上沿右对齐的 8px 细线；细线 3px 粗、右侧带淡色向上 chevron，点击热区约 116×20px，hover 有浅色胶囊底与 tooltip，收起状态按设备持久化（`dsh-multiline-input.hint.v1`）。收起后输入区回收约 16px，`Cmd/Ctrl+E` 仍照常切换。
- **记录每轮提交的文字**：提交时立即入历史（排队 / steer 也可马上回看），真正被拒绝的提交（草稿回填、消息未进入会话）撤回本次记录；断网 / 模型失败但消息已进入会话的保留。`/` 命令、空提交、超长条目不入库；设备侧 `localStorage` 全局一份（`dsh-multiline-input.history.v1`），完全相同的文字去重置顶，最多 200 条 / 10 万字符。
- **↑ / ↓ 浏览输入历史**：单行 `↑` / `↓`，多行 `Shift+↑` / `Shift+↓`；首次 `↑` 保存当前草稿，`Esc` 或在新条目上再按 `↓` 还原；浏览时 tab 显示「历史 n/m」；替换走公开的 `inputActions.setDraft`，不直接改 DOM。
- **清空历史命令**：新增未绑定默认键的 `multiline-input.clear-history`，在「设置 → 通用 → 快捷键」自行指定组合。
- **DSH 0.2.1-rc.5 兼容回归**：核对 composer 锚点 / dock 座位 / 布局变量 / Shortcuts 契约，`sending` 相位不拦截；兼容范围改为 `>=0.2.1-rc.5 <0.3.0-0`。
- 测试：`node --test` 28 条全绿（新增历史、浏览、收起、sending 相位用例）。

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
