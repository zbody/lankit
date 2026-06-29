## TL;DR (For humans)

**What you'll get:** 对当前 Lankit 管理后台系统进行全功能扩展。涵盖 8 大领域 40+ 项功能，按"安全加固 → UI 完备 → 基础服务 → 高级能力"四个 Phase 分阶段推进。每 Phase 产出可独立交付，互不阻塞。

**Why this approach:** 按依赖关系和价值密度排序。安全加固解决即时风险，UI 组件提升日常使用体验，基础服务补齐缺失模块，高级能力做差异化。

**Effort:** XXXL（分 4 个 Phase，每个 Phase 包含 6-15 个子任务）
**Risk:** Low（大多数功能与现有业务高度解耦，可独立开发）

## Scope

### Phase 1: 安全加固（6 项）
1. **MFA 恢复码** - TOTP 绑定时生成 10 个一次性恢复码，设备丢失时可凭恢复码登录并重置 MFA
2. **会话管理** - 服务端会话表（JWT + Refresh Token），用户可查看/踢下线其他登录设备
3. **API Key 认证中间件** - 实现 API Key 验证的 tRPC 中间件，外部系统可通过 key 调用接口
4. **API Key 作用域 + IP 白名单** - 每个 key 可限制可调用的路由和来源 IP
5. **CSRF 防护** - 全局 CSRF Token 校验
6. **登录历史页面** - LoginAttempt 表已有数据，增加前端展示页面（时间/IP/设备/成功/失败原因）

### Phase 2: UI / 组件完备（12 项）
1. **树形表格** - 组织/菜单/分类列表改为树形展开展示（Ant Design Tree 或 Table 树形模式）
2. **可复用 DataTable 组件** - 封装通用表格组件：分页/搜索/排序/列自定义/导出按钮/批量操作插槽
3. **可复用 SearchForm 组件** - 封装通用筛选栏（条件组合 + 重置 + 搜索）
4. **回收站页面** - 后端接口已就绪（recycleBin/restore），新增前端回收站页面
5. **图表统计（Dashboard）** - 集成 ECharts 或 Recharts，仪表盘增加趋势图/饼图/柱图
6. **面包屑导航** - AdminLayout 增加基于路由的面包屑组件
7. **暗黑模式** - Ant Design 5 的 `algorithm.darkAlgorithm`，全局切换 + localStorage 持久化
8. **页面标题 / Extra 区域抽象** - 封装 PageHeader 组件，统一页面标题、操作按钮区域
9. **用户/角色/组织选择器** - 封装 Picker 组件（UserPicker / RolePicker / OrgPicker）
10. **权限 Hook (usePermission)** - 封装 `hasPermission(code)` / `hasMenu(path)` 等权限判断工具
11. **FormDrawer 组件** - 侧滑表单组件，替代部分 Modal 表单的使用场景
12. **空状态 / 加载骨架屏组件** - EmptyState、LoadingSkeleton

### Phase 3: 基础服务扩展（15 项）
**文件存储**
1. **分片上传** - 大文件分片 + 断点续传 + 进度条
2. **OSS/COS 存储实现** - 补齐 `OssStorageProvider`，支持阿里云 OSS / 腾讯云 COS
3. **文件预览** - PDF / 图片 / 视频在线预览
4. **文件夹/目录结构** - 文件增加目录树，支持文件夹管理
5. **图片缩略图** - 自动生成缩略图，列表页展示缩略图而非原图

**CMS**
6. **标签管理** - 独立 Tags 表 + 标签 CRUD 页面，文章关联标签
7. **文章版本历史** - 文章编辑保存历史版本，可回滚
8. **SEO 预览面板** - 模拟搜索引擎展示文章标题/描述/关键词

**通信通知**
9. **邮件模板** - 邮件模板库（HTML 模板 + 变量替换），模板编辑页面
10. **邮件队列/重试** - 发送失败自动重试（3 次），管理员可查看发送队列
11. **公告定时发布** - Announcement 增加 publishAt/expireAt 字段，定时发布/自动下线
12. **公告按角色/组织推送** - 发布公告时可选择目标角色或组织

**审批**
13. **审批动作执行** - 审批通过时触发实际业务操作（如删除/启用/禁用）
14. **审批转派** - 审批人可转派给其他人，支持抄送

