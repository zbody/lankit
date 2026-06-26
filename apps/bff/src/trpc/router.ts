import { initTRPC, TRPCError } from '@trpc/server';
import type { TRPCContext } from './context.js';

const t = initTRPC.context<TRPCContext>().create();

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

/** 审计日志中间件 - 自动记录所有写操作 */
const auditLog = t.middleware(async ({ next, ctx, path }) => {
  const result = await next();

  // 只记录写操作
  const isWrite = path.includes('.create') || path.includes('.update') || path.includes('.delete');
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
export const protectedProcedure = t.procedure.use(isAuthed).use(auditLog);
export const router = t.router;
export const middleware = t.middleware;
