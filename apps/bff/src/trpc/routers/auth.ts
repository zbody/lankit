import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { z } from 'zod';
import speakeasy from 'speakeasy';
import { publicProcedure, protectedProcedure, router } from '../router.js';
import { signToken, verifyToken, checkLoginProtection, recordLoginAttempt, blacklistToken } from '../../middleware/auth.js';
import type { JwtPayload } from '../../middleware/auth.js';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema, changePasswordSchema } from '@platform/shared';
import { prisma } from '../../db/prisma.js';
import { sendEmail } from '../../utils/email.js';

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

      const roleCodes = user.roles.map((r: { role: { code: string } }) => r.role.code);

      // 检查 MFA
      const mfa = await prisma.userMfa.findUnique({ where: { userId: user.id } });
      if (mfa?.enabled) {
        // 返回临时标识，前端需要额外验证 MFA
        const mfaToken = signToken({ userId: user.id, roles: roleCodes, mfaPending: true }, '15m');
        return {
          mfaRequired: true,
          mfaMethod: mfa.method,
          mfaToken,
          user: { id: user.id, email: user.email, name: user.name, roles: roleCodes },
        };
      }

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
        where: { id: ctx.session!.userId },
        include: { roles: { include: { role: true } } },
      });
      if (!user) {
        throw new Error('用户不存在');
      }
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles.map((r: { role: { code: string; name: string } }) => ({ code: r.role.code, name: r.role.name })),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };
    }),

  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      // 获取当前请求的 token 并加入黑名单
      const token = ctx.headers?.get('authorization')?.slice(7) || null;
      if (token) {
        await blacklistToken(token);
      }
      return { success: true };
    }),

  forgotPassword: publicProcedure
    .input(forgotPasswordSchema)
    .mutation(async ({ input }) => {
      const user = await prisma.user.findUnique({ where: { email: input.email } });
      // 即使用户不存在也返回成功（防止枚举攻击）
      if (!user) return { success: true, message: '如果该邮箱存在，重置链接已发送' };

      // 生成 32 字节随机 token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      // 1 小时后过期
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // 使之前的 token 失效
      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null, expiresAt: { gte: new Date() } },
        data: { usedAt: new Date() },
      });

      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      });

      // 构建重置链接
      const resetUrl = `${process.env.ADMIN_URL || 'http://localhost:5175'}/reset-password?token=${rawToken}`;

      await sendEmail(
        user.email,
        '密码重置 - Lankit Admin',
        `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>密码重置</h2>
          <p>您好 ${user.name}，</p>
          <p>请点击下方链接重置您的密码（链接 1 小时内有效）：</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 6px; margin: 16px 0;">重置密码</a>
          <p style="color: #94a3b8; font-size: 14px;">如果无法点击，请复制以下链接到浏览器：<br/>${resetUrl}</p>
        </div>`,
      );

      return { success: true, message: '如果该邮箱存在，重置链接已发送' };
    }),

  resetPassword: publicProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ input }) => {
      const tokenHash = crypto.createHash('sha256').update(input.token).digest('hex');

      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { tokenHash },
      });

      if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
        throw new Error('重置链接无效或已过期');
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      await prisma.$transaction([
        prisma.passwordResetToken.update({
          where: { id: resetToken.id },
          data: { usedAt: new Date() },
        }),
        prisma.user.update({
          where: { id: resetToken.userId },
          data: { password: hashedPassword },
        }),
      ]);

      return { success: true, message: '密码已重置，请重新登录' };
    }),

  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session!.userId;
      const data: Record<string, string> = {};
      if (input.name) data.name = input.name;

      const user = await prisma.user.update({
        where: { id: userId },
        data,
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };
    }),

  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session!.userId;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('用户不存在');

      const valid = await bcrypt.compare(input.currentPassword, user.password);
      if (!valid) throw new Error('当前密码错误');

      const hashedPassword = await bcrypt.hash(input.newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return { success: true, message: '密码已修改' };
    }),

  verifyMfa: publicProcedure
    .input(z.object({ mfaToken: z.string().min(1), code: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const payload = verifyToken(input.mfaToken) as JwtPayload | null;
      if (!payload || !payload.mfaPending) throw new Error('MFA 令牌无效或已过期');

      const mfa = await prisma.userMfa.findUnique({ where: { userId: payload.userId } });
      if (!mfa?.enabled) throw new Error('MFA 未启用');

      const verified = speakeasy.totp.verify({ secret: mfa.secret, encoding: 'base32', token: input.code });
      if (!verified) throw new Error('验证码错误');

      const token = signToken({ userId: payload.userId, roles: payload.roles });

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { roles: { include: { role: true } } },
      });

      return {
        user: {
          id: user!.id,
          email: user!.email,
          name: user!.name,
          roles: user!.roles.map((r: { role: { code: string } }) => r.role.code),
          createdAt: user!.createdAt.toISOString(),
          updatedAt: user!.updatedAt.toISOString(),
        },
        token,
      };
    }),
});
