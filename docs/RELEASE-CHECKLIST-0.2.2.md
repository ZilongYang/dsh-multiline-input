# dsh-multiline-input 0.2.2 发版 / 执行检查清单

> 状态（2026-11-15 **已发布**）：0.2.2 是 **DSH 0.2.2-rc.3 兼容版 + 三个新功能**（8 语言包、起始行数 3–5 可配、按会话记忆开关，默认全局）。计划见 [docs/PLAN-2026-11-15.md](PLAN-2026-11-15.md)，核查见 [docs/COMPAT-2026-11-15-dsh-0.2.2-rc.3.md](COMPAT-2026-11-15-dsh-0.2.2-rc.3.md)。

## 1. 变更范围

- [x] `client.js`：`DICT` 由 zh/en 扩到 8 语言（补 ja / es / fr / de / ru / pt），键集与占位符由测试锁死
- [x] `client.js`：起始行数 3–5 可配 —— 新存储键 `dsh-multiline-input.lines.v1`，CSS 下限改读 `--dmi-min-lines`，`applyLines()` 写到 `<html>` 的 style，设置页三段式选择
- [x] `client.js`：按会话记忆**作成一个开关**（`dsh-multiline-input.session-memory.v1`，默认 `off`＝全局共享，与 0.2.1 行为一致）；打开后 `dsh-multiline-input.session-mode.v1` 才参与（LRU 40）；`effectiveStore` + `activeSession` 管理生效模式，Enter 接管 / ↑↓ 历史 / tab 文案都读生效模式
- [x] `client.js`：设置页新增「起始行数 / 默认模式 / 按会话记忆（开关）」三段，`plugins.row.config` 与 `settings.section` 两个入口共用
- [x] `client.js`：顺手清掉 `@supports not (height: 1lh)` 块里重复的设置页规则（0.2.1 遗留）；头注释按会话/行数改写，源码依据注明「已对照安装版 0.2.2-rc.3 构建产物复核」
- [x] `locale/{ja,es,fr,de,ru,pt}.json` 新增；`zh.json` / `en.json` 的 meta 描述补新能力
- [x] `package.json`：`0.2.1` → `0.2.2`；`files` 由逐个列举 `locale/zh.json`、`locale/en.json` 改为 `locale`；`dsh.compatibility.dshReleases` 补 `0.2.2-rc.2` / `0.2.2-rc.3`；`engines.dsh` 不变
- [x] `test/core.test.js`：32 → 40 条（语言包键集/占位符、行数归一与持久化、`applyLines`、会话记忆 LRU/容错/清除）
- [x] 文档：README / CHANGELOG / ROADMAP / PLAN-2026-11-15 / COMPAT-2026-11-15 / 本清单

## 2. 代码与静态检查

- [x] `node --check client.js`、`node --check index.js`
- [x] `npm test`（`node --test`）**40 条全绿**
- [x] 9 个 JSON 文件可解析（`package.json`、`screenshots.json`、`locale/*.json`）
- [x] semver 复核 `engines.dsh`：`0.2.1-rc.5` / `0.2.2-rc.1` / `0.2.2-rc.2` / `0.2.2-rc.3` / `0.2.2` 通过；`0.2.1-rc.3` / `0.3.0-0` 拒绝（`includePrerelease` 语义）
- [x] 模拟宿主冒烟：注入假 `document` / `localStorage` / `ctx` 调 `apply()` —— 5 个 effect、2 个快捷键命令、3 个槽注册全部成功，`--dmi-min-lines` 初始化为 4；再模拟「A 会话切多行 → B 会话仍单行 → 回到 A 恢复多行 → hero 切换改默认 → 清空会话记忆」，落盘结果符合设计
- [x] `npm pack --dry-run --cache .npm-cache`：34 files，含 8 个 locale 文件与三份新文档，版本 0.2.2

## 3. 实机验收（子龙，DSH 0.2.2-rc.3 桌面版）

> 前置：插件以 `link:` 装在 `desktop` profile，HMR 不覆盖 `node_modules` —— 先在**插件页把 `dsh-multiline-input` 关一次再开**（或重启 App）让新 `client.js` 生效，然后刷新页面。
> 结果：**2026-11-15 23:10 子龙回复「OK 了，可以发布了」**，整体验收通过；下列条目未逐条单独回执，按整体通过记录。

