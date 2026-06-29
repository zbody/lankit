import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { protectedProcedure, router } from '../router.js';
import { prisma } from '../../db/prisma.js';

async function validatePassword(password: string): Promise<void> {
  const settings = await prisma.systemSetting.findMany({
    where: { key: { startsWith: 'password.' } },
  });
  const map = Object.fromEntries(settings.map((s: { key: string; value: string }) => [s.key, s.value]));

  const minLength = parseInt(map['password.minLength'] ?? '8', 10);
  const requireUppercase = map['password.requireUppercase'] === 'true';
  const requireLowercase = map['password.requireLowercase'] === 'true';
  const requireNumbers = map['password.requireNumbers'] === 'true';
  const requireSpecialChars = map['password.requireSpecialChars'] === 'true';

  const errors: string[] = [];
  if (password.length < minLength) {
    errors.push(`密码长度不能小于 ${minLength} 位`);
  }
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母');
  }
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母');
  }
  if (requireNumbers && !/[0-9]/.test(password)) {
    errors.push('密码必须包含数字');
  }
  if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('密码必须包含特殊字符');
  }
  if (errors.length > 0) {
    throw new Error(errors.join('；'));
  }
}

const createUserSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  name: z.string().min(1, '名称不能为空'),
  password: z.string().min(1, '密码不能为空'),
  organizationId: z.string().nullable().optional(),
  roleIds: z.array(z.string()).optional(),
});

const updateUserSchema = z.object({
  name: z.string().optional(),
  organizationId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  roleIds: z.array(z.string()).optional(),
});

