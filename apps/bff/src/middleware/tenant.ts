/**
 * 多租户数据隔离中间件
 *
 * 在所有受保护的过程调用中自动注入 tenantId（organizationId），
 * 确保不同组织之间的数据完全隔离。
 *
 * 管理员/超级管理员可以跨租户查询，普通用户只能访问自己的组织。
 */

import type { TRPCContext } from '../trpc/context.js';

/** 扩展后的上下文类型 */
export interface TenantContext extends TRPCContext {
  tenantId: string | null;
  isSuperAdmin: boolean;
}

/** 租户中间件 - 自动注入 organizationId 到上下文 */
export const tenantMiddleware = async ({
  ctx,
  next,
}: {
  ctx: TRPCContext;
  next: (overrideCtx: Partial<TenantContext>) => Promise<{ ctx: TenantContext }>;
}) => {
  // 如果没有登录会话，直接放行
  if (!ctx.session?.userId) {
    return next({
      tenantId: null,
      isSuperAdmin: false,
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
      tenantId: null,
      isSuperAdmin: false,
    });
  }

  // 判断是否为超级管理员（拥有 system_admin 角色）
  const isSuperAdmin = user.roles.some(
    (r: { role: { code: string } }) => r.role.code === 'system_admin',
  );

  // 确定租户 ID
  const tenantId = user.organizationId;

  return next({
    tenantId,
    isSuperAdmin,
  });
};

/**
 * 租户数据过滤辅助函数
 *
 * 在 Prisma 查询中自动附加 organizationId 过滤条件。
 * 超级管理员不受限制，普通用户只能访问自己的组织。
 *
 * @param ctx tRPC 上下文（需包含 tenantId 和 isSuperAdmin）
 * @param fieldName 要过滤的字段名（如 'organizationId'）
 * @returns 过滤条件对象
 */
export function getTenantFilter(
  ctx: Partial<TenantContext>,
  fieldName: string = 'organizationId',
): Record<string, string | null> | undefined {
  // 超级管理员或没有租户信息时不过滤
  if (ctx.isSuperAdmin || !ctx.tenantId) {
    return undefined;
  }

  return { [fieldName]: ctx.tenantId };
}
