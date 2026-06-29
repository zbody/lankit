import { z } from 'zod';
import { createHash, randomBytes } from 'node:crypto';
import { protectedProcedure, router } from '../router.js';
import { prisma } from '../../db/prisma.js';

function generateKey(): { key: string; secret: string } {
  const prefix = 'lk';
  const key = `${prefix}_${randomBytes(8).toString('hex')}`;
  const secret = `${prefix}_${randomBytes(24).toString('hex')}`;
  return { key, secret };
}

function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

const apiKeySchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  expiresAt: z.string().nullable().optional(),
});

export const apiKeyRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        keyword: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const where: Record<string, unknown> = {};
      if (input.keyword) {
        where.OR = [
          { name: { contains: input.keyword } },
          { key: { contains: input.keyword } },
        ];
      }
      const skip = (input.page - 1) * input.pageSize;
      const [items, total] = await Promise.all([
        prisma.apiKey.findMany({
          where,
          skip,
          take: input.pageSize,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.apiKey.count({ where }),
      ]);
      return {
        items: items.map((k: { id: string; name: string; key: string; secretHash: string; lastUsedAt: Date | null; expiresAt: Date | null; status: boolean; createdBy: string | null; createdAt: Date; updatedAt: Date }) => ({
          id: k.id,
          name: k.name,
          key: k.key,
          lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
          expiresAt: k.expiresAt?.toISOString() ?? null,
          status: k.status,
          createdBy: k.createdBy,
          createdAt: k.createdAt.toISOString(),
          updatedAt: k.updatedAt.toISOString(),
        })),
        total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  create: protectedProcedure.input(apiKeySchema).mutation(async ({ input, ctx }) => {
    const { key, secret } = generateKey();
    const secretHash = hashSecret(secret);
    const item = await prisma.apiKey.create({
      data: {
        name: input.name,
        key,
        secretHash,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        createdBy: ctx.session!.userId,
      },
    });
    // 明文 secret 仅在创建时返回一次
    return {
      id: item.id,
      key: item.key,
      secret,
      name: item.name,
    };
  }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: apiKeySchema.partial() }))
    .mutation(async ({ input }) => {
      const data: Record<string, unknown> = {};
      if (input.data.name !== undefined) data.name = input.data.name;
      if (input.data.expiresAt !== undefined) {
        data.expiresAt = input.data.expiresAt ? new Date(input.data.expiresAt) : null;
      }
      const item = await prisma.apiKey.update({
        where: { id: input.id },
        data,
      });
      return item;
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.string(), status: z.boolean() }))
    .mutation(async ({ input }) => {
      const item = await prisma.apiKey.update({
        where: { id: input.id },
        data: { status: input.status },
      });
      return item;
    }),

  delete: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    await prisma.apiKey.delete({ where: { id: input } });
    return { success: true };
  }),

  regenerate: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    const { key, secret } = generateKey();
    const secretHash = hashSecret(secret);
    await prisma.apiKey.update({
      where: { id: input },
      data: { key, secretHash },
    });
    return { key, secret };
  }),
});
