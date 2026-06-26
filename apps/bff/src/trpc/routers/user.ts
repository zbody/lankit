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
    .query(async ({ input }) => {
      const skip = (input.page - 1) * input.pageSize;
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip,
          take: input.pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            organization: { select: { id: true, name: true } },
            roles: { include: { role: { select: { id: true, name: true, code: true } } } },
          },
        }),
        prisma.user.count(),
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
    .query(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { id: input },
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
        organization: user.organization,
        roles: user.roles.map((r: { role: { id: string; name: string; code: string } }) => r.role),
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
});
