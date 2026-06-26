# system-enhancements - Work Plan

## TL;DR (For humans)

**What you'll get:** 在当前系统脚手架上扩展一系列基础设施、业务功能、安全合规和前端体系能力，逐步将管理后台从一个 RBAC 基础脚手架完善为企业级后台系统。

**Why this approach:** 脚手架的核心价值在于可复用。按"基础设施 → 核心业务 → 安全增强 → 前端体验"的顺序渐进扩展，每层都建立在下层基础上。

**Effort:** XXL（分阶段执行，每阶段独立可交付）
**Risk:** Low-Medium（大部分功能与现有业务解耦，可独立开发）

## Scope

### Phase 1: 基础设施增强（6 功能）
1. **容器化部署** - Docker Compose 编排 PostgreSQL + Redis + BFF + Admin
2. **文件上传与管理** - 统一上传接口（本地/OSS）、文件管理页面
3. **Redis 缓存集成** - 会话缓存、API 缓存、分布式锁
4. **数据字典** - 字典类型+字典项管理，统一下拉选项来源
5. **操作日志** - 面向业务的"谁做了什么"记录（区别于审计日志）
6. **数据导入/导出** - Excel/CSV 通用导入导出引擎

### Phase 2: 业务功能增强（5 功能）
1. **消息推送** - WebSocket 实时推送 + 站内信系统
2. **短信/邮件发送** - 集成邮件服务商（SendGrid/阿里云），发送验证码、通知
3. **公告管理** - 系统公告发布、定时上线下线
4. **API 密钥管理** - 第三方系统 API 密钥生成与管理
5. **定时任务调度** - 可视化 Cron 任务管理页面

### Phase 3: 安全与合规（3 功能）
1. **MFA 双因素认证** - TOTP/Google Authenticator 绑定 + 登录验证
2. **IP 白名单** - 管理后台按 IP 限制访问
3. **操作审批流** - 敏感操作需管理员审批

### Phase 4: 前端体系（3 功能）
1. **代码生成器** - 从 Prisma model 自动生成 CRUD 页面（BFF router + Admin page）
2. **主题配置** - 动态换肤、品牌色配置
3. **国际化 i18n** - 管理后台多语言支持

### Phase 5: 官网内容管理（3 功能）
1. **内容管理（CMS）** - 文章/新闻/产品发布，web + h5 展示
2. **SEO 优化** - sitemap 自动生成、meta 管理
3. **联系表单** - 访客留言 / 存库 / 后台处理

### Must NOT have（边界界定）
- 不做工作流引擎（Activiti/Flowable 集成）
- 不做 LDAP/AD 集成
- 不做大数据报表/BI
- 不做 IM 即时通讯
- 不做多租户（SaaS）
- 不做微服务拆分（保持 Monorepo 单体架构）

## Execution strategy

### Dependency matrix
| Phase | Depends on | Can parallelize |
|---|---|---|
| Phase 1 | 无 | Phase 1 内部部分功能可并行 |
| Phase 2 | Phase 1（文件/Redis） | Phase 2 内部部分功能可并行 |
| Phase 3 | Phase 1（Redis） | Phase 3 内部可并行 |
| Phase 4 | Phase 1（文件） | Phase 4 可独立开发 |
| Phase 5 | Phase 1（文件）、Phase 2（消息） | 需 CMS 模型先行 |

## Todos

### Phase 1: 基础设施增强

- [ ] P1.1 容器化部署
  What to do / Must NOT do: 编写 docker-compose.yml，编排 PostgreSQL 15 + Redis 7 + BFF (Node) + Admin (Nginx)。BFF 和 Admin 通过 multi-stage Dockerfile 构建。必须 NOT 使用 Docker Swarm/K8s。
  Dependencies: none | Blocks: P1.2 (Redis)
  Reference: docker/ 目录