### Phase 4: DevOps 与架构增强（10 项）
1. **Webhook 系统** - 事件驱动的 Webhook 分发（用户创建/删除、订单状态变更等），管理页面配置 + 发送日志
2. **定时任务"立即执行"按钮** - 手动触发一次任务执行
3. **任务执行历史** - 每次执行记录（开始时间、结束时间、结果、日志），可查看详情
4. **系统监控页面** - 服务器 CPU / 内存 / 磁盘 / 进程监控
5. **数据库备份/恢复界面** - 一键备份 + 下载备份文件 + 恢复
6. **全文本搜索** - 用户/文章/通知等模型的全文搜索（PostgreSQL tsvector 或 Elasticsearch）
7. **性能数据持久化** - 当前内存环形缓冲区改为数据库存储，历史可追溯
8. **请求 ID / 关联 ID** - 每个请求分配 traceId，跨日志链路追踪
9. **字段级加密** - 邮箱/手机等敏感字段 AES 加密存储
10. **Swagger / OpenAPI 文档** - 基于 tRPC OpenAPI 插件生成 API 文档

### Must NOT have（边界界定）
- 不做多 Region / 跨数据中心部署
- 不做 BI 报表
- 不做 IM 即时通讯
- 不做 LDAP 集成（边界已明确定义为不包含）
- 不做离线 / PWA 支持
- 不做推送通知（APNs/FCM）

## Execution strategy

### Dependency matrix
| Phase | Depends on | Can parallelize |
|---|---|---|
| Phase 1 | 无 | 全部可并行开发 |
| Phase 2 | 无 | 全部可并行开发 |
| Phase 3 | 无 | 内部各模块互不阻塞 |
| Phase 4 | 无 | 全部可并行，其中性能数据持久化依赖 Phase 3 的文件存储 |

### Parallelism recommendation
Phase 1 和 Phase 2 完全独立，可以同时推进。
Phase 3 各子模块之间无依赖，可并行开发。
Phase 4 的 Webhook / 全文搜索 / API 文档等可独立进行。

## TODOs

### Phase 1: 安全加固

1. [ ] MFA 恢复码
   What to do / Must NOT do: 在 MFA setup 时生成 10 个一次性恢复码（SHA-256 哈希存储），UserMfa 增加 `recoveryCodes` JSON 字段。登录页 MFA 输入框下方增加"使用恢复码"入口。使用后标记已用，剩余不足 3 个时提示重新生成。Must NOT 明文存储恢复码。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 生成 MFA 时展示 10 个恢复码，使用后该码失效，用完所有码后 MFA 自动关闭
   Commit: Y | feat(mfa): add recovery codes for TOTP

2. [ ] 会话管理
   What to do / Must NOT do: Prisma 新增 UserSession 模型（id, userId, tokenHash, refreshTokenHash, device, ip, userAgent, expiresAt, lastActiveAt）。登录时创建会话记录。BFF 新增 `auth.sessions`（列表）、`auth.revokeSession`（踢下线）。Admin 新增"设备管理"页面或 Profile 页增加会话列表。Must NOT 强制用户登出。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 登录后在会话列表看到当前设备，可踢下线其他设备，被踢后该设备调用接口返回 401
   Commit: Y | feat(auth): add session management with device listing

3. [ ] API Key 认证中间件
   What to do / Must NOT do: 在 `apps/bff/src/trpc/router.ts` 新增 `apiKeyProcedure` 或扩展 `isAuthed` 中间件支持 API Key（`Authorization: Bearer lk_xxx`）。查找 `secretHash` → SHA-256 验证 → 更新 `lastUsedAt`。Must NOT 将 API Key 注入 session（仅标记 `ctx.isApiKey: true`）。
   Dependencies: 无 | Blocks: Phase 1 - API Key 作用域
   Acceptance criteria: 携带有效 API Key 的请求可调用指定接口，无效/过期/禁用 key 返回 401
   Commit: Y | feat(api-key): add API key authentication middleware

4. [ ] API Key 作用域 + IP 白名单
   What to do / Must NOT do: ApiKey 模型增加 `scopes: String`（JSON 数组，如 ["user.list", "user.create"]）和 `allowedIps: String`（JSON 数组）。中间件中校验作用域和 IP。Admin API Key 编辑页增加作用域选择 + IP 输入。Must NOT 允许空作用域（默认无权调用任何接口）。
   Dependencies: Phase 1 - API Key 认证中间件 | Blocks: 无
   Acceptance criteria: 限制作用域后 key 只能调用指定接口，限制 IP 后其他 IP 调用被拒
   Commit: Y | feat(api-key): add scope and IP allowlist to API keys

