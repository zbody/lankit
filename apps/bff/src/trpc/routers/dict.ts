import { z } from 'zod';
import { protectedProcedure, router } from '../router.js';
import { prisma } from '../../db/prisma.js';
import { generateCode } from '../../utils/codegen.js';

const dictTypeSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  code: z.string().optional(),
  kind: z.enum(['STRING', 'NUMBER', 'BOOLEAN']).default('STRING'),
  sort: z.number().default(0),
  status: z.boolean().default(true),
  remark: z.string().optional(),
});

const dictDataSchema = z.object({
  dictTypeId: z.string(),
  label: z.string().min(1, '标签不能为空'),
  value: z.string().min(1, '值不能为空'),
  color: z.string().optional(),
  sort: z.number().default(0),
  status: z.boolean().default(true),
  remark: z.string().optional(),
});

export const dictRouter = router({
  // === DictType CRUD ===
  listTypes: protectedProcedure
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
          { code: { contains: input.keyword } },
        ];
      }
      const skip = (input.page - 1) * input.pageSize;
      const [items, total] = await Promise.all([
        prisma.dictType.findMany({
          where,
          skip,
          take: input.pageSize,
          orderBy: { sort: 'asc' },
          include: { _count: { select: { items: true } } },
        }),
        prisma.dictType.count({ where }),
      ]);
      return {
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          code: i.code,
          kind: i.kind,
          sort: i.sort,
          status: i.status,
          remark: i.remark,
          itemCount: i._count.items,
          createdAt: i.createdAt.toISOString(),
          updatedAt: i.updatedAt.toISOString(),
        })),
        total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  allTypes: protectedProcedure.query(async () => {
    const items = await prisma.dictType.findMany({
      where: { status: true },
      orderBy: { sort: 'asc' },
    });
    return items;
  }),

  getType: protectedProcedure.input(z.string()).query(async ({ input }) => {
    const item = await prisma.dictType.findUnique({
      where: { id: input },
      include: { items: { orderBy: { sort: 'asc' } } },
    });
    if (!item) throw new Error('字典类型不存在');
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      items: item.items.map((d) => ({
        ...d,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      })),
    };
  }),

  createType: protectedProcedure.input(dictTypeSchema).mutation(async ({ input }) => {
    const code = input.code ?? (await generateCode(prisma, 'dictType', 'DICT'));
    const item = await prisma.dictType.create({ data: { ...input, code } });
    return item;
  }),

  updateType: protectedProcedure
    .input(z.object({ id: z.string(), data: dictTypeSchema.partial() }))
    .mutation(async ({ input }) => {
      const item = await prisma.dictType.update({
        where: { id: input.id },
        data: input.data,
      });
      return item;
    }),

  deleteType: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    await prisma.dictType.delete({ where: { id: input } });
    return { success: true };
  }),

  // === DictData CRUD ===
  listData: protectedProcedure
    .input(
      z.object({
        dictTypeId: z.string(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(200).default(50),
      }),
    )
    .query(async ({ input }) => {
      const skip = (input.page - 1) * input.pageSize;
      const [items, total] = await Promise.all([
        prisma.dictData.findMany({
          where: { dictTypeId: input.dictTypeId },
          skip,
          take: input.pageSize,
          orderBy: { sort: 'asc' },
        }),
        prisma.dictData.count({ where: { dictTypeId: input.dictTypeId } }),
      ]);
      return {
        items: items.map((d) => ({
          ...d,
          createdAt: d.createdAt.toISOString(),
          updatedAt: d.updatedAt.toISOString(),
        })),
        total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  createData: protectedProcedure.input(dictDataSchema).mutation(async ({ input }) => {
    const item = await prisma.dictData.create({ data: input });
    return item;
  }),

  updateData: protectedProcedure
    .input(z.object({ id: z.string(), data: dictDataSchema.partial() }))
    .mutation(async ({ input }) => {
      const item = await prisma.dictData.update({
        where: { id: input.id },
        data: input.data,
      });
      return item;
    }),

  deleteData: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    await prisma.dictData.delete({ where: { id: input } });
    return { success: true };
  }),
});
