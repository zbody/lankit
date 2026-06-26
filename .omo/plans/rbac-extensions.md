# rbac-extensions - Work Plan

## TL;DR (For humans)

**What you'll get:** 一套完整的企业级管理后台扩展功能，包括：审计日志系统（记录所有操作）、增强认证（密码策略+登录失败保护）、通知中心（站内消息+通知管理）、高级仪表盘（统计图表+趋势分析）、以及系统设置页面（密码策略、安全设置）。

**Why this approach:** 在现有 Prisma schema 上扩展新模型（AuditLog、Notification、SystemSetting），通过 tRPC middleware 拦截所有写操作自动记录审计日志，前端用 Ant Design 的现成组件快速构建管理页面。

**What it will NOT do:** 不做 LDAP/SSO 集成、不做 MFA/OTP（这些需要外部服务）、不做工作流引擎（太复杂）、不做移动端适配、不做 CI/CD 流水线。

**Effort:** XL
**Risk:** Medium - 涉及数据库 schema 变更，需要谨慎处理
**Decisions to sanity-check:** 审计日志采用同步写入（简单可靠）vs 异步写入（性能好但复杂）；通知中心采用轮询（简单）vs WebSocket（实时但复杂）。

Your next move: approve to start execution.

---

> TL;DR (machine): XL effort, Medium risk, 5 major features with 30+ todos spanning Prisma schema changes, BFF routers, admin pages, and middleware

## Scope
### Must have
1. **审计日志系统** - 数据库模型 + BFF 中间件自动记录 + 管理页面
2. **通知中心** - 数据库模型 + 读写 API + 管理页面 + 未读计数
3. **高级仪表盘** - 统计卡片 + 趋势图表 + 用户行为分析
4. **系统设置** - 密码策略配置 + 安全设置页面
5. **API 限流基础** - 基于 IP 的请求频率限制

### Must NOT have (guardrails, anti-slop, scope boundaries)
- 不做 LDAP/AD 集成（需要外部服务）
- 不做 MFA/OTP（需要手机/邮箱服务商）
- 不做工作流引擎（超出 RBAC 范畴）
- 不做第三方 SSO（OAuth/OpenID）
- 不做微服务拆分（保持单体架构）
- 不做数据库迁移脚本（直接 prisma db push）

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: tests-after (现有代码无测试，新功能完成后补充关键路径测试)
- Evidence: .omo/evidence/task-<N>-rbac-extensions.md

## Execution strategy
### Parallel execution waves
> 5 waves, each with 5-8 parallel tasks. Dependencies flow left-to-right.

Wave 1: Database schema + seed data (5 tasks, parallel)
Wave 2: BFF routers for audit log + notification (4 tasks, parallel)
Wave 3: BFF middleware + API rate limiting (3 tasks, parallel)
Wave 4: Admin pages - Audit Log + Notification + Settings (5 tasks, parallel)
Wave 5: Admin pages - Enhanced Dashboard + integration (4 tasks, parallel)

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| Schema changes | none | Wave 2 routers | all schema tasks |
| Audit log router | Wave 1 | audit log page | notification router |
| Notification router | Wave 1 | notification page | audit log router |
| Rate limiter middleware | Wave 1 | API protection | auth middleware |
| Audit log page | Wave 2 | none | all other pages |
| Notification page | Wave 2 | none | audit log page |
| Settings page | Wave 2 | none | all other pages |
| Enhanced dashboard | Wave 2, Wave 5 | none | all pages |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->

### Wave 1: 数据库 Schema 扩展 (并行 5 任务)

- [x] 1.1 扩展 Prisma Schema - 审计日志模型
  What to do / Must NOT do: 在 schema.prisma 中添加 AuditLog 模型，包含 id、userId、userName、action、entity、entityId、oldValues（JSON）、newValues（JSON）、ipAddress、userAgent、createdAt 字段。必须 NOT 添加任何额外字段。
  Parallelization: Wave 1 | Blocked by: none | Blocks: Wave 2 audit router
  References: apps/bff/prisma/schema.prisma
  Acceptance criteria: `prisma db push` 成功，AuditLog 模型存在
  QA scenarios: 1) prisma db push 成功 2) 新模型可在 prisma studio 中看到
  Commit: Y | chore(schema): add AuditLog model