5. [ ] CSRF 防护
   What to do / Must NOT do: BFF 增加 CSRF Token 生成/验证中间件。前端在 `main.tsx` 的 httpLink headers 中附带 CSRF Token。Must NOT 影响 WebSocket 连接。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 无 CSRF Token 的 POST 请求被拒绝，正常请求不受影响
   Commit: Y | feat(security): add CSRF protection

6. [ ] 登录历史页面
   What to do / Must NOT do: 新建 `admin/pages/LoginHistory.tsx`，读取 `loginAttempt.list` 接口（需后端新建该 procudure 或复用现有数据）。展示列表：时间/IP/设备(User-Agent)/状态/失败原因。筛选：日期范围/状态/邮箱。Must NOT 显示密码原文。
   Dependencies: 无（数据已存在）| Blocks: 无
   Acceptance criteria: 看到本人所有登录记录，可筛选，失败原因明确
   Commit: Y | feat(login-history): add login attempt history page

### Phase 2: UI / 组件完备

7. [ ] 树形表格 — 组织/菜单/分类
   What to do / Must NOT do: OrgList/MenuList/CategoryList 从平面 Table 改为 Ant Design Table `expandable` 树形模式，或使用 Tree 组件。后端 tree 接口已存在。Must NOT 改变后端接口。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 组织/菜单/分类正确展示树形层级，可展开/收起
   Commit: Y | feat(ui): add tree view for org/menu/category pages

8. [ ] 可复用 DataTable 组件
   What to do / Must NOT do: 封装 `components/DataTable.tsx`：继承 Ant Table 全部 props，内置分页器、搜索输入（debounce）、排序切换、刷新按钮、列设置（show/hide）、导出按钮插槽、批量操作插槽、空状态。逐步替换现有列表页的 Table 使用。Must NOT 一次改完所有页面（逐步迁移）。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 新建的 DataTable 组件在 2-3 个页面替换使用，功能与原 Table 一致
   Commit: Y | feat(ui): add reusable DataTable component with pagination and search

9. [ ] 可复用 SearchForm 组件
   What to do / Must NOT do: 封装 `components/SearchForm.tsx`：基于 antd Form，支持常见字段类型（Input/Select/DatePicker/RangePicker），支持筛选条件折叠/展开。Must NOT 强绑定 DataTable（可独立使用）。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 传入字段配置自动渲染筛选表单，点击搜索/重置正确触发回调
   Commit: Y | feat(ui): add reusable SearchForm component

10. [ ] 回收站页面
   What to do / Must NOT do: 新建 `admin/pages/RecycleBin.tsx` 或各模块增加"回收站"入口。调用现有 recycleBin/restore/forceDelete 接口。展示已删除记录列表，支持恢复和彻底删除。Must NOT 对无软删除的模型做回收站。
   Dependencies: 无（后端已就绪）| Blocks: 无
   Acceptance criteria: 删除用户/组织/角色/菜单后出现在回收站，可恢复，可彻底删除
   Commit: Y | feat(recycle-bin): add recycle bin page for soft-deleted records

11. [ ] 图表统计（Dashboard）
   What to do / Must NOT do: 集成 Recharts 或 @ant-design/charts。Dashboard 新增：近 7 天用户注册趋势（折线图）、各角色占比（饼图）、组织层级分布（柱图）、每日操作日志量（面积图）。数据来自新的 `dashboard.charts` 接口或复用现有统计数据。Must NOT 移除现有的统计卡片。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: Dashboard 正确展示 4 类图表，数据与数据库一致
   Commit: Y | feat(dashboard): add ECharts/Recharts statistic charts

12. [ ] 面包屑导航
   What to do / Must NOT do: AdminLayout 增加面包屑组件。基于当前 route path 和 menu 配置自动解析层级。当路径匹配菜单时显示对应名称。Must NOT 硬编码面包屑映射。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 切换页面后面包屑正确展示当前页面路径，点击可跳转
   Commit: Y | feat(layout): add breadcrumb navigation

