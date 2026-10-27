# dsh-ml-input

把 DeepSeek Harness 的对话输入框在**单行 / 多行**之间切换的 Web 客户端插件。

- 默认快捷键 **Cmd+E（macOS）/ Ctrl+E（Windows / Linux）**，常驻显示在输入框上方右侧；可在 **设置 → 通用 → 快捷键**里改成任意组合（冲突校验、恢复默认都由 DSH 官方界面负责）。
- 多行模式输入框默认 **4 行高**（3–5 行区间内），内容变多自动长高，到原生 336px 上限后滚动。
- 多行模式 **Enter 换行、Shift+Enter 发送**；单行模式保持 DSH 原生行为。
- 模式按设备记住，刷新 / 重启后保持。

## 安装

**桌面版（推荐）**：左侧「插件」页 → 添加插件 → 粘贴本目录绝对路径（如 `/Users/zilong/zWork/ai/zl-plugins/dsh-ml-input`）→ 安装 → 启用 → 刷新页面。HMR 生效时无需重启；若应用提示需要重启，按提示重启一次。

**命令行管理的 profile**：

```sh
dsh plugin --profile <profile> add link:/Users/zilong/zWork/ai/zl-plugins/dsh-ml-input
```

**开发期手动 link（桌面版使用的 `desktop` profile 由应用独占，CLI 会拒绝）**：

```sh
cd ~/.dsh/profiles/desktop
pnpm add link:/Users/zilong/zWork/ai/zl-plugins/dsh-ml-input
# 再把 "dsh-ml-input" 追加到 package.json 的 dsh.profile.bundles
```

该 profile 的 `patchReload: live` 让 HMR 在 `package.json` / 补丁文件变化后自动重载；装完刷新页面即可。插件清单变化无需重启应用。

**卸载**：插件页关闭 / 卸载，或 `dsh plugin --profile <profile> remove dsh-ml-input`。

## 使用

| 操作 | 单行模式 | 多行模式 |
|---|---|---|
| `Enter` | 发送 | 换行 |
| `Shift+Enter` | 换行 | 发送 |
| `Cmd/Ctrl+Enter` | 加速提交（不变） | 加速提交（不变） |
| `/`、`@` 菜单打开时的 `Enter` | 选中菜单项 | 选中菜单项 |
| 输入法候选态的 `Enter` | 交给输入法 | 交给输入法 |

- 按 `Cmd+E` / `Ctrl+E`（或点击输入框上方右侧的提示）在两种模式间循环；切换不清空草稿、不抢焦点。
- 提示**常驻显示**在输入框上方右侧（卡片右肩），输入文字时也不隐藏，方便随时看到当前模式与快捷键。
- 多行模式下提示会同时显示「Shift+Enter 提交」。

## 修改快捷键

1. 打开 **设置 → 通用 → 快捷键**；
2. 搜索「多行输入」（命令名：**切换多行输入**，id `ml-input.toggle`）；
3. 点击右侧键位进入录制，按下新组合即可；冲突时官方界面会提示，可随时恢复默认。

提示实时跟随当前生效的组合；把绑定清空后提示只显示「多行输入 / 单行输入」，点击仍可切换。

## 实现说明

插件遵守 DSH 的第三方客户端插件契约（`dsh.client` + `dsh.bundle.patch`），Host 半只保留一个可安装 / 启停的 bundle row，功能全部在 `client.js`：

- **模式状态**：模块级 store + `localStorage['dsh-ml-input.mode.v1']`，投影为 `<html data-dsh-ml-input="multi">`；
- **高度**：一条 CSS 规则给 `[data-composer-card] [data-composer-input][contenteditable="true"]` 设 `min-height: calc(4 * 1lh + 8px)`，不碰 DSH 的滚动上限；
- **提示**：注册到 `conversation.input.overlay` 座位，绝对定位到卡片上方右侧（右肩）常驻显示；
- **Enter / Shift+Enter**：在 document 捕获阶段拦下多行模式下的 `Enter`，向编辑器重放一个翻转了 `shiftKey` 的合成按键——仍由 DSH 自己的 composer keymap 决定「换行」还是「提交」，因此撤销历史、输入法保护、busy-enter（queue/steer）、菜单仲裁全部保持原逻辑；
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

## 开发

```
dsh-ml-input/
├── package.json            # dsh.bundle.patch + dsh.client(platform: web)
├── cordis.patch.yml        # 1 个 Host row
├── index.js                # Host 半（空实现，仅为 bundle 契约）
├── client.js               # Client 半（手写，无构建、无第三方依赖）
├── icon.svg
├── locale/{zh,en}.json     # 插件展示元数据
├── test/harness.js         # 在 Node 里加载 client.js 的 __ModuleLoader__ 垫片
├── test/core.test.js       # 纯逻辑单测
└── docs/                   # 计划、发版清单
```

- 测试：`npm test`（`node --test`，当前 12 条用例）。
- 语法：`node --check client.js && node --check index.js`。
- 调试：HMR 监听 profile 的 `package.json` 与补丁文件（会触发 profile 重组），但默认忽略 `**/node_modules`，所以**链接安装的 `client.js` 改动不会被热加载**。改完客户端代码后：在「插件」页把本插件关一次再开（或重启应用），然后刷新页面。
- 无构建步骤：`client.js` 直接由 DSH 的客户端模块系统加载（与 `dsh-session-titler` 同款手写 bundle）。

## 已知限制

- 仅作用于 Web GUI（桌面版与浏览器），TUI / CLI 不适用。
- Web + Linux 没有默认快捷键（DSH 对 Web 可选组合有白名单限制），需在设置里自行指定。
- 多行起始高度是代码常量 4 行，暂不提供配置项。
- 若默认键位与其它插件的命令默认值冲突，插件会降级为「点击提示切换」并在控制台输出一次警告，不影响其它功能。
- 依赖 composer 的 `data-*` 锚点，属于 DSH 内部实现；升级 DSH 后需要回归（插件在锚点缺失时只 warn，不会崩溃）。

## 文档

- [实施计划（2026-10-27）](docs/PLAN-2026-10-27.md)
- [发版检查清单 0.1.0](docs/RELEASE-CHECKLIST-0.1.0.md)
- [路线图](ROADMAP.md)
- [变更记录](CHANGELOG.md)

## License

MIT
