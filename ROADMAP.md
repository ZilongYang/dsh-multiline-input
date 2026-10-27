# ROADMAP

## 0.1.0（2026-10-28 已发布）

- [x] 单行 / 多行双态切换，模式按设备持久化（`localStorage`）
- [x] 官方快捷键命令（`multiline-input.toggle`；macOS `Cmd+E`，Windows / Linux `Ctrl+E`，可在设置中改绑）
- [x] 输入框上沿常驻 tab 提示（同底色、实时显示当前生效键位与目标模式，可点击切换）
- [x] 多行模式 4 行起高，随内容长高，沿用 DSH 336px 滚动上限
- [x] 多行模式 Enter 换行 / Shift+Enter 发送，保留撤销、输入法、菜单、busy-enter 语义
- [x] 与 composer 其它输入框、设置弹窗、斜杠菜单互不干扰
- [x] 单元测试（`node --test`）与静态检查
- [x] 发布：npm 0.1.0、GitHub Release `v0.1.0`、awesome-dsh-plugin PR #9938（等仓库满 24h 自动过门槛）

## 0.2.0 候选

- [ ] 起始行数可配置（3–5 行），通过 Host `Config` + 插件详情页
- [ ] 按会话记忆模式（当前为全局 / 按设备）
- [ ] 若 DSH 提供公开的 composer 输入扩展点，替换现有的 DOM 事件接管
- [ ] DSH 下一个版本线的兼容回归（DOM 锚点 / `Shortcuts` 契约）

## 文档

- 计划：[docs/PLAN-2026-10-27.md](docs/PLAN-2026-10-27.md)
- 发版清单：[docs/RELEASE-CHECKLIST-0.1.0.md](docs/RELEASE-CHECKLIST-0.1.0.md)
- npm：<https://www.npmjs.com/package/dsh-multiline-input>
- GitHub Release：<https://github.com/ZilongYang/dsh-multiline-input/releases/tag/v0.1.0>
