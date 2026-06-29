import { z } from 'zod';
import speakeasy from 'speakeasy';
import { protectedProcedure, router } from '../router.js';
import { prisma } from '../../db/prisma.js';

export const mfaRouter = router({
  status: protectedProcedure.query(async ({ ctx }) => {
    const mfa = await prisma.userMfa.findUnique({ where: { userId: ctx.session!.userId } });
    return { enabled: mfa?.enabled ?? false, method: mfa?.method ?? 'TOTP' };
  }),

  setup: protectedProcedure.mutation(async ({ ctx }) => {
    const secret = speakeasy.generateSecret({ name: `Lankit:${ctx.session!.userId}` });
    // 保存 secret 但不启用
    await prisma.userMfa.upsert({
      where: { userId: ctx.session!.userId },
      update: { secret: secret.base32!, method: 'TOTP' },
      create: { userId: ctx.session!.userId, secret: secret.base32!, method: 'TOTP' },
    });
    return { secret: secret.base32!, otpauthUrl: secret.otpauth_url ?? '' };
  }),

  verify: protectedProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const mfa = await prisma.userMfa.findUnique({ where: { userId: ctx.session!.userId } });
      if (!mfa) throw new Error('请先完成设置');
      const verified = speakeasy.totp.verify({ secret: mfa.secret, encoding: 'base32', token: input.token });
      if (!verified) throw new Error('验证码错误');
      await prisma.userMfa.update({ where: { userId: ctx.session!.userId }, data: { enabled: true } });
      return { success: true };
    }),

  disable: protectedProcedure.mutation(async ({ ctx }) => {
    await prisma.userMfa.update({ where: { userId: ctx.session!.userId }, data: { enabled: false } });
    return { success: true };
  }),
});
