/**
 * 操作日志中间件 - 自动记录所有业务操作
 *
 * 与审计日志的区别：
 * - 审计日志：系统级操作（谁修改了什么数据）
 * - 操作日志：业务级操作（谁完成了什么业务）
 */

import { prisma } from '../db/prisma.js';

export const operationLogMiddleware = async ({ ctx, next, path }: {
  ctx: any;
  next: () => Promise<any>;
  path: string;
}) => {
  const startTime = Date.now();
  let result: any;
  let error: Error | null = null;

  try {
    result = await next();
    return result;
  } catch (e) {
    error = e instanceof Error ? e : new Error(String(e));
    throw e;
  } finally {
    const duration = Date.now() - startTime;
    
    // 只记录写操作
    const isWrite = path.includes('.create') || path.includes('.update') || path.includes('.delete') || path.includes('.batch');
    if (!isWrite) return;

    // 跳过不需要记录的路由
    const skipPaths = ['auth.login', 'auth.register', 'auth.me'];
    if (skipPaths.includes(path)) return;

    try {
      const action = path.split('.').pop()?.toUpperCase() || 'UNKNOWN';
      const entity = path.split('.')[0]?.toUpperCase() || 'UNKNOWN';
      
      // 获取用户信息
      let userName: string | null = null;
      if (ctx.session?.userId) {
        const user = await prisma.user.findUnique({
          where: { id: ctx.session.userId },
          select: { name: true },
        });
        userName = user?.name || null;
      }

      // 获取IP地址
      const headers = ctx.headers || new Headers();
      const ipAddress = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || headers.get('x-real-ip')
        || headers.get('host')
        || 'unknown';

      // 记录操作日志
      await prisma.operationLog.create({
        data: {
          userId: ctx.session?.userId || null,
          userName,
          action,
          entity,
          ipAddress,
          duration,
          success: !error,
          errorMessage: error?.message || null,
        },
      });
    } catch {
      // 操作日志记录失败不影响主流程
    }
  }
};
