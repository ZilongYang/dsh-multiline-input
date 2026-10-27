# dsh-multiline-input 0.1.0 发版 / 执行检查清单

> 状态（2026-10-28）：0.1.0 已发布到 npm 与 GitHub；市场 PR #9938 的条目校验已通过，仅剩「仓库满 24h」的自动门槛。勾选为实测结果，未勾选项注明原因。

## 1. 代码与静态检查

- [x] `node --check client.js`
- [x] `node --check index.js`
- [x] `npm test`（`node --test`）13 条全绿
- [x] `locale/zh.json`、`locale/en.json`、`package.json` 可被 JSON 解析
- [x] `npm --cache /tmp/dsh-npm-cache pack --dry-run`：17 个文件，含 `client.js`、`cordis.patch.yml`、`locale/*`、`assets/*`、`screenshots.json`、README、docs
- [x] `package.json` 版本 = `0.1.0`，`dsh.compatibility.dsh` = `>=0.2.1-rc.3 <0.3.0-0`

## 2. 发布结果（2026-10-28）

- GitHub：https://github.com/ZilongYang/dsh-multiline-input
  - tag `v0.1.0`；Release：https://github.com/ZilongYang/dsh-multiline-input/releases/tag/v0.1.0
  - topics：`dsh-plugin` / `deepseek-harness` / `dsh` / `ui` / `composer` / `multiline`
- npm：`dsh-multiline-input@0.1.0`
  - `npm publish` 成功；公开版本端点 `https://registry.npmjs.org/dsh-multiline-input/0.1.0` = 200
  - `npm view dsh-multiline-input version dist.fileCount` = `0.1.0` / `17`
- 市场条目：https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/9938
  - 只新增 `data/plugins/ZilongYang__dsh-multiline-input.yml`（category `ui`）
  - `check` 通过；`Submission gate` 失败原因仅 **仓库 0.0 天 < 1 天**，提示会自动重跑、约 24h 后转绿，无需重提
- 市场截图（1360 宽，含卡片底部与状态行）：`assets/screenshot-1-single-line.png`（1360×330）、`assets/screenshot-2-multiline.png`（1360×464）；`screenshots.json` 已提交
- npm tarball 内的截图仍是首发旧图（市场读取仓库，不受影响；如需同步可发 0.1.1）

## 3. 安装

> 本机 DeepSeek Harness 使用 `desktop` profile，由应用独占；`dsh plugin --profile desktop` 会报 `profile "desktop" is managed exclusively by the Electron application`。

- [x] 方式一（应用内）：「插件」页 → 添加插件 → 绝对路径本目录 → 安装 → 启用
- [x] 方式二（开发期手动 link）：
  `cd ~/.dsh/profiles/desktop && pnpm add link:<本目录>`，并把 `dsh-multiline-input` 追加进 `package.json` 的 `dsh.profile.bundles`
- [x] 插件出现在已安装列表，且能启用 / 禁用（改名后重新安装并确认）
- [x] 刷新 / 重启应用后插件加载（重命名后重启验证，控制台无报错）

## 4. 实机验收

- [x] 输入框上方右侧常驻显示 `Cmd+E 多行输入`（macOS）
- [x] 输入文字后提示仍在（常驻）
- [x] `Cmd+E` 切换单行 / 多行；页面空白处也可切换（用户实测）
- [x] 多行模式最小高度 4 行；切回单行恢复原高度（截图对比）
- [x] 多行模式 `Shift+Enter` 发送、`Enter` 换行（用户实测）
- [ ] `Cmd/Ctrl+Enter` 加速提交（未专项回归）
- [ ] `/`、`@` 菜单打开时 `Enter` 选中菜单项（未专项回归）
- [ ] 中文输入法候选态 `Enter` 不误触（未专项回归）
- [ ] 设置搜索框 / 会话重命名框内 `Ctrl+E` 不切换（未专项回归）
- [ ] 改名后刷新 / 重启模式保持（storage key 变更，需再验一次）
- [ ] `设置 → 通用 → 快捷键` 出现「切换多行输入」，可改绑 / 恢复默认（未在界面逐项复核）
- [ ] 改绑后 tab 文案立即更新；清空绑定后只显示文案且可点击（未复核）
- [ ] 禁用插件后提示消失、高度恢复、无残留 DOM / 监听（未专项复核）

## 5. 回滚

- [ ] 插件页关闭或卸载；或 `dsh plugin --profile <profile> remove dsh-multiline-input`
- [ ] 回滚后与安装前一致（原输入框行为、快捷键条目消失）

## 6. 存档

- [x] `docs/PLAN-2026-10-27.md` 已保存获批原文
- [x] 实施偏差已回填到计划文末（含改名、发布、截图调整）
- [x] README 文档索引、ROADMAP 链接已更新
- [x] git 提交与远端推送完成

## 备注

- 0.1.0 已发布（npm + GitHub）；市场 PR 只等仓库满 24h 的 CI 门槛。
- 依赖 DSH `0.2.1-rc.3` 的 composer DOM 锚点；升级 DSH 后按第 4 节重新验收。
