import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../router.js';
import { prisma } from '../../db/prisma.js';
import { generateCode } from '../../utils/codegen.js';

const roleSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  code: z.string().optional(),
  description: z.string().optional(),
  sort: z.number().default(0),
});

export const roleRouter = router({
  listAll: publicProcedure.query(async () => {
    const roles = await prisma.role.findMany({ orderBy: { sort: 'asc' } });
    return roles;
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
        prisma.role.findMany({
          skip,
          take: input.pageSize,
          orderBy: { sort: 'asc' },
          include: {
            menus: { select: { menuId: true } },
            _count: { select: { users: true } },
          },
        }),
        prisma.role.count(),
      ]);
      return {
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          code: i.code,
          description: i.description,
          isSystem: i.isSystem,
          sort: i.sort,
          menuIds: i.menus.map((m) => m.menuId),
          userCount: i._count.users,
          createdAt: i.createdAt.toISOString(),
          updatedAt: i.updatedAt.toISOString(),
        })),
        total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  byId: publicProcedure.input(z.string()).query(async ({ input }) => {
    const item = await prisma.role.findUnique({
      where: { id: input },
      include: {
        menus: { select: { menuId: true } },
        users: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });
    if (!item) throw new Error('角色不存在');
    return {
      ...item,
      menuIds: item.menus.map((m) => m.menuId),
      users: item.users.map((u) => u.user),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }),

  create: protectedProcedure.input(roleSchema).mutation(async ({ input }) => {
    const code = input.code ?? (await generateCode(prisma, 'role', 'ROLE'));
    const item = await prisma.role.create({ data: { ...input, code } });
    return item;
  }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: roleSchema.partial() }))
    .mutation(async ({ input }) => {
      const item = await prisma.role.update({
        where: { id: input.id },
        data: input.data,
      });
      return item;
    }),

  delete: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    await prisma.role.delete({ where: { id: input } });
    return { success: true };
  }),

  // 角色-菜单绑定
  bindMenus: protectedProcedure
    .input(z.object({ roleId: z.string(), menuIds: z.array(z.string()) }))
    .mutation(async ({ input }) => {
      await prisma.roleMenu.deleteMany({ where: { roleId: input.roleId } });
      if (input.menuIds.length > 0) {
        await prisma.roleMenu.createMany({
          data: input.menuIds.map((menuId) => ({ roleId: input.roleId, menuId })),
        });
      }
      return { success: true };
    }),
});