13. [ ] 暗黑模式
   What to do / Must NOT do: 在 AdminLayout 或 ConfigProvider 层增加主题切换。使用 Ant Design 5 的 `theme.algorithm: [defaultAlgorithm | darkAlgorithm]`。ThemeConfig 页面增加切换开关，localStorage 持久化。Must NOT 影响第三方组件（如 Quill 编辑器）样式。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 切换暗黑模式后全局 UI 颜色切换正确，刷新后保持
   Commit: Y | feat(theme): add dark mode support

14. [ ] PageHeader 抽象
   What to do / Must NOT do: 封装 `components/PageHeader.tsx`：title + subtitle + extra 操作按钮区域 + breadcrumb 集成。逐步替换各页面手动编写的标题区域。Must NOT 改页面逻辑。
   Dependencies: 无（建议在面包屑之后）| Blocks: 无
   Acceptance criteria: 2-3 个页面使用 PageHeader 组件，效果与原标题一致
   Commit: Y | feat(ui): add reusable PageHeader component

15. [ ] Picker 组件（UserPicker / RolePicker / OrgPicker）
   What to do / Must NOT do: 封装选人/选角色/选组织组件。支持搜索、多选、树形组织选择。基于 Modal + Table 或 Select + 下拉。Must NOT 一次性加载全量数据（必须做搜索）。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: picker 正确搜索和选择，返回选中项 ID 列表
   Commit: Y | feat(ui): add UserPicker/RolePicker/OrgPicker components

16. [ ] usePermission Hook
   What to do / Must NOT do: 封装 `hooks/usePermission.ts`：`hasPermission(code)` 检查按钮权限，`hasMenu(path)` 检查菜单权限。读取 user.roles → role.menus → permission 链。Must NOT 在组件外使用。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 正确判读当前用户是否拥有指定按钮权限
   Commit: Y | feat(auth): add usePermission hook for fine-grained access control

17. [ ] FormDrawer 组件
   What to do / Must NOT do: 封装 `components/FormDrawer.tsx` 基于 antd Drawer + Form。支持 submit/loading/validation/onClose。替代部分 Modal 表单场景。Must NOT 替换所有表单（保留 Modal 在需要居中展示的场景）。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: drawer 表单正确展示，提交/关闭工作正常
   Commit: Y | feat(ui): add FormDrawer component

18. [ ] 空状态 / 加载骨架屏组件
   What to do / Must NOT do: 封装 `EmptyState`（自定义图片 + 文案 + 操作按钮）和 `LoadingSkeleton`（基于 antd Skeleton 的表单/列表/卡片变体）。逐步替换手写的空状态和 loading 文案。Must NOT 影响现有加载逻辑。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 列表无数据时展示空状态组件，加载中展示骨架屏
   Commit: Y | feat(ui): add EmptyState and LoadingSkeleton components

### Phase 3: 基础服务扩展

19. [ ] 分片上传
   What to do / Must NOT do: 封装 `components/FileUploader.tsx` 支持大文件分片上传（1MB/片）。后端新增 `file.uploadChunk` / `file.mergeChunks` 接口。前端展示进度条。Must NOT 移除原有单次上传。
   Decisions: 前端用 spark-md5 计算文件 hash，使用 Web Worker 避免主线程阻塞
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 100MB 文件分片上传成功，MD5 校验一致
   Commit: Y | feat(file): add chunked upload with progress

20. [ ] OSS / COS 存储实现
   What to do / Must NOT do: 实现 `storage.ts` 中 `OssStorageProvider` 的 upload、getUrl、delete 方法。Admin 系统设置增加"存储方式"选择（本地/OSS/COS）及 AK/SK/Bucket/Endpoint 配置。Must NOT 在切换存储时迁移已有文件。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 配置阿里云 OSS 后，上传文件正确存储到 OSS，返回可访问 URL
   Commit: Y | feat(storage): implement Aliyun OSS and Tencent COS providers

21. [ ] 文件预览
   What to do / Must NOT do: 新建 `admin/pages/FilePreview.tsx` 或文件列表增加预览按钮。支持图片（img）、PDF（pdf.js）、视频（video）。Must NOT 预览 Office 文档（仅展示下载链接）。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 点击预览 → 图片/PDF/视频正确展示
   Commit: Y | feat(file): add file preview for images/PDFs/videos