- [x] **不回归**：多行模式发送时高度不塌陷（0.2.1 的修复仍有效）
- [x] 多行 Enter 换行 / Shift+Enter 发送；单行保持原生
- [x] `↑` / `↓` 召回历史；`sending` 期间不误触发
- [x] tab 收起 / 展开；快捷键（`Cmd+E`）改键生效；`/`、`@` 菜单 Enter 选中
- [x] **A**：DSH 语言切到 ja / de / fr / es / ru / pt，tab 与设置页文案为对应语言（不是英文、不是 key）
- [x] **B**：设置 →「多行输入」→ 起始行数改 3 / 4 / 5，输入框高度立即变化；刷新后保持
- [x] **C1（默认）**：按会话记忆**关闭**时，在任意会话切换，切到别的会话仍是同一个模式（就是 0.2.1 的老行为）
- [x] **C2（可选）**：把「按会话记忆」打开后，会话 A 切多行、会话 B 保持单行，来回切各自保持；关闭开关立刻回到共享模式；「清除所有会话记忆」清掉覆盖值
- [x] Console 无 `dsh-multiline-input` 报错

## 4. 发布（验收通过后）

- [x] 提交 `1921537`（release: 0.2.2 — DSH 0.2.2-rc.3 兼容 + 8 语言 + 起始行数 + 按会话记忆开关）并推送 `origin/main`
- [x] annotated tag `v0.2.2` → `1921537`，已推送
- [x] `npm publish` 成功：shasum `56872631cb1542e66d59c5639802399abaa6b0c8`、35 files、package 649.6 kB / unpacked 848.2 kB
- [x] registry 回读 `https://registry.npmjs.org/dsh-multiline-input/0.2.2`：`version 0.2.2`、`engines.dsh` 与 `dshReleases`（含 rc.2 / rc.3）正确；`dist-tags.latest = 0.2.2`
- [x] tarball 回读（sha256 `0d0ab98cc676ef84dbcbaf128038b95df3d1dd6c0b1af8138bb486c2437ca8f8`）：8 个 `locale/*.json` 齐全，`client.js` 含 `--dmi-min-lines` / `session-memory.v1` / `resolveSessionMode`
- [x] GitHub Release：<https://github.com/ZilongYang/dsh-multiline-input/releases/tag/v0.2.2>（non-draft，notes 取自 CHANGELOG 0.2.2，相对链接已改绝对）
- [x] README 顶部 `Release v0.2.2` 与 ROADMAP 的 Release 链接已在发布提交里更新

## 5. 官网同步（dsh.zlmix.com，用 `dsh-site-release`）

- [x] `node scripts/sync-site.mjs --package dsh-multiline-input`：`data/plugins.json`（version / released / site.updated）、详情页 JSON-LD / hero / pkg-line / chip、首页卡、`sitemap.xml` lastmod
- [x] 手工补（脚本不改的判断性内容）：`tested` → `0.2.2-rc.3`；详情页 lede、设置卡、起始行数卡、记忆范围卡、实现链路图、兼容表（实测宿主 rc.3 / 起始高度行 / 新增「0.2.2 起」行）；首页卡 pitch
- [x] `check-site`：**0 error / 1 warning → PASS**（`CHECK_SITE_SKIP_CROSS=dsh-session-mng`：该仓库版本已 bump 到 0.2.4 但 npm 仍是 0.2.3，属其流水线中途，与本次无关）
- [x] 行为验收 `scripts/qa.mjs`：**26 passed / 0 failed**
- [x] 站点提交 `36696d1`，rebase 到日更提交 `20cadad`（下载量）后发布；服务端回写 `7bc27b3`，本地已 fast-forward
- [x] 发布：`publish.sh` → 备份 `/opt/1panel/www/sites/dsh.zlmix.com/backups/20261115-232028`，8 条路由全 200
- [x] 线上回读：`/multiline-input/` 的 `softwareVersion` / `data-version` / `pkg-line` / chip = 0.2.2，正文含 `0.2.2-rc.3` 与「0.2.2 起」；首页卡 `data-version="0.2.2"`；`sitemap.xml` lastmod = 2026-11-15；`index.html` sha256 与线上一致（`eba61ca0…`）

## 遗留 / 后续

- 按会话记忆默认关闭，所以升级后行为与 0.2.1 完全一致；只有手动打开开关才会逐会话「粘住」，且随时可关、可清除。
- **站点上一处已知不一致**：`dsh-session-mng` 仓库已 bump 0.2.4、npm 仍是 0.2.3，本次发布按跳过机制处理，待其流水线补齐后其自检即转绿。
- `conversation.composer.dock` 等旧槽名、`data-trigger-menu` 换包都属于宿主侧事实，插件继续用双锚点兜底，无需跟进。