- [ ] P1.2 文件上传与管理
  What to do / Must NOT do: BFF 新增文件上传接口（multer/formidable），支持本地存储和 OSS（阿里云/OSS）可切换。Admin 新增文件管理页面（列表、预览、删除）。Prisma 新增 FileRecord 模型（id, name, originalName, mimeType, size, url, storageType, uploadedById, createdAt）。必须 NOT 做图片裁剪/压缩/水印。
  Dependencies: none | Blocks: P4.1 (代码生成器需要文件上传)

- [ ] P1.3 Redis 缓存集成
  What to do / Must NOT do: BFF 集成 ioredis，封装缓存工具类。替换当前 JWT 黑名单为 Redis 存储。提供 cache.get/set/del 通用方法。必须 NOT 使用 Redis 做消息队列（KISS 原则）。
  Dependencies: P1.1 (Docker 编排 Redis) | Blocks: P3.x

- [ ] P1.4 数据字典
  What to do / Must NOT do: Prisma 新增 DictType（id, code, name, status）和 DictData（id, dictTypeId, label, value, sort, status）模型。BFF 新增 CRUD API + 前端页面（字典类型列表 + 字典项管理）。必须 NOT 支持多层级字典（只做两级：类型→项）。
  Dependencies: none | Blocks: 无

- [ ] P1.5 操作日志
  What to do / Must NOT do: Prisma 新增 OperationLog 模型（区别于 AuditLog，面向业务：id, userId, userName, module, action, target, targetId, detail, ipAddress, createdAt）。BFF middleware 或 decorator 方式记录。Admin 页面展示可筛选列表。必须 NOT 替代审计日志（两者并存，审计日志为安全审计，操作日志为业务追溯）。
  Dependencies: none | Blocks: 无

- [ ] P1.6 数据导入/导出
  What to do / Must NOT do: 封装 Excel 导入导出工具（node-xlsx 或 exceljs）。导出支持当前表格数据直接导出为 xlsx。导入支持模板下载 + 校验 + 导入预览。必须 NOT 支持 PDF/Word 导出。
  Dependencies: P1.2 (文件上传存储导入文件)

### Phase 2: 业务功能增强

- [ ] P2.1 消息推送
  What to do / Must NOT do: BFF 集成 WebSocket（ws 或 socket.io），Admin 建立长连接接收实时通知。新增通知类型（SYSTEM/APPROVAL/ALERT）。必须 NOT 做离线消息持久化到数据库（SSE 方式，断连后不补发）。
  Dependencies: P1.3 (Redis 作为 WebSocket 适配层)

- [ ] P2.2 短信/邮件发送
  What to do / Must NOT do: 封装邮件发送服务（nodemailer 支持 SMTP），集成供应商。发送记录存 OperationLog。Admin 提供发送配置页面。必须 NOT 集成短信服务商（只做邮件）。
  Dependencies: P1.2（文件上传管理附件）, P1.5（操作日志）

- [ ] P2.3 公告管理
  What to do / Must NOT do: Prisma 新增 Announcement 模型（id, title, content, type, status, priority, startAt, endAt, createdBy, createdAt）。BFF CRUD + Admin 公告管理页面。登录后弹窗或顶部横幅展示未读公告。必须 NOT 支持公告分类/标签。
  Dependencies: none

- [ ] P2.4 API 密钥管理
  What to do / Must NOT do: Prisma 新增 ApiKey 模型（id, name, key, secret, status, lastUsedAt, expiresAt, createdBy, createdAt）。BFF 新增 API 密钥中间件验证。Admin 管理页面（生成、启用/禁用、删除）。必须 NOT 存储明文 secret（只存 hash）。
  Dependencies: P1.3 (Redis 缓存密钥验证)

- [ ] P2.5 定时任务调度
  What to do / Must NOT do: BFF 集成 node-cron 或 bull（基于 Redis），Admin 可视化任务管理（创建、启停、执行记录）。预置任务：清理过期日志、缓存预热。必须 NOT 支持分布式任务调度（单机版）。
  Dependencies: P1.3 (Redis 作为任务队列)

### Phase 3: 安全与合规