22. [ ] 文件夹/目录结构
   What to do / Must NOT do: FileRecord 模型增加 `folderId` 自引用。文件列表改为目录树 + 文件列表布局。前后端支持目录 CRUD。Must NOT 做多级目录无限嵌套（限 3 级）。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 创建目录 → 上传文件到目录 → 切换目录展示对应文件
   Commit: Y | feat(file): add folder structure for file management

23. [ ] 图片缩略图
   What to do / Must NOT do: 上传图片时自动生成缩略图（sharp 或 jimp）。文件列表展示缩略图。存储 `thumbUrl` 字段。Must NOT 对 PDF/视频等非图片文件生成缩略图。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 上传 JPG/PNG 图片后列表显示缩略图，原图保持不变
   Commit: Y | feat(file): auto-generate image thumbnails on upload

24. [ ] 标签管理
   What to do / Must NOT do: Prisma 新增 Tag 模型（id, name, color, sort）。ArticleTag 关联表（articleId, tagId）。Admin 新建标签管理页面。文章编辑页增加标签选择。Article.tags JSON 字符串字段可废弃。Must NOT 影响已有文章数据。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 创建标签 → 文章关联标签 → 标签列表正确展示
   Commit: Y | feat(cms): add tag management for articles

25. [ ] 文章版本历史
   What to do / Must NOT do: Prisma 新增 ArticleVersion 模型（articleId, version, content, summary, createdAt, createdBy）。保存文章时自动创建版本。页面增加"版本历史"面板，可查看、对比、回滚。Must NOT 保留超过 50 个版本（自动清理旧版本）。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 编辑文章 3 次后版本列表显示 3 个版本，回滚到版本 1 后内容恢复
   Commit: Y | feat(cms): add article version history with rollback

26. [ ] SEO 预览面板
   What to do / Must NOT do: 文章编辑页增加 SEO 面板。展示 Google 搜索结果预览（标题截断 ~60 字、描述截断 ~160 字）。Must NOT 做真实 SEO 分析。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 填写 seoTitle/seoDesc/seoKeywords 后实时展示搜索引擎预览效果
   Commit: Y | feat(cms): add SEO preview panel for articles

27. [ ] 邮件模板
   What to do / Must NOT do: Prisma 新增 EmailTemplate 模型（id, code, name, subject, html, variables JSON）。Admin 邮件模板管理页面（富文本编辑）。发送邮件时按 code 获取模板 + 变量替换。Must NOT 将所有邮件改为模板驱动（逐步迁移）。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 编辑模板 → 通过 code 发送邮件 → 变量被正确替换
   Commit: Y | feat(email): add email template management

28. [ ] 邮件队列/重试
   What to do / Must NOT do: EmailLog 增加 `retryCount: Int`、`nextRetryAt: DateTime`。定时任务每 5 分钟扫描失败未重试记录并重发（最多 3 次）。Admin 发送队列页面（待发送/发送中/失败）。Must NOT 做死信队列。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: SMTP 临时不可用 → 邮件进入队列 → SMTP 恢复 → 自动重发 → 状态更新
   Commit: Y | feat(email): add email send queue with auto-retry

29. [ ] 公告定时发布
   What to do / Must NOT do: Announcement 模型增加 `publishAt: DateTime?`、`expireAt: DateTime?`。定时任务扫描到期公告并发布/下线。前端创建公告时可选定时发布和自动到期。Must NOT 支持秒级精度（精确到分钟即可）。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 创建定时公告 → 到时间自动发布 → 到过期时间自动下线
   Commit: Y | feat(announcement): add scheduled publishing and expiry

30. [ ] 公告按角色/组织推送
   What to do / Must NOT do: Prisma 新增 AnnouncementTarget 模型（announcementId, targetType: ROLE/ORG, targetId）。前端创建公告时可选目标范围。用户端拉取公告时根据角色/组织筛选。Must NOT 做排除目标（仅支持包含）。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 公告选择"仅管理员角色" → 管理员用户看到，普通用户看不到
   Commit: Y | feat(announcement): add role/org targeting for announcements

31. [ ] 审批动作执行
   What to do / Must NOT do: 审批通过时根据 `type` 字段执行对应的业务操作。例如"用户删除审批"通过后实际执行用户删除。在 approval.ts 中注册 type→handler 映射。Must NOT 要求审批结果回滚。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 创建"用户删除"审批 → 审批通过 → 用户实际被删除
   Commit: Y | feat(approval): wire approval actions to actual business operations

