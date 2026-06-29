import { initTRPC, TRPCError } from '@trpc/server';
import type { TRPCContext } from './context.js';
import { getTenantFilter } from '../middleware/tenant.js';

const t = initTRPC.context<TRPCContext>().create();

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

/** 多租户中间件 - 自动注入 organizationId 过滤 */
const tenant = t.middleware(async ({ ctx, next }) => {
  // 如果没有登录会话，直接放行
  if (!ctx.session?.userId) {
    return next({
      ctx: { ...ctx, tenantId: null, isSuperAdmin: false },
    });
  }

  // 查询用户信息和角色
  const user = await ctx.prisma.user.findUnique({
    where: { id: ctx.session.userId },
    include: {
      organization: { select: { id: true, code: true } },
      roles: {
        include: { role: { select: { code: true } } },
      },
    },
  });

  if (!user || !user.isActive) {
    return next({
      ctx: { ...ctx, tenantId: null, isSuperAdmin: false },
    });
  }

  // 判断是否为超级管理员（拥有 system_admin 角色）
  const isSuperAdmin = user.roles.some(
    (r: { role: { code: string } }) => r.role.code === 'system_admin',
  );

  // 确定租户 ID
  const tenantId = user.organizationId;

  return next({
    ctx: { ...ctx, tenantId, isSuperAdmin },
  });
});

/** 性能监控中间件 - 自动记录所有请求的性能数据 */
const perfMonitor = t.middleware(async ({ ctx, next, path }) => {
  const startTime = Date.now();
  let status = 200;

  try {
    const result = await next();
    return result;
  } catch (error) {
    if (error instanceof TRPCError) {
      status = (error as any).httpStatus || 500;
    }
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    const { recordPerformance } = await import('../utils/performance.js');
    recordPerformance({
      method: 'tRPC',
      path,
      status,
      duration,
      userId: ctx.session?.userId,
    });
  }
});

/** 审计日志中间件 - 自动记录所有写操作 */
const auditLog = t.middleware(async ({ next, ctx, path }) => {
  const result = await next();

  // 只记录写操作。`batch*` 前缀兜底批量端点：tRPC 的 `path` 是完整路径
  // (例如 `user.batchDelete`)，它们不包含 `.delete` 小写子串，但仍然是
  // 写操作，必须和单实体端点同等审计。
  const isWrite =
    path.includes('.create') ||
    path.includes('.update') ||
    path.includes('.delete') ||
    path.includes('.batch');
  if (!isWrite) return result;

  // 跳过不需要审计的路由
  const skipPaths = ['auth.login', 'auth.register', 'auth.me'];
  if (skipPaths.includes(path)) return result;

  // 异步检查审计设置并记录，不阻塞主流程
  void (async () => {
    try {
      // 检查审计日志是否启用
      const enabledSetting = await ctx.prisma.systemSetting.findUnique({
        where: { key: 'audit.enabled' },
      });
      if (enabledSetting && enabledSetting.value === 'false') return;

      // 检查日志级别
      const levelSetting = await ctx.prisma.systemSetting.findUnique({
        where: { key: 'audit.level' },
      });
      const level = levelSetting?.value || 'info';
      const action = path.split('.').pop()?.toUpperCase() || 'UNKNOWN';

      // 根据日志级别过滤
      if (level === 'error' && action !== 'DELETE') return;
      if (level === 'warn' && action === 'CREATE') return;

      // 查询用户姓名
      let userName: string | null = null;
      if (ctx.session?.userId) {
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.userId },
          select: { name: true },
        });
        userName = user?.name || null;
      }

      const headers = ctx.headers || new Headers();
      const ipAddress = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || headers.get('x-real-ip')
        || headers.get('host')
        || 'unknown';

      const userAgent = headers.get('user-agent') || 'unknown';

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session?.userId || null,
          userName,
          action,
          entity: path.split('.')[0]?.toUpperCase() || 'UNKNOWN',
          ipAddress,
          userAgent,
        },
      });
    } catch {
      // 审计日志记录失败不影响主流程
    }
  })();

  return result;
});

export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed).use(tenant).use(perfMonitor).use(auditLog);
export const router = t.router;
export const middleware = t.middleware;
export { getTenantFilter };
