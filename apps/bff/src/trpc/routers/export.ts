import { z } from 'zod';
import { protectedProcedure, router } from '../router.js';
import { prisma } from '../../db/prisma.js';

export const exportRouter = router({
  /**
   * 导出用户列表为 Excel
   */
  exportUsers: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(10000).default(100),
    }))
    .mutation(async ({ input }) => {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.default.Workbook();
      const worksheet = workbook.addWorksheet('用户列表');

      worksheet.columns = [
        { header: '邮箱', key: 'email', width: 30 },
        { header: '名称', key: 'name', width: 20 },
        { header: '组织', key: 'organization', width: 25 },
        { header: '角色', key: 'roles', width: 30 },
        { header: '状态', key: 'isActive', width: 10 },
        { header: '创建时间', key: 'createdAt', width: 20 },
      ];

      const users = await prisma.user.findMany({
        where: { deletedAt: null },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          organization: { select: { name: true } },
          roles: { include: { role: { select: { name: true } } } },
        },
      });

      users.forEach((u) => {
        worksheet.addRow({
          email: u.email,
          name: u.name,
          organization: u.organization?.name || '',
          roles: u.roles.map((r) => r.role.name).join(', '),
          isActive: u.isActive ? '启用' : '禁用',
          createdAt: u.createdAt.toISOString(),
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      return {
        filename: `用户列表_${new Date().toISOString().slice(0, 10)}.xlsx`,
        data: Buffer.from(buffer).toString('base64'),
      };
    }),

  /**
   * 导出组织列表为 Excel
   */
  exportOrgs: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(10000).default(100),
    }))
    .mutation(async ({ input }) => {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.default.Workbook();
      const worksheet = workbook.addWorksheet('组织列表');

      worksheet.columns = [
        { header: '名称', key: 'name', width: 20 },
        { header: '编码', key: 'code', width: 20 },
        { header: '父组织', key: 'parent', width: 25 },
        { header: '排序号', key: 'sort', width: 10 },
        { header: '创建时间', key: 'createdAt', width: 20 },
      ];

      const orgs = await prisma.organization.findMany({
        where: { deletedAt: null },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        orderBy: { sort: 'asc' },
        include: { parent: { select: { name: true } } },
      });

      orgs.forEach((o) => {
        worksheet.addRow({
          name: o.name,
          code: o.code,
          parent: o.parent?.name || '',
          sort: o.sort,
          createdAt: o.createdAt.toISOString(),
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      return {
        filename: `组织列表_${new Date().toISOString().slice(0, 10)}.xlsx`,
        data: Buffer.from(buffer).toString('base64'),
      };
    }),

  /**
   * 导出角色列表为 Excel
   */
  exportRoles: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(10000).default(100),
    }))
    .mutation(async ({ input }) => {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.default.Workbook();
      const worksheet = workbook.addWorksheet('角色列表');

      worksheet.columns = [
        { header: '名称', key: 'name', width: 20 },
        { header: '编码', key: 'code', width: 20 },
        { header: '描述', key: 'description', width: 30 },
        { header: '排序号', key: 'sort', width: 10 },
        { header: '用户数', key: 'userCount', width: 10 },
        { header: '创建时间', key: 'createdAt', width: 20 },
      ];

      const roles = await prisma.role.findMany({
        where: { deletedAt: null },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        orderBy: { sort: 'asc' },
        include: { _count: { select: { users: true } } },
      });

      roles.forEach((r) => {
        worksheet.addRow({
          name: r.name,
          code: r.code,
          description: r.description || '',
          sort: r.sort,
          userCount: r._count.users,
          createdAt: r.createdAt.toISOString(),
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      return {
        filename: `角色列表_${new Date().toISOString().slice(0, 10)}.xlsx`,
        data: Buffer.from(buffer).toString('base64'),
      };
    }),

  /**
   * 导出菜单列表为 Excel
   */
  exportMenus: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(10000).default(100),
    }))
    .mutation(async ({ input }) => {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.default.Workbook();
      const worksheet = workbook.addWorksheet('菜单列表');

      worksheet.columns = [
        { header: '名称', key: 'name', width: 20 },
        { header: '编码', key: 'code', width: 20 },
        { header: '类型', key: 'type', width: 15 },
        { header: '路径', key: 'path', width: 30 },
        { header: '排序号', key: 'sort', width: 10 },
        { header: '创建时间', key: 'createdAt', width: 20 },
      ];

      const menus = await prisma.menu.findMany({
        where: { deletedAt: null },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        orderBy: { sort: 'asc' },
      });

      menus.forEach((m) => {
        worksheet.addRow({
          name: m.name,
          code: m.code,
          type: m.type,
          path: m.path || '',
          sort: m.sort,
          createdAt: m.createdAt.toISOString(),
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      return {
        filename: `菜单列表_${new Date().toISOString().slice(0, 10)}.xlsx`,
        data: Buffer.from(buffer).toString('base64'),
      };
    }),

  /**
   * 导出字典数据为 Excel
   */
  exportDicts: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(10000).default(100),
    }))
    .mutation(async ({ input }) => {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.default.Workbook();
      const worksheet = workbook.addWorksheet('字典数据');

      worksheet.columns = [
        { header: '字典类型', key: 'dictType', width: 20 },
        { header: '标签', key: 'label', width: 20 },
        { header: '值', key: 'value', width: 20 },
        { header: '颜色', key: 'color', width: 15 },
        { header: '排序号', key: 'sort', width: 10 },
        { header: '状态', key: 'status', width: 10 },
      ];

      const dictTypes = await prisma.dictType.findMany({
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        include: { items: true },
      });

      dictTypes.forEach((dt) => {
        dt.items.forEach((item) => {
          worksheet.addRow({
            dictType: dt.name,
            label: item.label,
            value: item.value,
            color: item.color || '',
            sort: item.sort,
            status: item.status ? '启用' : '禁用',
          });
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      return {
        filename: `字典数据_${new Date().toISOString().slice(0, 10)}.xlsx`,
        data: Buffer.from(buffer).toString('base64'),
      };
    }),
});