32. [ ] 审批转派/抄送
   What to do / Must NOT do: ApprovalAction 增加 `action: APPROVED/REJECTED/TRANSFERRED/CC`。审批操作页面增加转派按钮和抄送输入。转派后原审批人不再有审批权限。Must NOT 做多级转派追踪。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 审批人 A 转派给 B → B 可审批 → A 不可审批 → A 收到转派通知
   Commit: Y | feat(approval): add approval transfer and CC

### Phase 4: DevOps 与架构增强

33. [ ] Webhook 系统
   What to do / Must NOT do: Prisma 新增 Webhook 模型（id, name, url, secret, events: JSON, status, lastDeliveryAt）。WebhookDelivery 模型（webhookId, event, payload, status, responseCode, responseBody, duration, createdAt）。事件触发时异步分发（按事件名匹配激活的 webhook）。Admin 管理页面 CRUD + 发送日志。Must NOT 同步调用（不影响主流程响应时间）。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 创建 webhook 监听 user.created → 新建用户 → webhook 收到 POST 请求 + 正确签名
   Commit: Y | feat(webhook): add event-driven webhook system

34. [ ] 定时任务"立即执行"按钮
   What to do / Must NOT do: TaskList 页面增加"立即执行"按钮。后端新增 `task.runNow` 接口，调用 `scheduler.ts` 的 handler 并返回执行结果。Must NOT 修改 cron 表达式。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 点击立即执行 → 任务运行 → 页面展示执行结果和用时
   Commit: Y | feat(task): add run-now button for scheduled tasks

35. [ ] 任务执行历史
   What to do / Must NOT do: Prisma 新增 TaskExecution 模型（taskId, startedAt, finishedAt, status, result, errorMessage, duration）。每次任务执行记录一条。Admin 任务详情页增加执行历史列表。Must NOT 保留超过 100 条历史（自动清理）。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 每次任务执行后生成一条历史记录，页面可查看详情
   Commit: Y | feat(task): add task execution history

36. [ ] 系统监控页面
   What to do / Must NOT do: BFF 新增 `system.metrics` 接口（CPU/内存/磁盘/uptime/process）。Admin 新建系统监控页面（仪表盘风格），使用图表展示实时和趋势数据。Must NOT 安装外部监控代理（os/process Node.js 内置模块够用）。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 页面正确展示服务器 CPU/内存/磁盘使用率
   Commit: Y | feat(monitor): add system resource monitoring page

37. [ ] 数据库备份/恢复
   What to do / Must NOT do: BFF 新增 `system.backup`（执行 pg_dump + 返回下载链接）和 `system.restore`（接受备份文件 + 执行 pg_restore）。Admin 系统设置增加备份管理区域。Must NOT 自动定期备份（仅手动触发）。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 点击备份 → 下载 .sql 文件 → 使用该文件恢复 → 数据完整
   Commit: Y | feat(backup): add database backup and restore

38. [ ] 全文本搜索
   What to do / Must NOT do: 使用 PostgreSQL tsvector 构建全文索引（User.email/name、Article.title/content、Notification.title/message）。BFF 新增 `search.global(query)` 返回聚合结果（每个模型 N 条）。Admin 顶栏增加全局搜索入口（Cmd+K 触发）。Must NOT 集成 Elasticsearch。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 搜索"张三" → 返回匹配的用户、文章、通知等结果，按相关性排序
   Commit: Y | feat(search): add full-text search with PostgreSQL tsvector

39. [ ] 性能数据持久化
   What to do / Must NOT do: Prisma 新增 PerformanceMetric 模型（method, path, status, duration, userId, createdAt）。`performance.ts` 工具改为写入 DB（原有的内存缓冲作为热缓存）。Admin 性能监控页增加日期范围和历史趋势。Must NOT 保留超过 90 天数据（定时清理）。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 重启后性能数据不丢失，可查询 7 天前的数据
   Commit: Y | feat(monitor): persist performance metrics to database