- [ ] P3.1 MFA 双因素认证
  What to do / Must NOT do: 集成 otplib 生成 TOTP。Admin 用户绑定 MFA（扫码 + 验证码）。登录时检测 MFA 开启则跳转验证页面。Prisma User 模型增加 mfaSecret/mfaEnabled 字段。必须 NOT 使用短信/邮件 MFA（只做 TOTP）。
  Dependencies: P1.3 (Redis 缓存 MFA 临时票据)

- [ ] P3.2 IP 白名单
  What to do / Must NOT do: BFF middleware 检查请求 IP 是否在白名单内。SystemSetting 中配置白名单列表。Admin 设置页面管理 IP 白名单。必须 NOT 影响公开接口（登录/注册跳过）。
  Dependencies: none

- [ ] P3.3 操作审批流
  What to do / Must NOT do: Prisma 新增 Approval 模型（id, type, requesterId, approverId, status, targetType, targetId, reason, reviewedAt, createdAt）。BFF CRUD + Admin 审批页面（待审批列表、审批通过/驳回）。必须 NOT 支持多级审批/转审。
  Dependencies: P2.1 (审批通知实时推送)

### Phase 4: 前端体系

- [ ] P4.1 代码生成器
  What to do / Must NOT do: BFF 读取 Prisma schema 或数据库表结构，生成 CRUD 代码（BFF router + Zod schema + Admin page）。Admin 页面选择表 → 配置字段展示 → 预览代码 → 下载/直接写入。必须 NOT 覆盖已有文件（生成到临时目录）。
  Dependencies: P1.2 (生成物作为文件下载)

- [ ] P4.2 主题配置
  What to do / Must NOT do: Ant Design ConfigProvider 动态切换主题色。SystemSetting 存储主题配置。Admin 提供主题设置页面（主色、圆角、紧凑模式）。必须 NOT 支持暗黑模式（可后续扩展）。
  Dependencies: none

- [ ] P4.3 国际化 i18n
  What to do / Must NOT do: BFF 返回多语言内容由前端处理。Admin 集成 react-i18next，提取现有中文文案为 key，提供英文/中文切换。必须 NOT 翻译非 UI 文案（数据库内容由业务层处理）。
  Dependencies: none

### Phase 5: 官网内容管理

- [ ] P5.1 内容管理（CMS）
  What to do / Must NOT do: Prisma 新增 Category(id, name, code, parentId, sort) 和 Article(id, title, content, summary, cover, categoryId, status, tags, publishedAt, createdAt) 模型。BFF CRUD + Admin 内容管理页面。web + h5 从 BFF 获取内容展示。必须 NOT 做富文本编辑器集成（用 textarea/markdown 即可）。
  Dependencies: P1.2 (文章封面上传)

- [ ] P5.2 SEO 优化
  What to do / Must NOT do: web + h5 自动生成 sitemap.xml（基于 Article 发布状态）。每篇文章可独立设置 meta title/description/keywords。BFF 提供 SEO 配置 API。必须 NOT 做搜索引擎提交/站长工具集成。
  Dependencies: P5.1

- [ ] P5.3 联系表单
  What to do / Must NOT do: Prisma 新增 ContactMessage 模型（id, name, email, phone, company, content, status, createdAt）。BFF 公开 API（无需登录）提交留言 + 验证码防刷。Admin 后台处理留言（标为已处理/删除）。必须 NOT 集成第三方客服系统。
  Dependencies: P1.6 (导出留言为 Excel)

## Final verification wave
- [ ] F1. Plan compliance audit
- [ ] F2. Code quality review
- [ ] F3. Real manual QA
- [ ] F4. Scope fidelity

## Commit strategy
每个 Phase 完成后提交一次，commit message 遵循 conventional commits 格式。

## Success criteria
1. Docker compose 一键启动整套环境
2. 文件上传 + 管理页面可用
3. Redis 缓存打通，替换 JWT 黑名单
4. 数据字典/操作日志/导入导出可用
5. WebSocket 实时通知可用
6. 公告管理/API 密钥/定时任务可用
7. MFA / IP 白名单 / 审批流可用
8. 代码生成器可用
9. 官网可展示内容、留言
10. 所有 typecheck 通过，build 成功
