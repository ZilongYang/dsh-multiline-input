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

## 0.2.0（2026-10-30 已发布）

- [x] **tab 可收起**：tab 右侧收起按钮 → 输入框上沿右对齐的 8px 细线（在流内，收起后输入区回收约 16px；3px 粗 + 淡色 chevron + 约 116×20 热区）；点击细线恢复；按设备持久化；`Cmd/Ctrl+E` 收起后仍生效
- [x] **记录每轮提交的文字**：提交时立即记录（排队 / steer 也可马上回看），失败 / 被拒也保留，设备侧 `localStorage` 全局一份，去重置顶、200 条 / 10 万字符上限；清空入口为未绑定默认键的命令 `multiline-input.clear-history`
- [x] **↑ / ↓ 浏览输入历史**：单行 ↑/↓、多行 Shift+↑/↓；Esc / 越过最新还原草稿；浏览时 tab 显示「历史 n/m」；替换走 `inputActions.setDraft`
- [x] **插件配置页**：设置（`Cmd+,`）左侧新增「多行输入」页，并在插件详情页行入口复用同一套配置（当前键位 + 打开设置引导、输入历史条数与二次确认清空、提示收起/展开开关）
- [x] **DSH 0.2.1-rc.5 兼容回归**：composer 锚点 / dock 座位 / 布局变量 / Shortcuts 契约已核对，`sending` 相位不拦截；兼容范围 `>=0.2.1-rc.5 <0.3.0-0`
## 设计决议（0.2.0 已实现的三项）

- [x] **tab 可收起**（2026-10-29 提出）：收起为 8px 细线、仍在流内（dock 净占约 2px、hero 净占 0px，输入区回收约 16px）；右对齐、3px 粗 + 淡色 chevron、hover 变 56px 并带浅色胶囊底与 tooltip、热区约 116×20px；状态按设备持久化（`dsh-multiline-input.hint.v1`）；收起后 `Cmd+E` 仍生效。
- [x] **记录每轮提交的文字**（2026-10-30 提出）：设备侧 `localStorage` 全局一份（`dsh-multiline-input.history.v1`）；提交即记录、失败 / 被拒也保留，`/` 命令 / 空提交 / 超长条目不记录；完全相同的文字去重置顶；上限 200 条 / 10 万字符。
- [x] **↑ / ↓ 浏览输入历史**（2026-10-30 提出）：单行 ↑/↓、多行 Shift+↑/↓；首次 ↑ 保存草稿，Esc 或越过最新还原；循环到最旧再 ↑ 回到最新；浏览时 tab 显示「历史 n/m」；替换走 `inputActions.setDraft()`（不直接改 DOM）；菜单 / IME / 非 plain 相位全部放行；新提交后游标重置。
- [x] **清空入口**：未绑定默认键的快捷键命令 `multiline-input.clear-history`，在「设置 → 通用 → 快捷键」自行指定组合。

## 0.2.1（2026-11-05 已发布，DSH 0.2.2-rc.1 兼容版）

- [x] **DSH 0.2.2-rc.1 兼容核查**：composer 锚点 / `data-phase` / `pendingSubmissions` / `InputActions` / Enter keymap / Shortcuts / dock 槽与布局变量全部保留；引用（quote）以 Markdown 文本进入草稿；结论见 [docs/COMPAT-2026-11-05-dsh-0.2.2-rc.1.md](docs/COMPAT-2026-11-05-dsh-0.2.2-rc.1.md)
- [x] **修复多行高度在发送期间塌陷**：0.2.2 的 `sending` 相位让编辑器只读（`contenteditable="false"`），4 行下限选择器补上只读提交相位分支（主规则 + `@supports` 回退）
- [x] **安装门禁与版本矩阵**：`engines.dsh` + `dsh.compatibility.dshReleases`（`0.2.1-rc.5` / `0.2.2-rc.1`）
- [x] **菜单判定**：改用 `data-trigger-menu` 锚点，保留 `[role="listbox"]` 兼容
- [x] 文档：README / CHANGELOG / 兼容核查 / 计划 / 发版清单
- [x] 子龙本机验收（DSH 0.2.2-rc.1 桌面版，2026-11-05 通过）
- [x] 发布：tag `v0.2.1`、npm publish、GitHub Release、官网同步（清单见 [docs/RELEASE-CHECKLIST-0.2.1.md](docs/RELEASE-CHECKLIST-0.2.1.md)）