export const userRouter = router({
  create: protectedProcedure.input(createUserSchema).mutation(async ({ input }) => {
    await validatePassword(input.password);

    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new Error('该邮箱已被注册');

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const { roleIds, ...userData } = input;
    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        roles: roleIds && roleIds.length > 0
          ? { create: roleIds.map((roleId) => ({ roleId })) }
          : undefined,
      },
    });
    return { id: user.id, email: user.email, name: user.name };
  }),

  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input, ctx }) => {
      const skip = (input.page - 1) * input.pageSize;
      const where: Record<string, unknown> = { deletedAt: null };
      if (ctx.tenantId && !ctx.isSuperAdmin) {
        where.organizationId = ctx.tenantId;
      }
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: input.pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            organization: { select: { id: true, name: true } },
            roles: { include: { role: { select: { id: true, name: true, code: true } } } },
          },
        }),
        prisma.user.count({ where }),
      ]);

      return {
        items: users.map((u: { id: string; email: string; name: string; isActive: boolean; organization: { id: string; name: string } | null; roles: { role: { id: string; name: string; code: string } }[]; lastLoginAt: Date | null; createdAt: Date; updatedAt: Date }) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          isActive: u.isActive,
          organization: u.organization,
          roles: u.roles.map((r: { role: { id: string; name: string; code: string } }) => r.role),
          lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
          createdAt: u.createdAt.toISOString(),
          updatedAt: u.updatedAt.toISOString(),
        })),
        total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  byId: protectedProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const where: { id: string; organizationId?: string | null } = { id: input };
      if (ctx.tenantId && !ctx.isSuperAdmin) {
        where.organizationId = ctx.tenantId;
      }
      const user = await prisma.user.findUnique({
        where,
        include: {
          organization: { select: { id: true, name: true } },
          roles: { include: { role: { select: { id: true, name: true, code: true } } } },
        },
      });
      if (!user) throw new Error('用户不存在');
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        organization: user.organization ?? null,
        roles: user.roles.map((r) => r.role),
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: updateUserSchema }))
    .mutation(async ({ input }) => {
      const { roleIds, ...userData } = input.data;
      const user = await prisma.user.update({
        where: { id: input.id },
        data: {
          ...userData,
          roles: roleIds && roleIds.length > 0
            ? {
                deleteMany: {},
                create: roleIds.map((roleId) => ({ roleId })),
              }
            : undefined,
        },
      });
      return { id: user.id, email: user.email, name: user.name };
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ input }) => {
      await prisma.user.update({ where: { id: input }, data: { deletedAt: new Date() } });
      return { success: true };
    }),

  restore: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    await prisma.user.update({ where: { id: input }, data: { deletedAt: null } });
    return { success: true };
  }),

  recycleBin: protectedProcedure.query(async () => {
    const users = await prisma.user.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
      include: {
        organization: { select: { id: true, name: true } },
        roles: { include: { role: { select: { id: true, name: true, code: true } } } },
      },
    });
    return users.map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      isActive: u.isActive,
      organization: u.organization,
      roles: u.roles.map((r: any) => r.role),
      deletedAt: u.deletedAt?.toISOString() ?? null,
    }));
  }),

  forceDelete: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    await prisma.user.delete({ where: { id: input } });
    return { success: true };
  }),

  resetPassword: protectedProcedure
    .input(z.object({ id: z.string(), password: z.string().min(6, '密码至少6位') }))
    .mutation(async ({ input }) => {
      const hashedPassword = await bcrypt.hash(input.password, 10);
      await prisma.user.update({
        where: { id: input.id },
        data: { password: hashedPassword },
      });
      return { success: true };
    }),

  /**
   * Batch soft-delete.
   *
   * Reuses the existing soft-delete shape (`{ deletedAt: new Date() }`) so the
   * recycle-bin (`recycleBin` / `restore` / `forceDelete`) continues to work
   * unchanged for batch-deleted rows.
   *
   * Idempotent at the Prisma layer (`update` returns the row either way), but
   * we still split into "found existing" vs "missing" so the caller gets an
   * honest report instead of pretending everything succeeded.
   */
  batchDelete: protectedProcedure
    .input(z.object({ ids: z.array(z.string()).min(1, '至少选择一个用户') }))
    .mutation(async ({ input }) => {
      const uniqueIds = Array.from(new Set(input.ids));
      const result = await prisma.$transaction(async (tx) => {
        const existing = await tx.user.findMany({
          where: { id: { in: uniqueIds }, deletedAt: null },
          select: { id: true },
        });
        const existingIds = new Set(existing.map((u) => u.id));
        if (existingIds.size > 0) {
          await tx.user.updateMany({
            where: { id: { in: Array.from(existingIds) } },
            data: { deletedAt: new Date() },
          });
        }
        const missing = uniqueIds.filter((id) => !existingIds.has(id));
        return { affected: existingIds.size, missing };
      });
      return result;
    }),

  /**
   * Batch role assignment. Replaces the entire role set for every targeted user.
   * Mirrors the single-user update path (deleteMany + create) so the
   * UserRole @@unique([userId, roleId]) invariant is preserved across both APIs.
   */
  batchAssignRoles: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string()).min(1, '至少选择一个用户'),
        roleIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ input }) => {
      const uniqueUserIds = Array.from(new Set(input.ids));
      const uniqueRoleIds = Array.from(new Set(input.roleIds));
      const result = await prisma.$transaction(async (tx) => {
        const existing = await tx.user.findMany({
          where: { id: { in: uniqueUserIds }, deletedAt: null },
          select: { id: true },
        });
        const existingIds = new Set(existing.map((u) => u.id));
        const targets = Array.from(existingIds);
        if (targets.length > 0) {
          await tx.userRole.deleteMany({ where: { userId: { in: targets } } });
          if (uniqueRoleIds.length > 0) {
            const rows = targets.flatMap((userId) =>
              uniqueRoleIds.map((roleId) => ({ userId, roleId })),
            );
            await tx.userRole.createMany({ data: rows });
          }
        }
        const missing = uniqueUserIds.filter((id) => !existingIds.has(id));
        return { affected: existingIds.size, missing };
      });
      return result;
    }),

  /**
   * Batch organization adjustment. Pass `null` to clear the org on every target.
   */
  batchAdjustOrganization: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string()).min(1, '至少选择一个用户'),
        organizationId: z.string().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const uniqueIds = Array.from(new Set(input.ids));
      const result = await prisma.$transaction(async (tx) => {
        const existing = await tx.user.findMany({
          where: { id: { in: uniqueIds }, deletedAt: null },
          select: { id: true },
        });
        const existingIds = new Set(existing.map((u) => u.id));
        const targets = Array.from(existingIds);
        if (targets.length > 0) {
          await tx.user.updateMany({
            where: { id: { in: targets } },
            data: { organizationId: input.organizationId },
          });
        }
        const missing = uniqueIds.filter((id) => !existingIds.has(id));
        return { affected: existingIds.size, missing };
      });
      return result;
    }),
});
