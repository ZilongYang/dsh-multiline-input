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

- [ ] **多行模式发送时高度不再塌陷**（本次重点；发送期间应保持 4 行）
- [ ] 多行 Enter 换行 / Shift+Enter 发送；单行 Enter 发送 / Shift+Enter 换行
- [ ] 发送期间（`sending`）Enter、↑/↓ 不误触发；被拒 / 失败后草稿保留且不进历史
- [ ] 发送成功后 `↑` 能召回上一条（`sending` 冻结路径）
- [ ] 带引用发送后 `↑` 召回内容符合预期（引用降级为纯文本）
- [ ] `/`、`@` 菜单打开时 Enter 选中菜单项（`data-trigger-menu`）
- [ ] tab 收起 / 展开；设置页（`Cmd+,`）→「多行输入」正常；快捷键改键生效
- [ ] 新建会话 hero 态、Workspace picker 态无高度异常
- [ ] Console 无 `dsh-multiline-input` 报错

## 4. 发布结果（验收通过后执行）

- [ ] 合并到 `main` 并推送 origin
- [ ] tag `v0.2.1`（annotated）推送
- [ ] `npm publish`（账号 `zlmix`，先设 `npm_config_cache=/tmp/dsh-npm-cache npm_config_logs_dir=/tmp/dsh-npm-logs`）
- [ ] registry 回读 `https://registry.npmjs.org/dsh-multiline-input/0.2.1`；`npm pack dsh-multiline-input@0.2.1` 校验 tarball 内 `client.js` 含 `FLOOR_SELECTOR` 语义（`data-phase` 分支）与 `data-trigger-menu`
- [ ] GitHub Release `v0.2.1`，notes 取自 CHANGELOG 0.2.1
- [ ] README 顶部 `Release v0.2.0` 链接与 ROADMAP 的 GitHub Release 行改为 `v0.2.1`

## 5. 官网同步（dsh.zlmix.com）

- [ ] `data/plugins.json`：multiline-input `version` → 0.2.1、`released` → 2026-11-05、`tested` → `0.2.2-rc.1`、`site.updated` → 2026-11-05
- [ ] `multiline-input/index.html`：JSON-LD `softwareVersion`、hero `data-version`、`pkg-line`、chip → 0.2.1；兼容表补 DSH 0.2.2-rc.1；CHANGELOG 区块补 0.2.1
- [ ] `index.html`：插件卡 `data-version` / chip、JSON-LD `softwareVersion` → 0.2.1
- [ ] `sitemap.xml`：首页与 `/multiline-input/` 的 `lastmod` → 2026-11-05
- [ ] `node scripts/check-site.mjs` 通过（跨仓库中途状态用 `CHECK_SITE_SKIP_CROSS=<package>` 并记原因）
- [ ] `./scripts/deploy.sh` 部署并逐路由回读；线上 JSON-LD / chip / sitemap 版本一致
