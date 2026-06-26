import { z } from 'zod';
import { protectedProcedure, router } from '../router.js';
import { prisma } from '../../db/prisma.js';

export const systemSettingsRouter = router({
  getAll: protectedProcedure.query(async () => {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });
    return settings;
  }),

  getByKey: protectedProcedure.input(z.string()).query(async ({ input }) => {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: input },
    });
    if (!setting) throw new Error('设置不存在');
    return setting;
  }),

  update: protectedProcedure
    .input(
      z.object({
        key: z.string(),
        value: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const setting = await prisma.systemSetting.update({
        where: { key: input.key },
        data: { value: input.value },
      });
      return setting;
    }),

  resetToDefaults: protectedProcedure.mutation(async () => {
    const defaults = [
      { key: 'password.minLength', value: '8' },
      { key: 'password.requireUppercase', value: 'true' },
      { key: 'password.requireLowercase', value: 'true' },
      { key: 'password.requireNumbers', value: 'true' },
      { key: 'password.requireSpecialChars', value: 'false' },
      { key: 'login.maxFailedAttempts', value: '5' },
      { key: 'login.lockoutDurationMinutes', value: '30' },
      { key: 'session.timeoutMinutes', value: '480' },
      { key: 'audit.enabled', value: 'true' },
      { key: 'audit.level', value: 'info' },
    ];
    for (const d of defaults) {
      await prisma.systemSetting.upsert({
        where: { key: d.key },
        update: { value: d.value },
        create: { key: d.key, value: d.value, description: '' },
      });
    }
    return { success: true };
  }),
});
