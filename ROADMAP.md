# ROADMAP

## 0.1.0（2026-10-28 已发布）

- [x] 单行 / 多行双态切换，模式按设备持久化（`localStorage`）
- [x] 官方快捷键命令（`multiline-input.toggle`；macOS `Cmd+E`，Windows / Linux `Ctrl+E`，可在设置中改绑）
- [x] 输入框上沿常驻 tab 提示（同底色、实时显示当前生效键位与目标模式，可点击切换）
- [x] 多行模式 4 行起高，随内容长高，沿用 DSH 336px 滚动上限
- [x] 多行模式 Enter 换行 / Shift+Enter 发送，保留撤销、输入法、菜单、busy-enter 语义
- [x] 与 composer 其它输入框、设置弹窗、斜杠菜单互不干扰
- [x] 单元测试（`node --test`）与静态检查
- [x] 发布：npm 0.1.0、GitHub Release `v0.1.0`、awesome-dsh-plugin PR #9938（等仓库满 24h 自动过门槛）

## 0.1.1（2026-10-29 已发布，布局修复）

- [x] tab 提示从 `conversation.input.overlay` 浮层改到 `conversation.input.dock` 独立一行（`order: 1000`，紧贴卡片上方）：不再压住目标条文案与暂停 / 编辑 / 清除按钮，也不会被以后新增的 composer 卡片覆盖
- [x] tab 行按运行时读到的栈 `row-gap` 自适应（dock 6px / hero 8px），底边始终与卡片上沿齐平
- [x] 子龙刷新后确认观感（目标条三个图标完整可见可点、tab 仍在卡片肩上）
- [x] 发布：版本号 `0.1.1`、CHANGELOG、`npm publish`、GitHub Release `v0.1.1`，清单见 [docs/RELEASE-CHECKLIST-0.1.1.md](docs/RELEASE-CHECKLIST-0.1.1.md)

## 0.2.0（2026-10-30 开发完成，待实机验收）

- [x] **tab 可收起**：tab 右侧收起按钮 → 输入框上沿右对齐的 8px 细线（在流内，收起后输入区回收约 16px）；点击细线恢复；按设备持久化；`Cmd/Ctrl+E` 收起后仍生效
- [x] **记录每轮提交的文字**：只记录 Host 接受的消息（rc.5 `sending` + `pendingSubmissions` 确认），设备侧 `localStorage` 全局一份，去重置顶、200 条 / 10 万字符上限；清空入口为未绑定默认键的命令 `multiline-input.clear-history`
- [x] **↑ / ↓ 浏览输入历史**：单行 ↑/↓、多行 Shift+↑/↓；Esc / 越过最新还原草稿；浏览时 tab 显示「历史 n/m」；替换走 `inputActions.setDraft`
- [x] **DSH 0.2.1-rc.5 兼容回归**：composer 锚点 / dock 座位 / 布局变量 / Shortcuts 契约已核对，`sending` 相位不拦截；兼容范围 `>=0.2.1-rc.5 <0.3.0-0`
## 设计决议（0.2.0 已实现的三项）

- [x] **tab 可收起**（2026-10-29 提出）：收起为 8px 细线、仍在流内（dock 净占约 2px、hero 净占 0px，输入区回收约 16px）；右对齐、40×2px、hover 变 56px 并带 tooltip；状态按设备持久化（`dsh-multiline-input.hint.v1`）；收起后 `Cmd+E` 仍生效。
- [x] **记录每轮提交的文字**（2026-10-30 提出）：设备侧 `localStorage` 全局一份（`dsh-multiline-input.history.v1`）；只记录 Host 接受的消息（`sending` + `pendingSubmissions` 确认），`/` 命令 / 空提交 / 失败提交 / 超长条目不记录；完全相同的文字去重置顶；上限 200 条 / 10 万字符。
- [x] **↑ / ↓ 浏览输入历史**（2026-10-30 提出）：单行 ↑/↓、多行 Shift+↑/↓；首次 ↑ 保存草稿，Esc 或越过最新还原；循环到最旧再 ↑ 回到最新；浏览时 tab 显示「历史 n/m」；替换走 `inputActions.setDraft()`（不直接改 DOM）；菜单 / IME / 非 plain 相位全部放行；新提交后游标重置。
- [x] **清空入口**：未绑定默认键的快捷键命令 `multiline-input.clear-history`，在「设置 → 通用 → 快捷键」自行指定组合。

## 0.2.1 候选

- [ ] 起始行数可配置（3–5 行），通过 Host `Config` + 插件详情页
- [ ] 按会话记忆模式（当前为全局 / 按设备）
- [ ] 若 DSH 提供公开的 composer 输入扩展点，替换现有的 DOM 事件接管（0.2.0 结论：只有 `InputActions` 写入面，无键盘仲裁扩展点，方向键/Enter 仍需捕获阶段监听）
- [ ] DSH 0.2.2-alpha 版本线的兼容回归（DOM 锚点 / `Shortcuts` 契约）

## 文档

- 计划：[docs/PLAN-2026-10-27.md](docs/PLAN-2026-10-27.md)、[docs/PLAN-2026-10-30.md](docs/PLAN-2026-10-30.md)
- 发版清单：[docs/RELEASE-CHECKLIST-0.1.1.md](docs/RELEASE-CHECKLIST-0.1.1.md)、[0.1.0](docs/RELEASE-CHECKLIST-0.1.0.md)
- npm：<https://www.npmjs.com/package/dsh-multiline-input>
- GitHub Release：<https://github.com/ZilongYang/dsh-multiline-input/releases/tag/v0.1.1>
