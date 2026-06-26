import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../router.js';
import { prisma } from '../../db/prisma.js';
import { generateCode } from '../../utils/codegen.js';

const menuSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  code: z.string().optional(),
  parentId: z.string().nullable().optional(),
  path: z.string().nullish(),
  component: z.string().nullish(),
  icon: z.string().nullish(),
  type: z.enum(['DIRECTORY', 'MENU', 'BUTTON']).default('MENU'),
  permission: z.string().nullish(),
  sort: z.number().default(0),
  isVisible: z.boolean().default(true),
  isCache: z.boolean().default(false),
});

export const menuRouter = router({
  tree: publicProcedure.query(async () => {
    const menus = await prisma.menu.findMany({
      orderBy: { sort: 'asc' },
      include: { children: true },
    });
    return menus;
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
        prisma.menu.findMany({
          skip,
          take: input.pageSize,
          orderBy: { sort: 'asc' },
          include: { parent: { select: { id: true, name: true } } },
        }),
        prisma.menu.count(),
      ]);
      return {
        items: items.map((i: { id: string; name: string; code: string; parentId: string | null; path: string | null; component: string | null; icon: string | null; type: string; permission: string | null; sort: number; isVisible: boolean; isCache: boolean; createdAt: Date; updatedAt: Date }) => ({
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
    const item = await prisma.menu.findUnique({
      where: { id: input },
      include: { parent: { select: { id: true, name: true } } },
    });
    if (!item) throw new Error('菜单不存在');
    return item;
  }),

  create: protectedProcedure.input(menuSchema).mutation(async ({ input }) => {
    const code = input.code ?? (await generateCode(prisma, 'menu', 'MENU'));
    const item = await prisma.menu.create({ data: { ...input, code } });
    return item;
  }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: menuSchema.partial() }))
    .mutation(async ({ input }) => {
      // 禁止关闭菜单管理的可见性
      if (input.data.isVisible === false) {
        const target = await prisma.menu.findUnique({ where: { id: input.id } });
        if (target?.path === '/menus') {
          throw new Error('菜单管理的可见性不能关闭');
        }
      }
      const item = await prisma.menu.update({
        where: { id: input.id },
        data: input.data,
      });
      return item;
    }),

  delete: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    const children = await prisma.menu.count({ where: { parentId: input } });
    if (children > 0) throw new Error('请先删除子菜单');
    await prisma.menu.delete({ where: { id: input } });
    return { success: true };
  }),

  // 用户-菜单绑定（直接授权）
  bindUsers: protectedProcedure
    .input(z.object({ menuId: z.string(), userIds: z.array(z.string()) }))
    .mutation(async ({ input }) => {
      await prisma.userMenu.deleteMany({ where: { menuId: input.menuId } });
      if (input.userIds.length > 0) {
        await prisma.userMenu.createMany({
          data: input.userIds.map((userId) => ({ userId, menuId: input.menuId })),
        });
      }
      return { success: true };
    }),

  // 当前用户菜单树（含角色继承 + 直接绑定）
  myMenus: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.session.userId },
      include: {
        roles: {
          include: { role: { include: { menus: { select: { menuId: true } } } } },
        },
        menus: { select: { menuId: true } },
      },
    });
    if (!user) return { menus: [], menuIds: [] };

    // 收集所有菜单 ID（角色继承 + 直接绑定）
    const roleMenuIds = new Set<string>();
    for (const ur of user.roles) {
      for (const rm of ur.role.menus) {
        roleMenuIds.add(rm.menuId);
      }
    }
    const directMenuIds = new Set(user.menus.map((um: { menuId: string }) => um.menuId));

    const allIds = [...roleMenuIds, ...directMenuIds];
    const menus = await prisma.menu.findMany({
      where: { id: { in: allIds } },
      orderBy: { sort: 'asc' },
    });

    return {
      menuIds: allIds,
      menus: menus.map((m: { id: string; name: string; code: string; parentId: string | null; path: string | null; component: string | null; icon: string | null; type: string; permission: string | null; sort: number; isVisible: boolean; isCache: boolean; createdAt: Date; updatedAt: Date }) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })),
    };
  }),

  // 查看用户绑定的菜单（含角色继承）
  userMenus: protectedProcedure.input(z.string()).query(async ({ input: userId }) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: { include: { menus: { select: { menuId: true } } } } } },
        menus: { select: { menuId: true } },
      },
    });
    if (!user) throw new Error('用户不存在');

    // 收集所有菜单 ID（角色继承 + 直接绑定）
    const roleMenuIds = new Set<string>();
    for (const ur of user.roles) {
      for (const rm of ur.role.menus) {
        roleMenuIds.add(rm.menuId);
      }
    }
    const directMenuIds = new Set(user.menus.map((um: { menuId: string }) => um.menuId));

    const allIds = new Set([...roleMenuIds, ...directMenuIds]);
    const menus = await prisma.menu.findMany({
      where: { id: { in: [...allIds] } },
      orderBy: { sort: 'asc' },
    });

    return {
      menuIds: [...allIds],
      menus: menus.map((m: { id: string; name: string; code: string; parentId: string | null; path: string | null; component: string | null; icon: string | null; type: string; permission: string | null; sort: number; isVisible: boolean; isCache: boolean; createdAt: Date; updatedAt: Date }) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })),
    };
  }),
});
