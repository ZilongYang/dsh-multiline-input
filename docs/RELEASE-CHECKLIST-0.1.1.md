# dsh-multiline-input 0.1.1 发版 / 执行检查清单

> 状态（2026-10-29）：0.1.1 为布局修复版（tab 不再压住 composer 上方卡片）。勾选为实测结果，未勾选项注明原因。

## 1. 变更范围

- [x] `client.js`：tab 从 `conversation.input.overlay` 浮层改到 `conversation.input.dock` 一行（`order: 1000`）；行宽按卡片列（`--dsh-composer-card-max-width` / `--dsh-composer-side-clearance`）右对齐；`margin-bottom: -实际 row-gap`（运行时读 `row-gap`，dock 6px / hero 8px，用 `ResizeObserver` 覆盖 hero→dock 切换）让 tab 底边与卡片上沿齐平
- [x] `client.js`：`__test` 增加 `HINT_SLOT` / `HINT_ID` / `HINT_ORDER`
- [x] `test/core.test.js`：新增「tab 座位必须是 `conversation.input.dock`、order 排在全部内置 dock 条目之后」的断言（13 条用例）
- [x] 文档：README（使用 / 实现说明 / 兼容性 / 已知限制 / 源码依据表）、ROADMAP、CHANGELOG、plan 事后补记第 13 条

## 2. 代码与静态检查

- [x] `node --check client.js`
- [x] `node --check index.js`
- [x] `npm test`（`node --test`）14 个测试节点全绿（13 条用例 + harness）
- [x] `locale/zh.json`、`locale/en.json`、`package.json` 可被 JSON 解析
- [x] `npm pack --dry-run`：tarball 文件清单含 `client.js`、`cordis.patch.yml`、`locale/*`、`assets/*`、`screenshots.json`、README、docs
- [x] `package.json` 版本 = `0.1.1`，`dsh.compatibility.dsh` = `>=0.2.1-rc.3 <0.3.0-0`

## 3. 布局几何验证（无 GUI，静态复刻）

用 Chrome 无头模式复刻 DSH `0.2.1-rc.3` 的 composer 栈（`.body` / `.scrollBody` / `.composerSeat` / `.composerStack` / InputBar `.root`+`.card` 的真实几何 CSS），插件 CSS 直接从 `client.js` 抽取后注入：

- [x] `tab.bottom - card.top = 0.00px`（tab 底边与卡片上沿齐平）
- [x] `tab.right - (card.right - (radius + 4)) = 0.00px`（右边缘与 0.1.0 位置一致）
- [x] 目标条底边在 tab 上方 6px，**无重叠**；目标条三个图标按钮落在 tab 的 x 范围之外
- [x] 1600 / 1400 两种宽度、栈间距 6px 与 8px（hero）两种情形结论一致

## 4. 实机验收（子龙，2026-10-29）

- [x] 目标条（进行中的目标）文案与暂停 / 编辑 / 清除三个图标完整可见、可点击
- [x] tab 仍在输入卡片上沿右侧、贴着卡片
- [x] 输入区比 0.1.0 高约 18px、composer 上方 dock 卡片整体上移 24px（预期变化，子龙确认可接受）
- [ ] 待办面板 / 队列面板与 tab 的同框观感（本次会话未出现这两种卡片，几何模型与目标条一致，未专门造场景复核）
- [ ] `Cmd+E` 切换、多行 `Shift+Enter` 发送（0.1.0 已验证，本次改动未触碰该逻辑，未重跑）
- [ ] 截图重截（0.1.0 的两张市场图仍然成立，仅上方状态行位置差 24px）

## 5. 发布结果（2026-10-29）

- GitHub：https://github.com/ZilongYang/dsh-multiline-input
  - 提交 `dcbc430`（`fix(composer): keep the hint tab in flow ...`），tag `v0.1.1` 已推送到 origin
  - Release：https://github.com/ZilongYang/dsh-multiline-input/releases/tag/v0.1.1（published 2026-10-29T08:20:32Z，非 draft）
