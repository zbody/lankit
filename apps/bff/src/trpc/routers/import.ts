import { z } from 'zod';
import { protectedProcedure, router } from '../router.js';
import { prisma } from '../../db/prisma.js';
import bcrypt from 'bcryptjs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Workbook = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Worksheet = any;

async function readExcel(data: string): Promise<Worksheet> {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.default.Workbook() as Workbook;
  const buffer = Buffer.from(data, 'base64');
  await workbook.xlsx.load(buffer);
  const sheets = workbook.worksheets as Worksheet[];
  if (!sheets || sheets.length === 0) throw new Error('Excel 文件为空');
  return sheets[0];
}

async function parseRows(worksheet: Worksheet): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];
  for (let i = 1; i <= headerRow.cellCount; i++) {
    const val = headerRow.getCell(i).value;
    headers.push(typeof val === 'string' ? val.trim() : '');
  }

  const rows: Record<string, string>[] = [];
  for (let i = 2; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    const cellMap: Record<string, string> = {};
    headers.forEach((h, idx) => {
      if (h) {
        const val = row.getCell(idx + 1).value;
        cellMap[h] = typeof val === 'string' ? val.trim() : '';
      }
    });
    if (Object.values(cellMap).some((v) => v)) {
      cellMap._rowNum = String(i);
      rows.push(cellMap);
    }
  }
  return { headers, rows };
}

