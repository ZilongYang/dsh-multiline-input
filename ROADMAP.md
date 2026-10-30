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

## 0.2.0 候选

- [ ] **（待定，2026-10-29 提出）tab 可收起**：在 tab 上加一个向下箭头按钮，点击把整个 tab 收起成一条**可见、容易识别的细线**（贴在输入框上沿，位置沿用 tab 的右侧对齐与卡片列宽）；点击这条细线把 tab 恢复出来。目的是长期使用、已记住快捷键时把提示让位给空间，需要时又能一眼找到。
  - 待定细节：细线的高度 / 颜色 / 是否带极淡的文字或光标悬停 tooltip；箭头与点击区域的大小（避免误触）；收起时 tab 是否完全不占那 24px 行（还是保留更薄的占位，避免输入区高度来回跳）；收起状态是否按设备持久化（沿用 `localStorage`，与输入模式同一个 key 前缀）；收起后 `Cmd+E` 切换仍照常生效（只是不显示提示）。
- [ ] **（待定，2026-10-30 提出）记录每轮提交的文字**：把用户每一轮提交到输入框的文字记录下来并维护，作为「输入历史」的数据底座；后续可能扩展到图片（提交时带的图片，需要单独考虑体积与清理）。
  - 待定细节：存储位置（设备侧 `localStorage` / IndexedDB，还是 Host 侧按会话持久化）；作用域（全局 / 按会话 / 按工作区）；容量上限与淘汰策略（按条数还是按字节）；是否记录被 queue / steer 的中间提交；清除入口（设置项 / 命令）；图片阶段的体积上限、是否只存引用而不存二进制。
- [ ] **（待定，2026-10-30 提出）↑ / ↓ 浏览输入历史**：输入框获得焦点时，按 ↑ / ↓ 把输入框里的文字按**最近提交顺序循环替换**（类似 shell 的历史）。单行模式直接用 ↑ / ↓；多行模式下 ↑ / ↓ 是原生移动光标，所以用 **Shift+↑ / Shift+↓**。
  - 依赖上一条「记录每轮提交的文字」。
  - 待定细节：开始浏览前当前草稿的保存与恢复（Esc 退出并还原？清空后自动退出？）；循环到边界的语义（最新 → 最旧 → 回到最新，还是到边界停住再按一次退出）；是否按会话隔离；与斜杠 / `@` 菜单、输入法组合态、`Cmd/Ctrl+Enter` 的仲裁；浏览时是否显示「第 n / m 条」之类的提示；替换整段文字要走 DSH 的 draft 面（`inputActions` / `useInput`）而不是直接改 DOM，否则撤销历史会被破坏；新提交后游标重置。
- [ ] 起始行数可配置（3–5 行），通过 Host `Config` + 插件详情页
- [ ] 按会话记忆模式（当前为全局 / 按设备）
- [ ] 若 DSH 提供公开的 composer 输入扩展点，替换现有的 DOM 事件接管
- [ ] DSH 下一个版本线的兼容回归（DOM 锚点 / `Shortcuts` 契约）

## 文档

- 计划：[docs/PLAN-2026-10-27.md](docs/PLAN-2026-10-27.md)
- 发版清单：[docs/RELEASE-CHECKLIST-0.1.1.md](docs/RELEASE-CHECKLIST-0.1.1.md)、[0.1.0](docs/RELEASE-CHECKLIST-0.1.0.md)
- npm：<https://www.npmjs.com/package/dsh-multiline-input>
- GitHub Release：<https://github.com/ZilongYang/dsh-multiline-input/releases/tag/v0.1.1>
