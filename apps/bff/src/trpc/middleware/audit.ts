import { middleware } from '../router.js';
import { prisma } from '../../db/prisma.js';

/** 审计日志中间件 - 自动记录所有写操作 */
export const auditMiddleware = middleware(async ({ next, ctx, path }) => {
  const result = await next();

  // 只记录写操作（create/update/delete）
  const isWrite = path.includes('.create') || path.includes('.update') || path.includes('.delete');
  if (!isWrite) return result;

  // 跳过不需要审计的路由
  const skipPaths = ['auth.login', 'auth.register', 'auth.me'];
  if (skipPaths.includes(path)) return result;

  // 提取 IP 和 User-Agent
  const ipAddress = ctx.headers?.get('x-forwarded-for')
    ?.split(',')[0]?.trim()
    || ctx.headers?.get('x-real-ip')
    || ctx.headers?.get('host')
    || 'unknown';

  const userAgent = ctx.headers?.get('user-agent') || 'unknown';

  // 记录审计日志
  await prisma.auditLog.create({
    data: {
      userId: ctx.session?.userId || null,
      userName: null, // 后续可通过 userId 查询
      action: path.split('.').pop()?.toUpperCase() || 'UNKNOWN',
      entity: path.split('.')[0]?.toUpperCase() || 'UNKNOWN',
      ipAddress,
      userAgent,
    },
  });

  return result;
});
