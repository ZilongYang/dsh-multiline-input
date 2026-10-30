# dsh-multiline-input 0.2.0 发版 / 执行检查清单

> 状态（2026-10-30）：0.2.0 是交互版本（tab 可收起、提交历史 + ↑/↓ 回看、插件配置页），基线 DSH 0.2.1-rc.5。勾选为实测结果；未勾选项注明原因。

## 1. 变更范围

- [x] `client.js`：tab 可收起成 8px 细线（3px 线 + 淡色 chevron + 约 116×20 热区，hover 胶囊底），收起状态按设备持久化
- [x] `client.js`：设备侧输入历史（`dsh-multiline-input.history.v1`），提交即记录、失败/被拒也保留、精确去重、200 条 / 10 万字符上限
- [x] `client.js`：单行 `↑`/`↓`、多行 `Shift+↑`/`Shift+↓` 浏览历史；`Esc` / 越过最新还原草稿；菜单 / 输入法 / 非 plain 相位放行
- [x] `client.js`：设置（`Cmd+,`）新增「多行输入」页（快捷键引导、历史条数与二次确认清空、提示收起/展开）；插件详情页行入口复用同一套 UI
- [x] `client.js`：`multiline-input.clear-history` 未绑定命令
- [x] DSH `0.2.1-rc.5` 兼容回归：composer 锚点 / dock 座位 / 布局变量 / Shortcuts 契约；bundle 内无 `sending` 相位，历史走乐观回显路径
- [x] 图标：`currentColor` 线稿改为蓝底白图形，重新生成 `assets/icon-180.png`
- [x] 测试：`test/core.test.js` 30 条用例；`test/harness.js` 扩展 React 垫片（refs/effects/state）
- [x] 文档：README、ROADMAP、CHANGELOG、`docs/PLAN-2026-10-30.md`（批准原文 + 实施偏差）

## 2. 代码与静态检查

- [x] `node --check client.js`
- [x] `node --check index.js`
- [x] `npm test`（`node --test`）30 条用例全绿
- [x] `locale/zh.json`、`locale/en.json`、`package.json` 可被 JSON 解析
- [x] `npm pack --dry-run`：tarball 含 `client.js` / `cordis.patch.yml` / `locale/*` / `assets/*` / `screenshots.json` / README / docs
- [x] `package.json` 版本 = `0.2.0`，`dsh.compatibility.dsh` = `>=0.2.1-rc.5 <0.3.0-0`

## 3. 实机验收（子龙，2026-10-30，DSH 0.2.1-rc.5）

- [x] tab 收起 / 展开、8px 细线、扩大后的热区与 hover 胶囊底
- [x] 单行 `↑`/`↓` 回看历史（截图 `历史 1/3`）、多行 `Shift+↑`/`Shift+↓`
- [x] 边界循环、`Esc` / 越过最新还原、浏览中打字退出
- [x] `/` 菜单与中文输入法候选态下方向键不误触
- [x] 设置（`Cmd+,`）→「多行输入」页出现；清空历史二次确认、提示收起/展开即时生效
- [x] 插件页图标变蓝可见；插件页「多行输入 >」次入口可用
- [x] 0.1.1 回归：多行 Enter/Shift+Enter、`Cmd+Enter`、撤销、模式持久化、dock 卡片不被遮挡、hero 状态
- [ ] 队列 / steer 消息「发完立即 `↑` 可见」（实现已改，未单独造忙碌场景复核）
- [ ] Console 无 `dsh-multiline-input` 报错 / 禁用启用后历史仍在（子龙未专门查看，属可选）
- [ ] 市场截图更新（0.2.0 外观有变化：细线、历史、设置页）

## 4. 发布结果（2026-10-30）

- [ ] 合并 `0.2.0开发` → `main`，推送 origin
- [ ] tag `v0.2.0` 推送
- [ ] `npm publish`（账号 `zlmix`）成功；registry 回读 0.2.0
- [ ] GitHub Release `v0.2.0` 创建（非 draft）
- [ ] npm tarball 回读：版本 0.2.0、`client.js` 含历史/收起/配置页代码

## 5. 官网同步（dsh.zlmix.com）

- [ ] `data/plugins.json`：multiline-input `version` → 0.2.0、`released` → 2026-10-30、`dsh` / `tested` → 0.2.1-rc.5、`site.updated` → 2026-10-30
- [ ] `multiline-input/index.html`：JSON-LD `softwareVersion`、hero `data-version`、`pkg-line`、版本 chip → 0.2.0；能力描述补「可收起 / 输入历史 / 设置页」
- [ ] `index.html`：插件卡 `data-version` / 版本 chip、JSON-LD `softwareVersion` → 0.2.0
- [ ] `assets/icons/multiline-input.svg`：同步新图标
- [ ] `sitemap.xml`：首页与 `/multiline-input/` 的 `lastmod` → 2026-10-30
- [ ] `node scripts/check-site.mjs` 通过（必要时用 `CHECK_SITE_SKIP_CROSS` 跳过邻居仓库中途版本，并在清单记录原因）
- [ ] `./scripts/deploy.sh` 部署并回读线上版本 / 图标 / lastmod

## 6. 本机安装（desktop profile）

- [x] 开发期临时 `link:` 到 worktree（已备份 profile 清单）
- [ ] 合并后恢复为 `link:/Users/zilong/zWork/ai/zl-plugins/dsh-ml-input`（或 npm 0.2.0），插件页关/开 + 刷新
- [ ] 应用内版本显示 0.2.0，tab / 历史 / 设置页正常

## 7. 回滚

- profile 备份：`~/.dsh/profiles/desktop/package.json.bak-0.2.0-link-20261030-203638`、`pnpm-lock.yaml.bak-0.2.0-link-20261030-203638`
- npm：`npm unpublish dsh-multiline-input@0.2.0`（仅限发布后 72h 内；优先发 0.2.1 修复）
- GitHub：`git tag -d v0.2.0 && git push origin :refs/tags/v0.2.0`，Release 手动删除
- 官网：`git revert` 站点提交后重新 `deploy.sh`

## 8. 文档索引

- README「文档」、ROADMAP「文档」已挂本清单
- 计划存档：`docs/PLAN-2026-10-30.md`