- npm：`dsh-multiline-input@0.1.1`
  - `npm publish` 成功（账号 `zlmix`）；registry 处理约 25 秒后可用
  - `curl https://registry.npmjs.org/dsh-multiline-input/0.1.1` = 200；`dist-tags.latest` = `0.1.1`
  - 回读 tarball（`dsh-multiline-input-0.1.1.tgz`，259,485 B，sha256 `c57c83df…64db01`）：`package.json` 版本 = 0.1.1，`client.js` 含 3 处 `conversation.input.dock`，`docs/` 含 `RELEASE-CHECKLIST-0.1.1.md`
- 市场：awesome-dsh-plugin PR #9938 已于 2026-10-28 20:21Z 合并（MERGED）；市场读取仓库 + npm，`latest` 自动指向 0.1.1，无需重提 PR
- 截图：`assets/` 沿用 0.1.0（tab 外观与位置未变，仅上方状态行上移 24px），未重截

## 6. 官网同步（dsh.zlmix.com，2026-10-29）

> 子龙 2026-10-29 明确：发布新版本必须同步官网对应插件页。站点项目：`~/zWork/ai/zl-plugins/site`（本地仓，无远端；部署走 tar over SSH）。

- [x] `data/plugins.json`：multiline-input `version` 0.1.0→`0.1.1`、`released`→2026-10-29、`site.updated`→2026-10-29
- [x] `multiline-input/index.html`：JSON-LD `softwareVersion`、hero `data-version`、`pkg-line`、版本 chip → 0.1.1；**3 处已过时的实现描述**（亮点卡、原理第 2 步、实现链路图）从 `conversation.input.overlay` + 绝对定位改成 `conversation.input.dock` 一行（`order: 1000`、占 24px、不遮上方卡片）；兼容性表新增「0.1.1 起的布局」一行
- [x] `index.html`：插件卡 `data-version` / 版本 chip、JSON-LD `softwareVersion` → 0.1.1
- [x] `sitemap.xml`：首页与 `/multiline-input/` 的 `lastmod` → 2026-10-29
- [x] 站点提交：`440d0d5`（内容）、`6b35f00`（自检开关 `CHECK_SITE_SKIP_CROSS` + README 说明）
- [x] 自检：`CHECK_SITE_SKIP_CROSS=dsh-session-mng node scripts/check-site.mjs` → **0 error / 1 warning**。跳过原因：邻居仓库 `dsh-session-mng` 已 bump 到 `0.2.0`（另一条发布流水线在做，npm 仍是 `0.1.4`），本站 session-mng 数据（0.1.2）**未改动**，等它发版后补
- [x] 部署：`CHECK_SITE_SKIP_CROSS=dsh-session-mng ./scripts/deploy.sh` → 线上备份 `/opt/1panel/www/sites/dsh.zlmix.com/backups/20261029-172205`；8 条路由 200、未知路径 404、`index.html` 与线上 sha256 一致
- [x] 线上回读：`/multiline-input/` 的 JSON-LD / `data-version` / `pkg-line` / chip = 0.1.1，`conversation.input.overlay` **0 处**、`conversation.input.dock` 3 处，兼容性表含「Layout since 0.1.1」；首页卡片与 JSON-LD = 0.1.1；`sitemap.xml` 的 lastmod = 2026-10-29
- [ ] 后续：`dsh-session-mng 0.2.0` 发布后，把站点 session-mng 条目（当前 0.1.2，npm 已 0.1.4）与页面版本一并更新，再去掉 `CHECK_SITE_SKIP_CROSS` 跑一次全量自检并部署

## 7. 本机安装（desktop profile，link 安装）

- [x] profile 里 `dsh-multiline-input` 指向本目录（`link:`），代码改动即时生效；`package.json` 版本变化由 `patchReload: live` reconcile
- [x] 插件页关 / 开一次 + 刷新页面即可加载新 `client.js`（HMR 忽略 `node_modules`，见 plan 偏差 #6）

## 8. 回滚

- 插件页关闭 / 卸载，或 `dsh plugin --profile <profile> remove dsh-multiline-input`
- 代码回滚：`git revert <0.1.1 commit>`；npm 侧如需回退版本，`npm deprecate dsh-multiline-input@0.1.1 "..."` 并发布修正版

## 备注

- 依赖 DSH `0.2.1-rc.3` 的 composer 栈与布局变量；升级 DSH 后按第 3、4 节回归（tab 与卡片右边缘错位 / 出现缝隙即为变量或栈间距变了）。
