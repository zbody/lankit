import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../router.js';
import { prisma } from '../../db/prisma.js';
import { generateCode } from '../../utils/codegen.js';

const orgSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  code: z.string().optional(),
  parentId: z.string().nullable().optional(),
  sort: z.number().default(0),
});

export const orgRouter = router({
  tree: publicProcedure.query(async () => {
    const orgs = await prisma.organization.findMany({
      orderBy: { sort: 'asc' },
      include: { children: true },
    });
    return orgs;
  }),

  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input }) => {
      const skip = (input.page - 1) * input.pageSize;
      const [items, total] = await Promise.all([
        prisma.organization.findMany({
          skip,
          take: input.pageSize,
          orderBy: { sort: 'asc' },
          include: { parent: { select: { id: true, name: true } } },
        }),
        prisma.organization.count(),
      ]);
      return {
        items: items.map((i) => ({
          ...i,
          createdAt: i.createdAt.toISOString(),
          updatedAt: i.updatedAt.toISOString(),
        })),
        total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  byId: publicProcedure.input(z.string()).query(async ({ input }) => {
    const item = await prisma.organization.findUnique({
      where: { id: input },
      include: { parent: { select: { id: true, name: true } } },
    });
    if (!item) throw new Error('组织不存在');
    return item;
  }),

  create: protectedProcedure.input(orgSchema).mutation(async ({ input }) => {
    const code = input.code ?? (await generateCode(prisma, 'organization', 'ORG'));
    const item = await prisma.organization.create({ data: { ...input, code } });
    return item;
  }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: orgSchema.partial() }))
    .mutation(async ({ input }) => {
      const item = await prisma.organization.update({
        where: { id: input.id },
        data: input.data,
      });
      return item;
    }),

  delete: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    const children = await prisma.organization.count({ where: { parentId: input } });
    if (children > 0) throw new Error('请先删除子组织');
    await prisma.organization.delete({ where: { id: input } });
    return { success: true };
  }),
});