- [x] 1.2 扩展 Prisma Schema - 通知模型
  What to do / Must NOT do: 添加 Notification 模型，包含 id、userId、type（INFO/WARNING/ERROR/SUCCESS）、title、message、isRead、metadata（JSON）、createdAt 字段。必须 NOT 添加 readAt 或 actionUrl 字段。
  Parallelization: Wave 1 | Blocked by: none | Blocks: Wave 2 notification router
  References: apps/bff/prisma/schema.prisma
  Acceptance criteria: `prisma db push` 成功，Notification 模型存在
  QA scenarios: 1) prisma db push 成功 2) 模型字段完整
  Commit: Y | chore(schema): add Notification model

- [x] 1.3 扩展 Prisma Schema - 系统设置模型
  What to do / Must NOT do: 添加 SystemSetting 模型，包含 id、key、value（TEXT）、description、updatedAt 字段。必须 NOT 添加 createdBy 或 locked 字段。
  Parallelization: Wave 1 | Blocked by: none | Blocks: Wave 2 settings router
  References: apps/bff/prisma/schema.prisma
  Acceptance criteria: `prisma db push` 成功，SystemSetting 模型存在
  QA scenarios: 1) prisma db push 成功 2) 模型字段完整
  Commit: Y | chore(schema): add SystemSetting model

- [x] 1.4 扩展 Prisma Schema - 登录尝试记录模型
  What to do / Must NOT do: 添加 LoginAttempt 模型，包含 id、email、success、ipAddress、userAgent、reason（失败原因）、createdAt 字段。必须 NOT 添加 password 或 token 字段。
  Parallelization: Wave 1 | Blocked by: none | Blocks: Wave 2 auth router
  References: apps/bff/prisma/schema.prisma
  Acceptance criteria: `prisma db push` 成功，LoginAttempt 模型存在
  QA scenarios: 1) prisma db push 成功 2) 模型字段完整
  Commit: Y | chore(schema): add LoginAttempt model

- [x] 1.5 更新 Seed 数据 - 系统默认设置
  What to do / Must NOT do: 在 seed.ts 中添加默认系统设置（密码最小长度8、密码复杂度要求、登录失败锁定次数5、锁定时间30分钟）。必须 NOT 修改现有的角色/菜单/用户 seed。
  Parallelization: Wave 1 | Blocked by: none | Blocks: Wave 2 settings router
  References: apps/bff/prisma/seed.ts
  Acceptance criteria: seed 运行成功，新增设置已入库
  QA scenarios: 1) prisma db seed 成功 2) 新设置可在数据库查到
  Commit: Y | chore(seed): add default system settings

### Wave 2: BFF 后端路由 (并行 4 任务)

