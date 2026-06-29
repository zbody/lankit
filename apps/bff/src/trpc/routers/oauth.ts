import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '../router.js';
import { prisma } from '../../db/prisma.js';

const providerSchema = z.object({
  provider: z.enum(['GITHUB', 'GOOGLE', 'WECHAT', 'DINGTALK', 'FEISHU']),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  redirectUri: z.string().optional(),
  enabled: z.boolean().default(true),
});

export const oauthRouter = router({
  /** 获取已启用的 OAuth 提供方列表（公开） */
  providers: publicProcedure.query(async () => {
    const settings = await prisma.systemSetting.findMany({
      where: { key: { startsWith: 'oauth.' } },
    });
    const config: Record<string, string> = {};
    for (const s of settings) config[s.key] = s.value;

    const providers = ['GITHUB', 'GOOGLE', 'WECHAT', 'DINGTALK', 'FEISHU'];
    return providers
      .filter((p) => config[`oauth.${p}.enabled`] === 'true')
      .map((p) => ({
        provider: p,
        clientId: config[`oauth.${p}.clientId`] || '',
        redirectUri: config[`oauth.${p}.redirectUri`] || '',
      }));
  }),

  /** 获取所有 OAuth 提供方配置（管理端） */
  allProviders: protectedProcedure.query(async () => {
    const settings = await prisma.systemSetting.findMany({
      where: { key: { startsWith: 'oauth.' } },
    });
    const config: Record<string, string> = {};
    for (const s of settings) config[s.key] = s.value;

    const providers = ['GITHUB', 'GOOGLE', 'WECHAT', 'DINGTALK', 'FEISHU'];
    return providers.map((p) => ({
      provider: p,
      clientId: config[`oauth.${p}.clientId`] || '',
      hasSecret: !!config[`oauth.${p}.clientSecret`],
      redirectUri: config[`oauth.${p}.redirectUri`] || '',
      enabled: config[`oauth.${p}.enabled`] === 'true',
    }));
  }),

  /** 保存 OAuth 提供方配置 */
  saveProvider: protectedProcedure.input(providerSchema).mutation(async ({ input }) => {
    const entries = [
      { key: `oauth.${input.provider}.clientId`, value: input.clientId },
      { key: `oauth.${input.provider}.clientSecret`, value: input.clientSecret },
      { key: `oauth.${input.provider}.enabled`, value: String(input.enabled) },
    ];
    if (input.redirectUri) {
      entries.push({ key: `oauth.${input.provider}.redirectUri`, value: input.redirectUri });
    }
    for (const e of entries) {
      await prisma.systemSetting.upsert({
        where: { key: e.key },
        update: { value: e.value },
        create: { key: e.key, value: e.value, description: `OAuth ${input.provider} ${e.key.split('.').pop()}` },
      });
    }
    return { success: true };
  }),

  /** 获取用户的 OAuth 绑定列表 */
  userBindings: protectedProcedure
    .input(z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(20) }))
    .query(async ({ input }) => {
      const skip = (input.page - 1) * input.pageSize;
      const [items, total] = await Promise.all([
        prisma.userOAuth.findMany({
          skip,
          take: input.pageSize,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, email: true, name: true } } },
        }),
        prisma.userOAuth.count(),
      ]);
      return {
        items: items.map((o: { id: string; userId: string; provider: string; providerId: string; avatarUrl: string | null; rawData: string | null; createdAt: Date; user: { id: string; email: string; name: string } }) => ({
          ...o,
          createdAt: o.createdAt.toISOString(),
        })),
        total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  /** 解绑 OAuth 账号 */
  unbind: protectedProcedure.input(z.string()).mutation(async ({ input, ctx }) => {
    await prisma.userOAuth.deleteMany({ where: { id: input, userId: ctx.session!.userId } });
    return { success: true };
  }),
});
