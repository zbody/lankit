import { z } from 'zod';
import { protectedProcedure, router } from '../router.js';
import { prisma } from '../../db/prisma.js';

const announcementSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  content: z.string().min(1, '内容不能为空'),
  level: z.enum(['INFO', 'WARNING', 'IMPORTANT']).default('INFO'),
  status: z.boolean().default(true),
  sort: z.number().default(0),
});

export const announcementRouter = router({
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
          { title: { contains: input.keyword } },
          { content: { contains: input.keyword } },
        ];
      }
      const skip = (input.page - 1) * input.pageSize;
      const [items, total] = await Promise.all([
        prisma.announcement.findMany({
          where,
          skip,
          take: input.pageSize,
          orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
        }),
        prisma.announcement.count({ where }),
      ]);
      return {
        items: items.map((a: { id: string; title: string; content: string; level: string; status: boolean; sort: number; createdBy: string | null; createdAt: Date; updatedAt: Date }) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
          updatedAt: a.updatedAt.toISOString(),
        })),
        total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  getById: protectedProcedure.input(z.string()).query(async ({ input }) => {
    const item = await prisma.announcement.findUnique({ where: { id: input } });
    if (!item) throw new Error('公告不存在');
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }),

  create: protectedProcedure.input(announcementSchema).mutation(async ({ input, ctx }) => {
    const item = await prisma.announcement.create({
      data: { ...input, createdBy: ctx.session!.userId },
    });
    return item;
  }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: announcementSchema.partial() }))
    .mutation(async ({ input }) => {
      const item = await prisma.announcement.update({
        where: { id: input.id },
        data: input.data,
      });
      return item;
    }),

  delete: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    await prisma.announcement.delete({ where: { id: input } });
    return { success: true };
  }),

  // 获取已发布的公告列表（供弹窗使用）
  published: protectedProcedure.query(async () => {
    const items = await prisma.announcement.findMany({
      where: { status: true },
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });
    return items.map((a: { id: string; title: string; content: string; level: string; status: boolean; sort: number; createdBy: string | null; createdAt: Date; updatedAt: Date }) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));
  }),
});
