# Lankit — 现代化全栈管理平台

基于 React 18 + Next.js 15 + tRPC + Hono + Prisma 构建的企业级全栈管理平台。覆盖后台管理（Admin）、PC 官网（Web）、H5 移动端、原生 App 四端，一套代码基座多端适配。

## 技术栈

| 层 | 选型 |
|---|---|
| 前端框架 | React 18 + Next.js 15 (App Router) |
| 后台管理 | Vite + Ant Design 5 |
| BFF 层 | Hono + tRPC v10 |
| 数据库 ORM | Prisma + PostgreSQL |
| 验证 | Zod |
| 样式 | Tailwind CSS |
| Monorepo | pnpm workspace + Turborepo |
| 移动端 | Expo (React Native) |
| 容器化 | Docker Compose |

## 目录结构

```
platform/
├── apps/
│   ├── admin/         # 后台管理（Vite + Ant Design）
│   ├── bff/           # BFF 层（Hono + tRPC）
│   ├── web/           # PC 官网（Next.js 15）
│   ├── h5/            # H5 移动端（Next.js 15）
│   └── mobile/        # 原生 App（Expo）
├── packages/
│   ├── shared/        # 共享类型与 Zod schema
│   └── config/        # ESLint 共享配置
├── docker/
│   ├── docker-compose.yml
│   ├── Dockerfile.bff
│   ├── Dockerfile.admin
│   └── nginx-admin.conf
└── .github/workflows/ # CI 配置
```

## 已实现功能

### 基础 RBAC 权限系统
- 用户管理：注册、登录（JWT）、组织归属、多角色分配
- 角色管理：支持角色-菜单权限绑定
- 菜单管理：目录/菜单/按钮三级权限，树形结构
- 组织管理：无限层级树形组织架构
- 用户级菜单覆盖

### 系统能力
- 审计日志：自动记录所有关键操作，支持多维度追溯查询
- 通知中心：INFO / WARNING / ERROR / SUCCESS 多类型通知
- 系统设置：可扩展的 key-value 运行时配置
- 数据字典：字典类型 + 字典数据项，支持字符串/数字/布尔值类型
- 文件管理：文件上传、浏览、下载、删除
- 登录安全：登录尝试记录、失败原因追踪、IP 监控

### 工程化
- 端到端类型安全（Prisma → tRPC → 前端，类型自动派生）
- Turborepo 增量构建
- CI 自动化（typecheck + lint + build）
- Docker Compose 一键部署

## 快速开始

### 环境要求

- Node.js >= 20
- pnpm >= 9
- PostgreSQL >= 16

### 本地开发

```bash
# 1. 克隆仓库
git clone <your-repo-url>
cd platform

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 中的数据库连接信息

# 4. 初始化数据库
cd apps/bff
pnpm db:push
pnpm db:seed
cd ../..

# 5. 启动开发服务器
pnpm dev
```

启动后各服务地址：

| 服务 | 本地地址 | 线上地址 |
|---|---|---|
| PC 官网 | http://localhost:3001 | https://zbody.github.io/lankit |
| H5 移动端 | http://localhost:3002 | https://zbody.github.io/lankit/h5 |
| Admin 后台 | http://localhost:5175 | 待部署 |
| BFF API | http://localhost:3000 | 待部署 |

### Docker 部署

```bash
# 一键启动所有服务
docker compose -f docker/docker-compose.yml up -d
```

## 架构设计

### 端到端类型安全

```
Prisma Schema → tRPC Router → 前端 Query
     │                            │
     └── 类型自动派生 ──────────────┘
```

数据库模型变更后，不需要手动修改任何前端类型定义，类型从 Prisma Schema 一路自动派生到前端组件。

### 权限模型

RBAC + 组织树数据权限的三级权限体系：

- **目录**：侧边栏分组
- **菜单**：可访问页面
- **按钮**：页面内操作权限

支持用户级菜单覆盖，满足企业级权限场景。

### 多端架构

```
            ┌──────────┐
            │  BFF     │
            │ (tRPC)   │
            └────┬─────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
 ┌──┴──┐    ┌───┴───┐   ┌───┴───┐
 │Admin│    │ Web   │   │ H5    │
 │Vite │    │Next.js│   │Next.js│
 │AntD │    │ Tailwind  │ Tailwind
 └─────┘    └───────┘   └───────┘
```

## 开源协议

MIT License