40. [ ] 请求 ID / 关联 ID
   What to do / Must NOT do: BFF Hono 中间件每个请求生成 `X-Request-Id`（UUID），注入 `ctx.var.requestId`。tRPC context 传递 requestId。审计日志/操作日志/性能记录附带 requestId。回包 header 携带 requestId 便于前端排查。Must NOT 阻塞请求流程。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 每个请求响应 header 含 X-Request-Id，审计日志/操作日志记录同一 ID
   Commit: Y | feat(observability): add request ID / trace ID across services

41. [ ] 字段级加密
   What to do / Must NOT do: 封装 `utils/crypto.ts`（AES-256-GCM）。在 Prisma 中间件或 Service 层自动加解密 User.email/phone 等敏感字段。密钥存储在环境变量 `FIELD_ENCRYPTION_KEY` 中。Must NOT 加密关联字段（如 organizationId/roleId）。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: DB 中 email 为密文，API 返回时自动解密为明文，搜索时支持密文模糊搜索（保守方案：仅精确匹配）
   Commit: Y | feat(security): add field-level AES encryption for PII

42. [ ] Swagger / OpenAPI 文档
   What to do / Must NOT do: 使用 @trpc/openapi 生成 OpenAPI 3.0 规范。BFF 增加 GET /api-docs 返回 swagger.json。Admin 增加 API 文档入口（Swagger UI 或 Scalar）。Must NOT 暴露内部 tRPC 序列化细节。
   Dependencies: 无 | Blocks: 无
   Acceptance criteria: 访问 /api-docs 展示 swagger UI，可在线调试接口
   Commit: Y | feat(docs): generate OpenAPI documentation from tRPC routers

## Notes & Open Decisions

- **Phase 1 安全加固优先度最高**：MFA 恢复码和会话管理直接关系到用户账号安全
- **Phase 2 UI 组件可穿插进行**：不依赖后端改动，可随时开发
- **Phase 3 文件相关 OSS/COS 需要云服务账号**：开发时需测试环境配置
- **Phase 4 全文搜索**：如果数据量小（< 10 万条），tsvector 足够；数据量大建议上 Elasticsearch
- **暗黑模式与 i18n 建议一个做完再开另一个**：两者都涉及全局 UI 替换，同时做可能冲突

## Final Verification Wave

F1. [ ] Plan compliance audit — 所有 Phase 功能是否按规范实现
F2. [ ] Code quality review — typecheck / lint 全通过
F3. [ ] Real manual QA — 核心场景人工覆盖
F4. [ ] Scope fidelity — 没有做 Must NOT 里排除的功能

## Commit strategy

每个功能点（每个 todo 项）完成后单独提交，commit message 遵循 conventional commits 格式。
Phase 全部完成后可 squash 为一个 phase commit。

## Success criteria

1. MFA 恢复码生成、使用、重新生成全流程正常
2. 会话列表可查看多设备登录，可踢下线指定设备
3. API Key 可认证、限作用域、限来源 IP
4. CSRF Token 校验正常
5. 登录历史正确展示所有登录尝试
6. 组织/菜单/分类展示树形结构
7. DataTable/SearchForm/PageHeader/Picker/FormDrawer 组件复用正常
8. 回收站可查看、恢复、彻底删除
9. Dashboard 图表数据与数据库一致
10. 暗黑模式切换正常，刷新保持
11. usePermission 正确判断权限
12. 空状态和骨架屏正确展示
13. 大文件分片上传成功
14. OSS/COS 存储配置后文件上传正常
15. 文件预览图片/PDF/视频正确展示
16. 文件夹目录结构正常
17. 图片缩略图自动生成
18. 标签 CRUD + 文章标签关联正常
19. 文章版本历史保存和回滚正常
20. SEO 预览面板实时展示搜索引擎效果
21. 邮件模板编辑 + 变量替换 + 发送正常
22. 邮件发送失败自动重试 3 次
23. 公告定时发布和自动到期正常
24. 公告按角色/组织精准推送
25. 审批通过后执行业务操作
26. 审批转派后权限正确转移
27. Webhook 事件触发正常分发
28. 定时任务可手动触发
29. 任务执行历史可查看
30. 系统监控展示 CPU/内存/磁盘数据
31. 数据库备份和恢复正常
32. 全文搜索返回相关结果
33. 性能数据重启后不丢失
34. 每个请求携带 X-Request-Id
35. 敏感字段在 DB 中为密文
36. API 文档可在线浏览和调试
37. 所有 typecheck 通过，build 成功
