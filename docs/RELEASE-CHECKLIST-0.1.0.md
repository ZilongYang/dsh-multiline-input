# dsh-ml-input 0.1.0 发版 / 执行检查清单

> 每次发版或装到本机验收时逐条勾选；未勾选的项目要写明原因。

## 1. 代码与静态检查

- [x] `node --check client.js`
- [x] `node --check index.js`
- [x] `npm test`（`node --test`）全绿
- [x] `locale/zh.json`、`locale/en.json`、`package.json` 可被 JSON 解析
- [x] `npm --cache .npm-cache pack --dry-run` 文件清单包含 `client.js`、`cordis.patch.yml`、`locale/*`、README、docs
- [x] `package.json` 版本 = `0.1.0`，`dsh.compatibility.dsh` = `>=0.2.1-rc.3 <0.3.0-0`

## 2. 安装

> 本机运行中的 DeepSeek Harness 使用 `desktop` profile，由应用独占；`dsh plugin --profile desktop` 会报
> `profile "desktop" is managed exclusively by the Electron application`。

- [x] 方式一（应用内）：「插件」页 → 添加插件 → 绝对路径本目录 → 安装 → 启用
- [x] 方式二（开发期手动 link，已在 2026-10-28 执行）：
  `cd ~/.dsh/profiles/desktop && pnpm add link:<本目录>`，
  再把 `dsh-ml-input` 追加进 `package.json` 的 `dsh.profile.bundles`；
  profile 的 `patchReload: live` 会自动 reconcile（曾用临时文件哨兵验证 Host 行于 2026-10-27T16:30:37Z 激活）
- [ ] 插件出现在已安装列表，且能启用 / 禁用
- [ ] 刷新页面后插件加载（无控制台报错；若报错记录完整堆栈）

## 3. 实机验收（空会话 + 有内容会话各一次）

- [ ] 空输入时右上角出现 `Ctrl+E 多行输入`
- [ ] 输入文字后提示消失；清空后重现
- [ ] `Ctrl+E` 在编辑器内可切换；在页面空白处也可切换
- [ ] 多行模式输入框最小高度 4 行；切回单行恢复原高度
- [ ] 多行模式 `Enter` 换行（`Cmd/Ctrl+Z` 可撤销）
- [ ] 多行模式 `Shift+Enter` 发送
- [ ] 多行模式 `Cmd/Ctrl+Enter` 仍为加速提交
- [ ] 输入 `/` 打开菜单后 `Enter` 仍选中菜单项，不换行
- [ ] 输入 `@` 打开引用菜单后 `Enter` 仍选中菜单项
- [ ] 中文输入法候选态按 `Enter` 不误触，选词正常
- [ ] 在设置搜索框 / 会话重命名输入框内按 `Ctrl+E` 不切换模式
- [ ] 刷新页面后模式保持；重启应用后模式保持
- [ ] `设置 → 通用 → 快捷键` 中出现「切换多行输入」，可改绑、可恢复默认
- [ ] 改绑后右上角提示立即更新；清空绑定后提示只显示文案且可点击
- [ ] 禁用插件后：提示消失、高度恢复、`Ctrl+E` 不再切换、无残留 DOM / 控制台报错

## 4. 回滚

- [ ] 插件页关闭或卸载；或 `dsh plugin --profile <profile> remove dsh-ml-input`
- [ ] 回滚后与安装前一致（原输入框行为、快捷键设置里的条目消失）

## 5. 存档

- [ ] `docs/PLAN-2026-10-27.md` 已保存获批原文
- [ ] 实施偏差已回填到计划文末
- [ ] README 文档索引、ROADMAP 链接已更新
- [ ] git 首次提交完成（本地）

## 备注

- 本版本不发布 npm、不做市场条目、不建远端。
- 依赖 DSH `0.2.1-rc.3` 的 composer DOM 锚点；升级 DSH 后按第 3 节重新验收。