export const importRouter = router({
  downloadUserTemplate: protectedProcedure.query(async () => {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook() as Workbook;
    const ws = workbook.addWorksheet('用户导入') as Worksheet;
    ws.columns = [
      { header: '邮箱', key: 'email', width: 30 },
      { header: '名称', key: 'name', width: 20 },
      { header: '密码', key: 'password', width: 15 },
      { header: '组织ID (可选)', key: 'organizationId', width: 25 },
      { header: '角色IDs (逗号分隔)', key: 'roleIds', width: 30 },
    ];
    ws.addRow({ email: 'user@example.com', name: '张三', password: 'password123' });
    const buf = await workbook.xlsx.writeBuffer();
    return { filename: '用户导入模板.xlsx', data: Buffer.from(buf).toString('base64') };
  }),

  downloadOrgTemplate: protectedProcedure.query(async () => {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook() as Workbook;
    const ws = workbook.addWorksheet('组织导入') as Worksheet;
    ws.columns = [
      { header: '名称', key: 'name', width: 20 },
      { header: '编码 (可选)', key: 'code', width: 20 },
      { header: '父组织ID (可选)', key: 'parentId', width: 25 },
      { header: '排序号', key: 'sort', width: 10 },
    ];
    ws.addRow({ name: '示例组织', code: 'ORG00001' });
    const buf = await workbook.xlsx.writeBuffer();
    return { filename: '组织导入模板.xlsx', data: Buffer.from(buf).toString('base64') };
  }),

  downloadDictTemplate: protectedProcedure.query(async () => {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook() as Workbook;
    const ws = workbook.addWorksheet('字典导入') as Worksheet;
    ws.columns = [
      { header: '字典类型编码', key: 'dictCode', width: 20 },
      { header: '标签', key: 'label', width: 20 },
      { header: '值', key: 'value', width: 20 },
      { header: '颜色 (可选)', key: 'color', width: 15 },
      { header: '排序号', key: 'sort', width: 10 },
    ];
    ws.addRow({ dictCode: 'status', label: '启用', value: '1', color: 'green' });
    const buf = await workbook.xlsx.writeBuffer();
    return { filename: '字典导入模板.xlsx', data: Buffer.from(buf).toString('base64') };
  }),

  importUsers: protectedProcedure
    .input(z.object({ filename: z.string(), data: z.string() }))
    .mutation(async ({ input }) => {
      const worksheet = await readExcel(input.data);
      const { rows } = await parseRows(worksheet);

      const results = { success: 0, failed: 0, errors: [] as string[] };

      for (const row of rows) {
        const email = row['邮箱'];
        const name = row['名称'];
        const password = row['密码'];

        if (!email || !name || !password) {
          results.failed++;
          results.errors.push(`第 ${row._rowNum} 行: 邮箱、名称、密码为必填项`);
          continue;
        }

        try {
          const existing = await prisma.user.findUnique({ where: { email } });
          if (existing) {
            results.failed++;
            results.errors.push(`第 ${row._rowNum} 行: 邮箱 ${email} 已存在`);
            continue;
          }

          const settings = await prisma.systemSetting.findMany({
            where: { key: { startsWith: 'password.' } },
          });
          const map = Object.fromEntries(settings.map((s: { key: string; value: string }) => [s.key, s.value]));
          const minLength = parseInt(map['password.minLength'] ?? '8', 10);
          if (password.length < minLength) {
            results.failed++;
            results.errors.push(`第 ${row._rowNum} 行: 密码长度不能小于 ${minLength} 位`);
            continue;
          }

          const hashedPassword = await bcrypt.hash(password, 10);
          const orgId = row['组织ID (可选)'] || null;
          const roleIdsStr = row['角色IDs (逗号分隔)'] || '';
          const roleIds = roleIdsStr ? roleIdsStr.split(',').map((r) => r.trim()).filter(Boolean) : [];

          await prisma.user.create({
            data: {
              email, name, password: hashedPassword,
              organizationId: orgId || null,
              roles: roleIds.length > 0 ? { create: roleIds.map((roleId) => ({ roleId })) } : undefined,
            },
          });
          results.success++;
        } catch (err: unknown) {
          results.failed++;
          results.errors.push(`第 ${row._rowNum} 行: ${err instanceof Error ? err.message : '未知错误'}`);
        }
      }
      return results;
    }),

  importOrgs: protectedProcedure
    .input(z.object({ filename: z.string(), data: z.string() }))
    .mutation(async ({ input }) => {
      const worksheet = await readExcel(input.data);
      const { rows } = await parseRows(worksheet);

      const results = { success: 0, failed: 0, errors: [] as string[] };

      for (const row of rows) {
        const name = row['名称'];
        if (!name) {
          results.failed++;
          results.errors.push(`第 ${row._rowNum} 行: 名称为必填项`);
          continue;
        }
        try {
          const orgData: any = { name };
          if (row['编码 (可选)']) orgData.code = row['编码 (可选)'];
          if (row['父组织ID (可选)']) orgData.parentId = row['父组织ID (可选)'];
          orgData.sort = parseInt(row['排序号'] || '0', 10);

          await prisma.organization.create({
            data: orgData,
          });
          results.success++;
        } catch (err: unknown) {
          results.failed++;
          results.errors.push(`第 ${row._rowNum} 行: ${err instanceof Error ? err.message : '未知错误'}`);
        }
      }
      return results;
    }),

  importDicts: protectedProcedure
    .input(z.object({ filename: z.string(), data: z.string() }))
    .mutation(async ({ input }) => {
      const worksheet = await readExcel(input.data);
      const { rows } = await parseRows(worksheet);

      const results = { success: 0, failed: 0, errors: [] as string[] };

      for (const row of rows) {
        const dictCode = row['字典类型编码'];
        const label = row['标签'];
        const value = row['值'];
        if (!dictCode || !label || !value) {
          results.failed++;
          results.errors.push(`第 ${row._rowNum} 行: 字典类型编码、标签、值为必填项`);
          continue;
        }
        try {
          const dictType = await prisma.dictType.findUnique({ where: { code: dictCode } });
          let dictTypeId = dictType?.id;
          if (!dictTypeId) {
            const newType = await prisma.dictType.create({
              data: { name: dictCode, code: dictCode, kind: 'STRING' },
            });
            dictTypeId = newType.id;
          }
          await prisma.dictData.create({
            data: {
              dictTypeId: dictTypeId!, label, value,
              color: row['颜色 (可选)'] || undefined,
              sort: parseInt(row['排序号'] || '0', 10),
            },
          });
          results.success++;
        } catch (err: unknown) {
          results.failed++;
          results.errors.push(`第 ${row._rowNum} 行: ${err instanceof Error ? err.message : '未知错误'}`);
        }
      }
      return results;
    }),
});
