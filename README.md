# dsh-multiline-input

[npm](https://www.npmjs.com/package/dsh-multiline-input) · [GitHub](https://github.com/ZilongYang/dsh-multiline-input) · [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)

把 DeepSeek Harness 的对话输入框在**单行 / 多行**之间切换的 Web 客户端插件。

- 默认快捷键 **Cmd+E（macOS）/ Ctrl+E（Windows / Linux）**；输入框上沿有一个与输入框同底色的小 **tab** 显示当前快捷键与目标模式，点击即可切换。
- 多行模式输入框默认 **4 行高**（3–5 行区间内），内容变多自动长高，到原生 336px 上限后滚动。
- 多行模式 **Enter 换行、Shift+Enter 发送**；单行模式保持 DSH 原生行为（Enter 发送、Shift+Enter 换行）。
- 快捷键可在 **设置 → 通用 → 快捷键**里改成任意组合（冲突校验、恢复默认都由 DSH 官方界面负责）。
- 模式按设备记住，刷新 / 重启后保持。

![单行模式：输入框上沿的 tab](assets/screenshot-1-single-line.png)

![多行模式：输入框变高，tab 显示 Shift+Enter 提交 · Cmd+E 单行输入](assets/screenshot-2-multiline.png)

## 安装

```sh
# 市场 / CLI 管理的 profile
dsh plugin --profile <profile> add dsh-multiline-input

# 或在应用内「插件」页搜索 / 用绝对路径安装后启用
```

桌面版使用的 `desktop` profile 由应用独占（`dsh plugin --profile desktop` 会被拒绝），请在应用「插件」页安装或手动 link：

```sh
cd ~/.dsh/profiles/desktop
pnpm add link:/absolute/path/to/dsh-multiline-input
# 再把 "dsh-multiline-input" 追加到 package.json 的 dsh.profile.bundles
```

启用后刷新页面即可；插件清单变化不需要重启应用。

**卸载**：插件页关闭 / 卸载，或 `dsh plugin --profile <profile> remove dsh-multiline-input`。

## 使用

| 操作 | 单行模式 | 多行模式 |
|---|---|---|
| `Enter` | 发送 | 换行 |
| `Shift+Enter` | 换行 | 发送 |
| `Cmd/Ctrl+Enter` | 加速提交（不变） | 加速提交（不变） |
| `/`、`@` 菜单打开时的 `Enter` | 选中菜单项 | 选中菜单项 |
| 输入法候选态的 `Enter` | 交给输入法 | 交给输入法 |

- 按 `Cmd+E` / `Ctrl+E`（或点击 tab）在两种模式间循环；切换不清空草稿、不抢焦点。
- tab **常驻显示**，输入文字时也不隐藏；多行时显示 `Shift+Enter 提交 · Cmd+E 单行输入`，单行时显示 `Cmd+E 多行输入`。

## 修改快捷键

1. 打开 **设置 → 通用 → 快捷键**；
2. 搜索「多行输入」（命令名：**切换多行输入**，id `multiline-input.toggle`）；
3. 点击右侧键位进入录制，按下新组合即可；冲突时官方界面会提示，可随时恢复默认。

tab 实时跟随当前生效的组合；把绑定清空后只显示「多行输入 / 单行输入」，点击仍可切换。

## 与相近插件的区别

| 插件 | 它做什么 | 本插件 |
|---|---|---|
| `dsh-composer-expand` | 工具行按钮把输入框撑到 70vh | 双模式 + 快捷键 + Enter/Shift+Enter 互换 + 常驻 tab |
| `dsh-fullscreen-input` | 另开全屏面板写多行，Enter 换行、Ctrl+Enter 发送 | 内联在原生输入框，多行时 Shift+Enter 发送（带输入法保护） |
| `dsh-ctrl-enter-submit` | 全局把 Enter 改成换行、Ctrl/Cmd+Enter 发送 | 单行保持原生 Enter 发送，多行才交换 |
| `dsh-composer-ux` | 可配置发送/换行键位 + 右键菜单 + 快捷指令面板 | 只专注输入模式与高度 |
| `dsh-keyboard-manager` | Ctrl+Q / **Ctrl+E** / Ctrl+S 切栏、开设置 | Windows/Linux 上它的 Ctrl+E 与本插件默认冲突；可在设置里改键（macOS 本插件用 Cmd+E，不冲突） |

## 实现说明

插件遵守 DSH 的第三方客户端插件契约（`dsh.client` + `dsh.bundle.patch`），Host 半只保留一个可安装 / 启停的 bundle row，功能全部在 `client.js`：

- **模式状态**：模块级 store + `localStorage['dsh-multiline-input.mode.v1']`，投影为 `<html data-dsh-ml-input="multi">`；
- **高度**：一条 CSS 规则给 `[data-composer-card] [data-composer-input][contenteditable="true"]` 设 `min-height: calc(4 * 1lh + 8px)`，不碰 DSH 的滚动上限；
- **tab 提示**：注册到 `conversation.input.overlay` 座位，绝对定位到卡片上沿右侧（`bottom: 100%`，同底色 + 底部 0.5px 细线），宽度随文字；
- **Enter / Shift+Enter**：在 document 捕获阶段拦下多行模式下的 `Enter`，向编辑器重放一个翻转了 `shiftKey` 的合成按键——仍由 DSH 自己的 composer keymap 决定「换行」还是「提交」，撤销历史、输入法保护、busy-enter（queue/steer）、菜单仲裁全部保持原逻辑；
- **快捷键**：通过 `ctx.shortcuts.register()` 注册命令，编辑与持久化完全交给 DSH。

源码依据（DSH `0.2.1-rc.3`，commit `22ddee3`）：

| 契约 | 源码文件 |
|---|---|
| 输入卡片 / 覆盖层锚点 | `packages/client/ui-conversation/src/client/skeleton/InputBar.tsx` |
| 可编辑面 / 占位符 | `packages/client/ui-conversation/src/client/input/editor/DraftEditor.tsx`、`ComposerContentEditable.tsx` |
| Enter 语义 | `packages/client/ui-conversation/src/client/input/editor/keymap.ts` |
| 公开输入动作面 | `packages/client/ui-conversation/src/client/contract/input.ts` |
| 座位与标准 props | `packages/client/ui-conversation/src/client/contract/slots.ts` |
| 快捷键命令契约 | `packages/client/shortcuts/src/client/types.ts`、`binding.ts` |
| 客户端清单 | `packages/util/package-manifest/src/types.ts`、`packages/client/modules/README.zh.md` |

## 兼容性

- 在 DSH **0.2.1-rc.3**（桌面版 / Web）验证；`dsh.compatibility.dsh` = `>=0.2.1-rc.3 <0.3.0-0`。
- 依赖 composer 的 `data-*` 锚点与 `role="listbox"`，属 DSH 内部实现；升级 DSH 后需要回归（锚点缺失时插件只 warn，不会崩）。
- Web + Linux 没有默认快捷键（DSH 对 Web 可选组合有白名单限制），需在设置里自行指定。

## 开发

```
dsh-multiline-input/
├── package.json            # dsh.bundle.patch + dsh.client(platform: web)
├── cordis.patch.yml        # 1 个 Host row
├── index.js                # Host 半（空实现，仅为 bundle 契约）
├── client.js               # Client 半（手写，无构建、无第三方依赖）
├── icon.svg / assets/      # 插件图标与市场截图
├── locale/{zh,en}.json     # 插件展示元数据
├── test/                   # node --test
└── docs/                   # 计划、发版清单
```

- 测试：`npm test`（`node --test`，当前 12 条用例）。
- 语法：`node --check client.js && node --check index.js`。
- 调试：HMR 默认忽略 `**/node_modules`，链接安装的 `client.js` 改动不会被热加载；改完客户端代码后在插件页关/开一次（或重启应用），再刷新页面。

## 已知限制

- 仅作用于 Web GUI（桌面版与浏览器），TUI / CLI 不适用。
- 多行起始高度是代码常量 4 行，暂不提供配置项。
- 若默认键位与其它插件的命令默认值冲突，插件会降级为「点击 tab 切换」并在控制台输出一次警告。

## 文档

- [实施计划（2026-10-27）](docs/PLAN-2026-10-27.md)
- [发版检查清单 0.1.0](docs/RELEASE-CHECKLIST-0.1.0.md)
- [路线图](ROADMAP.md)
- [变更记录](CHANGELOG.md)

## License

MIT
