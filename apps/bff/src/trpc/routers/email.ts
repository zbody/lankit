import { z } from 'zod';
import { protectedProcedure, router } from '../router.js';
import { prisma } from '../../db/prisma.js';
import { getSmtpConfig, initTransporter, sendEmail } from '../../utils/email.js';

const smtpSchema = z.object({
  host: z.string().min(1),
  port: z.string().min(1),
  user: z.string().min(1),
  pass: z.string().optional(),
  from: z.string().optional(),
  secure: z.string().default('false'),
});

export const emailRouter = router({
  getConfig: protectedProcedure.query(async () => {
    const config = await getSmtpConfig();
    return {
      host: config['smtp.host'] || '',
      port: config['smtp.port'] || '587',
      user: config['smtp.user'] || '',
      from: config['smtp.from'] || '',
      secure: config['smtp.secure'] || 'false',
      hasPass: !!config['smtp.pass'],
    };
  }),

  saveConfig: protectedProcedure.input(smtpSchema).mutation(async ({ input }) => {
    const settings = [
      { key: 'smtp.host', value: input.host },
      { key: 'smtp.port', value: input.port },
      { key: 'smtp.user', value: input.user },
      { key: 'smtp.from', value: input.from || input.user },
      { key: 'smtp.secure', value: input.secure },
    ];
    if (input.pass) {
      settings.push({ key: 'smtp.pass', value: input.pass });
    }
    for (const s of settings) {
      await prisma.systemSetting.upsert({
        where: { key: s.key },
        update: { value: s.value },
        create: { key: s.key, value: s.value, description: s.key },
      });
    }
    await initTransporter();
    return { success: true };
  }),

  test: protectedProcedure.input(z.object({ to: z.string().email() })).mutation(async ({ input }) => {
    const result = await sendEmail(input.to, 'Lankit 邮件测试', '<h1>测试邮件</h1><p>这是一封来自 Lankit 的测试邮件，表示 SMTP 配置正确。</p>');
    if (!result.success) throw new Error(result.error);
    return { success: true };
  }),

  logs: protectedProcedure
    .input(z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(20) }))
    .query(async ({ input }) => {
      const skip = (input.page - 1) * input.pageSize;
      const [items, total] = await Promise.all([
        prisma.emailLog.findMany({ skip, take: input.pageSize, orderBy: { createdAt: 'desc' } }),
        prisma.emailLog.count(),
      ]);
      return {
        items: items.map((l: { id: string; to: string; subject: string; content: string; status: string; errorMsg: string | null; createdAt: Date }) => ({
          ...l,
          createdAt: l.createdAt.toISOString(),
        })),
        total, page: input.page, pageSize: input.pageSize,
      };
    }),
});