- [x] 2.1 审计日志中间件 - 自动拦截写操作
  What to do / Must NOT do: 在 trpc/router.ts 中添加 auditMiddleware，拦截所有 protectedProcedure 的 write 操作（create/update/delete），记录到 AuditLog 表。捕获 userId、action、entity、oldValues、newValues。必须 NOT 记录 GET 查询操作，必须 NOT 记录 password 字段。
  Parallelization: Wave 2 | Blocked by: 1.1 | Blocks: audit log page
  References: apps/bff/src/trpc/router.ts, apps/bff/src/trpc/routers/*.ts
  Acceptance criteria: 每次 create/update/delete 自动记录审计日志，password 被过滤
  QA scenarios: 1) 创建用户后审计日志表有一条记录 2) 审计日志不包含密码 3) GET 操作不产生审计日志
  Commit: Y | feat(audit): add middleware for auto-audit logging

- [x] 2.2 通知中心 API - CRUD + 未读计数
  What to do / Must NOT do: 创建 notification.ts router，包含 list(page, pageSize)、byId(id)、markAsRead(id)、markAllAsRead()、unreadCount() 五个 procedure。必须 NOT 添加删除通知的 API。
  Parallelization: Wave 2 | Blocked by: 1.2 | Blocks: notification page
  References: apps/bff/src/trpc/routers/
  Acceptance criteria: 5 个 procedure 均可正常调用
  QA scenarios: 1) list 分页返回 2) markAsRead 更新 isRead 3) markAllAsRead 批量更新 4) unreadCount 返回正确数量
  Commit: Y | feat(notifications): add CRUD API

- [x] 2.3 系统设置 API - 读写配置
  What to do / Must NOT do: 创建 systemSettings.ts router（或添加到 system.ts），包含 getAll()、getByKey(key)、update(key, value)、resetToDefaults() 四个 procedure。必须 NOT 添加删除设置的 API。
  Parallelization: Wave 2 | Blocked by: 1.3, 1.5 | Blocks: settings page
  References: apps/bff/src/trpc/routers/system.ts
  Acceptance criteria: 4 个 procedure 均可正常调用
  QA scenarios: 1) getAll 返回所有设置 2) getByKey 返回单个设置 3) update 更新值 4) resetToDefaults 恢复默认
  Commit: Y | feat(settings): add CRUD API

- [x] 2.4 登录尝试记录 + 失败保护中间件
  What to do / Must NOT do: 在 auth.ts 的 login mutation 中记录登录尝试到 LoginAttempt 表。添加 rate limiter middleware 检测同一 IP 在 30 分钟内失败超过 5 次时阻止登录。必须 NOT 修改现有的密码验证逻辑。
  Parallelization: Wave 2 | Blocked by: 1.4 | Blocks: 无（基础设施）
  References: apps/bff/src/trpc/routers/auth.ts, apps/bff/src/middleware/auth.ts
  Acceptance criteria: 登录成功/失败都记录，连续失败 5 次后锁定 30 分钟
  QA scenarios: 1) 成功登录后 LoginAttempt 有一条 success=true 记录 2) 失败后有一条 success=false 记录 3) 5 次失败后第 6 次被拒绝
  Commit: Y | feat(auth): add login attempt tracking and rate limiting

### Wave 3: 前端页面 - 审计日志 + 通知中心 (并行 3 任务)

- [x] 3.1 审计日志管理页面
  What to do / Must NOT do: 创建 AuditLogList.tsx 页面，展示审计日志列表表格，包含列：时间、用户、操作、实体、IP、详情（弹窗）。支持按时间范围、用户、操作类型筛选。必须 NOT 添加导出 CSV 功能。
  Parallelization: Wave 3 | Blocked by: 2.1 | Blocks: 无
  References: apps/admin/src/pages/ (参考 UserList.tsx 的表格模式)
  Acceptance criteria: 表格正确显示，筛选正常工作
  QA scenarios: 1) 加载审计日志列表 2) 按时间筛选 3) 按操作类型筛选 4) 查看详情弹窗
  Commit: Y | feat(ui): add audit log management page

- [x] 3.2 通知中心页面
  What to do / Must NOT do: 创建 NotificationCenter.tsx 页面，展示通知列表，支持标记已读/全部已读。右上角显示未读数量徽章。必须 NOT 添加推送通知功能。
  Parallelization: Wave 3 | Blocked by: 2.2 | Blocks: 无
  References: apps/admin/src/pages/ (参考 UserList.tsx)
  Acceptance criteria: 列表展示、标记已读、未读计数正确
  QA scenarios: 1) 加载通知列表 2) 点击标记已读 3) 点击全部已读 4) 未读计数实时更新
  Commit: Y | feat(ui): add notification center page

- [x] 3.3 系统设置页面
  What to do / Must NOT do: 创建 SystemSettings.tsx 页面，分组展示系统设置（密码策略、安全设置），支持编辑和保存。必须 NOT 添加设置导入/导出功能。
  Parallelization: Wave 3 | Blocked by: 2.3 | Blocks: 无
  References: apps/admin/src/pages/
  Acceptance criteria: 设置分组展示，编辑保存成功
  QA scenarios: 1) 加载设置分组 2) 修改密码最小长度 3) 保存设置 4) 刷新后值保持
  Commit: Y | feat(ui): add system settings page

### Wave 4: 前端页面 - 增强仪表盘 + 侧栏集成 (并行 4 任务)

- [x] 4.1 增强仪表盘 - 统计卡片
  What to do / Must NOT do: 在 Dashboard.tsx 中添加系统统计卡片：今日登录次数、今日操作数、活跃用户数、未读通知数、安全事件数。必须 NOT 添加图表组件（保留为纯数字卡片）。
  Parallelization: Wave 4 | Blocked by: 2.1, 2.2, 2.4 | Blocks: 无
  References: apps/admin/src/pages/Dashboard.tsx
  Acceptance criteria: 5 张新统计卡片显示正确数据
  QA scenarios: 1) 卡片数据来自真实 API 2) 数据实时更新 3) 加载状态正常
  Commit: Y | feat(ui): enhance dashboard with system stats

- [x] 4.2 通知中心集成到侧栏
  What to do / Must NOT do: 在 AdminLayout.tsx 的 Header 区域添加通知铃铛图标，显示未读数量红点，点击弹出通知面板（下拉列表）。必须 NOT 添加全屏通知页面入口。
  Parallelization: Wave 4 | Blocked by: 2.2 | Blocks: 无
  References: apps/admin/src/layouts/AdminLayout.tsx
  Acceptance criteria: 铃铛图标显示未读数量，点击弹出面板
  QA scenarios: 1) 铃铛显示红点 2) 点击弹出通知列表 3) 标记已读后红点消失
  Commit: Y | feat(ui): integrate notification bell in header

- [x] 4.3 审计日志路由添加到侧栏
  What to do / Must NOT do: 在 AdminLayout.tsx 的侧栏中添加"审计日志"菜单项（仅在系统管理员角色可见）。必须 NOT 添加导出功能按钮。
  Parallelization: Wave 4 | Blocked by: 2.1 | Blocks: 无
  References: apps/admin/src/layouts/AdminLayout.tsx
  Acceptance criteria: 侧栏显示审计日志菜单，点击跳转正确
  QA scenarios: 1) 管理员可见 2) 普通用户不可见 3) 路由跳转正确
  Commit: Y | feat(ui): add audit log to sidebar

- [x] 4.4 系统设置路由添加到侧栏
  What to do / Must NOT do: 在 AdminLayout.tsx 的侧栏中添加"系统设置"菜单项（仅限管理员）。必须 NOT 添加子菜单。
  Parallelization: Wave 4 | Blocked by: 2.3 | Blocks: 无
  References: apps/admin/src/layouts/AdminLayout.tsx
  Acceptance criteria: 侧栏显示系统设置菜单
  QA scenarios: 1) 管理员可见 2) 普通用户不可见 3) 路由跳转正确
  Commit: Y | feat(ui): add system settings to sidebar

### Wave 5: 集成与验证 (并行 3 任务)

- [ ] 5.1 端到端集成测试 - 审计日志链路
  What to do / Must NOT do: 验证完整链路：用户操作 → 中间件捕获 → 审计日志入库 → 管理页面展示。必须 NOT 编写自动化测试代码。
  Parallelization: Wave 5 | Blocked by: Wave 3, Wave 4 | Blocks: 无
  References: 全部相关文件
  Acceptance criteria: 创建/更新/删除用户后，审计日志页面能查到记录
  QA scenarios: 1) 创建用户 → 审计日志出现 2) 更新角色 → 审计日志出现 old/new values 3) 删除菜单 → 审计日志出现
  Commit: Y | test(integration): verify audit log end-to-end

- [ ] 5.2 端到端集成测试 - 通知链路
  What to do / Must NOT do: 验证通知创建、标记已读、未读计数完整链路。必须 NOT 添加邮件通知。
  Parallelization: Wave 5 | Blocked by: Wave 3, Wave 4 | Blocks: 无
  References: 全部相关文件
  Acceptance criteria: 通知 CRUD 正常，未读计数准确
  QA scenarios: 1) 创建通知 → 列表显示 2) 标记已读 → 列表更新 3) 未读计数正确
  Commit: Y | test(integration): verify notification end-to-end

- [x] 5.3 类型检查 + 构建验证
  What to do / Must NOT do: 运行 pnpm typecheck 和 pnpm build，确保所有新代码编译通过。必须 NOT 修改现有代码的行为。
  Parallelization: Wave 5 | Blocked by: all | Blocks: 无
  References: 全部
  Acceptance criteria: typecheck 零错误，build 零警告
  QA scenarios: 1) pnpm typecheck 通过 2) pnpm build 成功
  Commit: Y | ci: verify typecheck and build

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit - 检查所有 must-have 功能是否实现，must-not-have 功能是否未实现
- [ ] F2. Code quality review - 检查代码风格一致性、类型安全、无 any
- [ ] F3. Real manual QA - 实际运行系统，测试每个功能的 happy path
- [ ] F4. Scope fidelity - 确认没有 scope creep，没有引入不必要的复杂性

## Commit strategy
每完成一个 wave 后提交一次，commit message 遵循 conventional commits 格式。

## Success criteria
1. 审计日志自动记录所有 CRUD 操作，管理页面可查询
2. 通知中心可创建、标记已读、查看未读计数
3. 系统设置可配置密码策略和安全参数
4. 登录失败保护生效（5 次失败锁定 30 分钟）
5. 仪表盘显示系统统计信息
6. 所有 typecheck 通过，无类型错误
