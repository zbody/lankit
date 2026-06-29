import { z } from 'zod';
import { protectedProcedure, router } from '../router.js';
import { prisma } from '../../db/prisma.js';

const THEME_KEY = 'theme.primary';

export const themeRouter = router({
  /** 获取主题配置 */
  getConfig: protectedProcedure.query(async () => {
    const setting = await prisma.systemSetting.findUnique({ where: { key: THEME_KEY } });
    return { primary: setting?.value || '#1677ff' };
  }),

  /** 保存主题配置 */
  saveConfig: protectedProcedure
    .input(z.object({ primary: z.string() }))
    .mutation(async ({ input }) => {
      await prisma.systemSetting.upsert({
        where: { key: THEME_KEY },
        update: { value: input.primary },
        create: { key: THEME_KEY, value: input.primary, description: '主题主色' },
      });
      return { success: true };
    }),
});
