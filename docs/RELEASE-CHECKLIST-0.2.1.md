# dsh-multiline-input 0.2.1 发版 / 执行检查清单

> 状态（2026-11-05）：0.2.1 是 **DSH 0.2.2-rc.1 兼容修复版**（交互能力与 0.2.0 相同），基线从 0.2.1-rc.5 升到 0.2.2-rc.1。计划见 [docs/PLAN-2026-11-05.md](PLAN-2026-11-05.md)，核查见 [docs/COMPAT-2026-11-05-dsh-0.2.2-rc.1.md](COMPAT-2026-11-05-dsh-0.2.2-rc.1.md)。

## 1. 变更范围

- [x] `client.js`：多行 4 行下限选择器补只读提交相位（`data-phase` 非 `plain`），主规则 + `@supports` 回退两处；修复 0.2.2 `sending` 期间高度塌回 36px 再弹回
- [x] `client.js`：菜单判定改用 `data-trigger-menu` 锚点，保留 `[role="listbox"]` 兼容；抽 `menuOpenIn(card)`
- [x] `client.js`：头注释基线更新到 `0.2.2-rc.1`（`66491b05`），补 `machine.ts` / `QuoteNode` / `ComposerContentEditable` / `MenuView` 契约点
- [x] `client.js`：`__test` 导出 `FLOOR_SELECTOR` / `TRIGGER_MENU` / `CSS`
- [x] `package.json`：`0.2.0` → `0.2.1`；新增 `engines.dsh`；`dsh.compatibility.dshReleases` 补 `0.2.1-rc.5` / `0.2.2-rc.1`
- [x] `test/core.test.js`：新增 2 条（只读相位高度下限、菜单双锚点），共 32 条
- [x] 文档：README / CHANGELOG / ROADMAP / PLAN-2026-11-05 / 本清单；COMPAT 文档修正事实错误

## 2. 代码与静态检查

- [x] `node --check client.js`
- [x] `node --check index.js`
- [x] `npm test`（`node --test`）32 条全绿
- [x] `locale/zh.json`、`locale/en.json`、`package.json` 可被 JSON 解析
- [x] `node -e` 用 semver@7.8.5 复核 `engines.dsh`：`0.2.1-rc.5` / `0.2.2-rc.1` / `0.2.2` 通过（`includePrerelease` 语义），`0.2.1-rc.3` / `0.3.0-0` 拒绝
- [x] `npm pack --dry-run`：tarball 文件清单正常、版本 0.2.1

## 3. 实机验收（子龙，DSH 0.2.2-rc.1 桌面版）

> 前置：插件以 `link:` 装在 `desktop` profile，但 HMR 忽略 `node_modules` —— 先在**插件页把 `dsh-multiline-input` 关一次再开**（或重启 App）让新 `client.js` 生效，然后刷新页面。
> 结果：**2026-11-05 子龙回复「验收成功」**，以下各项按验收结论勾选。

- [x] **多行模式发送时高度不再塌陷**（本次重点；发送期间保持 4 行）
- [x] 多行 Enter 换行 / Shift+Enter 发送；单行 Enter 发送 / Shift+Enter 换行
- [x] 发送期间（`sending`）Enter、↑/↓ 不误触发；被拒 / 失败后草稿保留且不进历史
- [x] 发送成功后 `↑` 能召回上一条（`sending` 冻结路径）
- [x] 带引用发送后 `↑` 召回内容符合预期（引用降级为纯文本）
- [x] `/`、`@` 菜单打开时 Enter 选中菜单项（`data-trigger-menu`）
- [x] tab 收起 / 展开；设置页（`Cmd+,`）→「多行输入」正常；快捷键改键生效
- [x] 新建会话 hero 态、Workspace picker 态无高度异常
- [ ] Console 无 `dsh-multiline-input` 报错（未单独查看，属可选）

## 4. 发布结果（2026-11-05）

- [x] 提交 `33b9a90`（release: 0.2.1 — DSH 0.2.2-rc.1 兼容）并推送 `origin/main`
- [x] annotated tag `v0.2.1` → `33b9a90`，已推送
- [x] `npm publish` 成功：shasum `73c1ac24fef999b9bfa828c2fe96a45f5ff9db21`、26 files、package 627.4 kB / unpacked 773.2 kB
- [x] registry 回读 `https://registry.npmjs.org/dsh-multiline-input/0.2.1`：`version 0.2.1`、`engines.dsh` 与 `dshReleases` 均正确；`dist-tags.latest = 0.2.1`
- [x] tarball 回读（HTTP 200，sha256 `f86d3e9e224fa7b9…`）：解包 `package/client.js` 含 `FLOOR_SELECTOR` ×4、`data-trigger-menu`；`package.json` = 0.2.1
- [x] GitHub Release：<https://github.com/ZilongYang/dsh-multiline-input/releases/tag/v0.2.1>（non-draft，notes 取自 CHANGELOG 0.2.1）
- [x] README 顶部 `Release v0.2.1` 与 ROADMAP 的 GitHub Release 链接已在发布提交里更新

## 5. 官网同步（dsh.zlmix.com，2026-11-05）

- [x] `data/plugins.json`：multiline-input `version` → 0.2.1、`released` → 2026-11-05、`tested` → `0.2.2-rc.1`、`site.updated` → 2026-11-05
- [x] `multiline-input/index.html`：JSON-LD `softwareVersion`、hero `data-version`、`pkg-line`、chip → 0.2.1；兼容表实测宿主 → 0.2.2-rc.1；新增「0.2.1 起」行（`sending` 相位保 4 行 / `data-trigger-menu` / `engines.dsh`）；「依赖的内部实现」补 `data-phase` / `contenteditable`
- [x] `index.html`：插件卡 `data-version` / chip、JSON-LD `softwareVersion` → 0.2.1；修正多行输入声明范围 `>=0.2.1-rc.3` → `>=0.2.1-rc.5`
- [x] `sitemap.xml`：首页与 `/multiline-input/` 的 `lastmod` → 2026-11-05
- [x] 站点提交 `199e9c8`（content: track dsh-multiline-input 0.2.1），推送 Gitea
- [x] `check-site`：本机 **0 error / 2 warning → PASS**（`CHECK_SITE_SKIP_CROSS=dsh-session-titler,dsh-session-mng`）
- [x] 发布：`./scripts/publish.sh` → 备份 `/opt/1panel/www/sites/dsh.zlmix.com/backups/20261105-214101`，8 条路由全 200
- [x] 服务器回写下载量提交 `ec7603f`（本地已 fast-forward：multiline 近 30 天 920 / 累计 920，截至 2026-11-05）
- [x] 线上回读：`/multiline-input/` 的 `softwareVersion` / `data-version` / `pkg-line` / chip = 0.2.1，正文出现 `0.2.2-rc.1`；首页卡片 `data-version="0.2.1"`；`sitemap.xml` 首页与插件页 lastmod = 2026-11-05

## 遗留 / 后续

- 站点上 `dsh-session-titler`（0.2.3）与 `dsh-session-mng`（0.2.2）已发 npm，但站点数据仍停在 0.2.2 / 0.2.1 —— 属各自发布流水线的站点同步缺口，本次按既定跳过机制处理，待其流水线补齐。
- 6 语言包（ja/es/fr/de/ru/pt）按计划未做，留在后续版本。
- CSS 模板里 `@supports` 块内重复的设置页规则未清理（无功能影响）。
