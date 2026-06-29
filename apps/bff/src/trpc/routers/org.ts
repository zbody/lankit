import { z } from 'zod';
import { protectedProcedure, router } from '../router.js';
import { prisma } from '../../db/prisma.js';
import { generateCode } from '../../utils/codegen.js';

const orgSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  code: z.string().optional(),
  parentId: z.string().nullable().optional(),
  sort: z.number().default(0),
});

export const orgRouter = router({
  tree: protectedProcedure.query(async ({ ctx }) => {
    const where: Record<string, unknown> = { deletedAt: null };
    if (ctx.tenantId && !ctx.isSuperAdmin) {
      where.id = ctx.tenantId;
    }
    const orgs = await prisma.organization.findMany({
      where,
      orderBy: { sort: 'asc' },
      include: { children: true },
    });
    return orgs;
  }),

  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input, ctx }) => {
      const skip = (input.page - 1) * input.pageSize;
      const where: Record<string, unknown> = { deletedAt: null };
      if (ctx.tenantId && !ctx.isSuperAdmin) {
        where.id = ctx.tenantId;
      }
      const [items, total] = await Promise.all([
        prisma.organization.findMany({
          where,
          skip,
          take: input.pageSize,
          orderBy: { sort: 'asc' },
          include: { parent: { select: { id: true, name: true } } },
        }),
        prisma.organization.count({ where }),
      ]);
      return {
        items: items.map((i: { id: string; name: string; code: string; parentId: string | null; sort: number; createdAt: Date; updatedAt: Date }) => ({
          ...i,
          createdAt: i.createdAt.toISOString(),
          updatedAt: i.updatedAt.toISOString(),
        })),
        total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  byId: protectedProcedure.input(z.string()).query(async ({ input, ctx }) => {
    const where: Record<string, string> = { id: input };
    if (ctx.tenantId && !ctx.isSuperAdmin) {
      where.id = ctx.tenantId;
    }
    const item = await prisma.organization.findFirst({
      where: { ...where, deletedAt: null },
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
    const children = await prisma.organization.count({ where: { parentId: input, deletedAt: null } });
    if (children > 0) throw new Error('请先删除子组织');
    const userCount = await prisma.user.count({ where: { organizationId: input, deletedAt: null } });
    if (userCount > 0) throw new Error('该组织下存在用户，无法删除');
    await prisma.organization.update({ where: { id: input }, data: { deletedAt: new Date() } });
    return { success: true };
  }),

  restore: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    await prisma.organization.update({ where: { id: input }, data: { deletedAt: null } });
    return { success: true };
  }),

  recycleBin: protectedProcedure.query(async () => {
    const items = await prisma.organization.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
    });
    return items.map((i: any) => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
      deletedAt: i.deletedAt?.toISOString() ?? null,
    }));
  }),

  forceDelete: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    await prisma.organization.delete({ where: { id: input } });
    return { success: true };
  }),
});
