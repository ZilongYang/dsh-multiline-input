# Changelog

## 0.2.2 — 2026-11-15

面向 DSH **0.2.2-rc.3** 的兼容版，并补三项功能（0.2.1 → 0.2.2 交互兼容，无破坏性变更）：

- **DSH 0.2.2-rc.3 兼容核查**：composer 锚点 / `data-phase` / `pendingSubmissions` / `InputActions` / Enter keymap / Shortcuts / dock 槽与布局、`settings.section` 与 `plugins.row.config` 槽逐个在 rc.3 构建产物里复核，全部在位；升级指南只到 `v0.2.2-rc.1`（19 项），无 rc.2 / rc.3 条目，唯一沾边的 `window-drag-regions` 不适用于 dock 流内容。结论见 [兼容性核查](docs/COMPAT-2026-11-15-dsh-0.2.2-rc.3.md)。**无需改动功能代码。**
- **8 语言包**：DSH 0.2.2 起内置 `de en es fr ja pt ru zh` 八种 locale，插件此前只有 zh / en，其余回落英文；本版补齐 ja / es / fr / de / ru / pt 的完整词典与 `locale/*.json` 元数据，键集与占位符由测试锁死。
- **起始行数 3–5 可配**：多行模式的输入框下限不再写死 4 行。设备本地 `dsh-multiline-input.lines.v1`，CSS 改读 `--dmi-min-lines`，设置页三选一即时生效（不需要重建样式表）。
- **按会话记忆（开关，默认关闭）**：默认仍是 0.2.1 的**全局共享一个模式**（在哪个会话切换都一起变），设置页新增一个开关，打开后才进入「每个会话各自记住」——原 `mode.v1` 变为共享默认值，`dsh-multiline-input.session-mode.v1` 存逐会话覆盖（最近 40 个会话 LRU）。开关、默认模式、Enter 接管、↑↓ 历史、tab 文案都读当前生效模式；关闭开关立刻回到共享模式（覆盖值保留，重新打开即恢复）。配套「默认模式」二选一与「清除所有会话记忆」。
- **设置页**：从 3 段扩到 6 段（快捷键 / 起始行数 / 默认模式 / 按会话记忆 / 输入历史 / 提示 tab），`settings.section` 与 `plugins.row.config` 两个入口共用。
- **清理**：`@supports not (height: 1lh)` 块里重复的设置页规则（0.2.1 遗留）已删；修掉 0.2.1 文档里把 `0.2.1-rc.3` 写成 `rc.3` 的笔误。
- **安装门禁**：`engines.dsh` 不变（`>=0.2.1-rc.5 <0.3.0-0`，判定带 `includePrerelease`，rc.3 可过）；`dsh.compatibility.dshReleases` 补 `0.2.2-rc.2` / `0.2.2-rc.3`。
- 测试：`node --test` **40 条全绿**（新增 8 条：8 语言键集与占位符、行数归一 / 持久化 / `applyLines`、会话记忆读写 / LRU / 容错、开关默认值与 `resolveSessionMode` 的开关语义）。

## 0.2.1 — 2026-11-05

面向 DSH **0.2.2-rc.1** 的兼容版本（交互能力与 0.2.0 相同）：

- **修复：多行高度在发送期间塌陷**。0.2.2 把普通消息改成 `sending` 冻结相位——等待 Host 接受期间编辑器是 `contenteditable="false"`；0.2.0 的 4 行下限选择器写死了 `[contenteditable="true"]`，于是每次发送高度会先塌回宿主的 36px（约 1 行）再弹回。现在下限同样覆盖只读提交相位（`sending` / `adjudicating` / `submitting` / `claimed`），主规则与 `@supports` 回退同步更新。
- **安装门禁**：新增 `engines.dsh = ">=0.2.1-rc.5 <0.3.0-0"`（DSH 的兼容判定带 `includePrerelease`，0.2.2-rc.1 可过）；`dsh.compatibility.dshReleases` 补 `0.2.1-rc.5` / `0.2.2-rc.1`。
- **菜单判定**：改用 0.2.2 新增的 `data-trigger-menu` 锚点，同时保留 `[role="listbox"]` 以兼容旧宿主。
- **文档**：源码依据更新到 DSH `0.2.2-rc.1`（commit `66491b05`）；补充 `sending` 双路径、引用（quote）文本进入历史、`contenteditable` 属 DOM 契约等说明；新增 [兼容性核查](docs/COMPAT-2026-11-05-dsh-0.2.2-rc.1.md) 与 [实施计划](docs/PLAN-2026-11-05.md)。
- 测试：`node --test` 32 条全绿（新增 2 条：只读相位的高度下限、菜单双锚点）。

## 0.2.0 — 2026-10-30

面向 DSH **0.2.1-rc.5** 的交互更新：

- **tab 可收起**：tab 右侧新增收起按钮，点击后变成输入卡片上沿右对齐的 8px 细线；细线 3px 粗、右侧带淡色向上 chevron，点击热区约 116×20px，hover 有浅色胶囊底与 tooltip，收起状态按设备持久化（`dsh-multiline-input.hint.v1`）。收起后输入区回收约 16px，`Cmd/Ctrl+E` 仍照常切换。
- **记录每轮提交的文字**：提交时立即入历史（排队 / steer 也可马上回看）；失败 / 被拒的消息也保留，方便直接重发。`/` 命令、空提交、超长条目不入库；设备侧 `localStorage` 全局一份（`dsh-multiline-input.history.v1`），完全相同的文字只保留一条（重复提交最新一条不重复写入），最多 200 条 / 10 万字符。
- **↑ / ↓ 浏览输入历史**：单行 `↑` / `↓`，多行 `Shift+↑` / `Shift+↓`；首次 `↑` 保存当前草稿，`Esc` 或在新条目上再按 `↓` 还原；浏览时 tab 显示「历史 n/m」；替换走公开的 `inputActions.setDraft`，不直接改 DOM。
- **插件配置页**：同一套配置挂到「设置（`Cmd+,`）→ 多行输入」与插件详情页行入口——当前键位 + 「打开设置」引导、输入历史条数与二次确认清空、提示 tab 收起/展开开关。
- **清空历史命令**：新增未绑定默认键的 `multiline-input.clear-history`，在「设置 → 通用 → 快捷键」自行指定组合。
- **DSH 0.2.1-rc.5 兼容回归**：核对 composer 锚点 / dock 座位 / 布局变量 / Shortcuts 契约，`sending` 相位不拦截；兼容范围改为 `>=0.2.1-rc.5 <0.3.0-0`。
- 测试：`node --test` 29 条全绿（新增历史、浏览、收起、sending 相位用例）。

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