## 0.2.2（2026-11-15 已发布）

- [x] **DSH 0.2.2-rc.3 兼容核查**：逐个锚点在 rc.3 构建产物里复核，结论「无需改功能代码」；见 [docs/COMPAT-2026-11-15-dsh-0.2.2-rc.3.md](docs/COMPAT-2026-11-15-dsh-0.2.2-rc.3.md)
- [x] **安装门禁与版本矩阵**：`dsh.compatibility.dshReleases` 补 `0.2.2-rc.2` / `0.2.2-rc.3`（`engines.dsh` 不变）
- [x] **8 语言包**：补齐 ja / es / fr / de / ru / pt 词典与 `locale/*.json`，键集与占位符由测试锁死
- [x] **起始行数 3–5 可配**：设备本地存储 + `--dmi-min-lines`，设置页三选一即时生效
- [x] **按会话记忆（开关，默认关闭 = 全局共享）**：打开后逐会话覆盖（LRU 40）+ 清除入口
- [x] **设置页扩到 6 段**，两个入口共用；顺手清理 0.2.1 遗留的重复 CSS
- [x] 测试 32 → 40 条全绿；文档（README / CHANGELOG / PLAN / COMPAT / 发版清单）
- [x] 子龙本机验收（DSH 0.2.2-rc.3 桌面版，2026-11-15「OK 了，可以发布了」）
- [x] 发布：tag `v0.2.2`、npm publish、GitHub Release、官网同步（清单见 [docs/RELEASE-CHECKLIST-0.2.2.md](docs/RELEASE-CHECKLIST-0.2.2.md)）

## 后续候选

- [x] ~~起始行数可配置（3–5 行）~~ → 0.2.2 以设备本地存储实现（Host `Config` 路线未采用：客户端侧没有读到行配置的公开入口）
- [x] ~~按会话记忆模式~~ → 0.2.2 实现为可选开关（默认关闭＝全局共享，避免「同一个输入框行为随会话变」扰乱判断）
- [ ] 若 DSH 提供公开的 composer 输入扩展点，替换现有的 DOM 事件接管（0.2.0 结论：只有 `InputActions` 写入面，无键盘仲裁扩展点，方向键/Enter 仍需捕获阶段监听）
- [x] ~~补 ja / es / fr / de / ru / pt 语言包~~ → 0.2.2 已补齐

## 文档

- 计划：[docs/PLAN-2026-11-15.md](docs/PLAN-2026-11-15.md)、[docs/PLAN-2026-11-05.md](docs/PLAN-2026-11-05.md)、[docs/PLAN-2026-10-27.md](docs/PLAN-2026-10-27.md)、[docs/PLAN-2026-10-30.md](docs/PLAN-2026-10-30.md)
- 兼容性核查：[docs/COMPAT-2026-11-15-dsh-0.2.2-rc.3.md](docs/COMPAT-2026-11-15-dsh-0.2.2-rc.3.md)、[docs/COMPAT-2026-11-05-dsh-0.2.2-rc.1.md](docs/COMPAT-2026-11-05-dsh-0.2.2-rc.1.md)
- 发版清单：[docs/RELEASE-CHECKLIST-0.2.2.md](docs/RELEASE-CHECKLIST-0.2.2.md)、[docs/RELEASE-CHECKLIST-0.2.1.md](docs/RELEASE-CHECKLIST-0.2.1.md)、[docs/RELEASE-CHECKLIST-0.2.0.md](docs/RELEASE-CHECKLIST-0.2.0.md)、[0.1.1](docs/RELEASE-CHECKLIST-0.1.1.md)、[0.1.0](docs/RELEASE-CHECKLIST-0.1.0.md)
- npm：<https://www.npmjs.com/package/dsh-multiline-input>（latest = 0.2.2）
- GitHub Release：<https://github.com/ZilongYang/dsh-multiline-input/releases/tag/v0.2.2>（上一版：<https://github.com/ZilongYang/dsh-multiline-input/releases/tag/v0.2.1>）
