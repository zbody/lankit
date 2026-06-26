import bcrypt from 'bcryptjs';
import { publicProcedure, protectedProcedure, router } from '../router.js';
import { signToken, checkLoginProtection, recordLoginAttempt } from '../../middleware/auth.js';
import { loginSchema, registerSchema } from '@platform/shared';
import { prisma } from '../../db/prisma.js';

export const authRouter = router({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input }) => {
      const existing = await prisma.user.findUnique({ where: { email: input.email } });
      if (existing) {
        throw new Error('该邮箱已被注册');
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      const user = await prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          password: hashedPassword,
        },
      });

      const token = signToken({ userId: user.id, roles: [] });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: [],
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
        token,
      };
    }),

  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input, ctx }) => {
      // 获取 IP 和 User-Agent
      const headers = ctx.headers || new Headers();
      const ipAddress = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || headers.get('x-real-ip')
        || headers.get('host')
        || 'unknown';
      const userAgent = headers.get('user-agent') || 'unknown';

      // 检查登录失败保护
      const protection = await checkLoginProtection(input.email, ipAddress);
      if (!protection.allowed) {
        await recordLoginAttempt(input.email, false, ipAddress, userAgent, protection.reason);
        throw new Error(protection.reason || '登录失败次数过多，请稍后再试');
      }

      const user = await prisma.user.findUnique({
        where: { email: input.email },
        include: { roles: { include: { role: true } } },
      });

      if (!user) {
        await recordLoginAttempt(input.email, false, ipAddress, userAgent, '用户不存在');
        throw new Error('邮箱或密码错误');
      }

      const valid = await bcrypt.compare(input.password, user.password);
      if (!valid) {
        await recordLoginAttempt(input.email, false, ipAddress, userAgent, '密码错误');
        throw new Error('邮箱或密码错误');
      }

      // 登录成功，清除该用户之前的失败记录
      await prisma.loginAttempt.deleteMany({
        where: { email: input.email, success: false },
      });

      const roleCodes = user.roles.map((r) => r.role.code);
      const token = signToken({ userId: user.id, roles: roleCodes });

      await recordLoginAttempt(input.email, true, ipAddress, userAgent);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: roleCodes,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
        token,
      };
    }),

  me: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await prisma.user.findUnique({
        where: { id: ctx.session.userId },
        include: { roles: { include: { role: true } } },
      });
      if (!user) {
        throw new Error('用户不存在');
      }
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles.map((r) => ({ code: r.role.code, name: r.role.name })),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };
    }),
});
