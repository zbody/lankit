/**
 * API 模块代码生成器
 *
 * 用法: pnpm gen:api <模块名>(单数) <模块名>(复数)
 * 示例: pnpm gen:api article articles
 *       pnpm gen:api category categories
 *
 * 生成内容:
 *   - apps/bff/src/trpc/routers/<module>.ts     (BFF CRUD router)
 *   - apps/admin/src/pages/<Module>List.tsx       (Admin 列表页)
 *   - apps/admin/src/pages/<Module>Form.tsx       (Admin 表单页)
 * 并自动修改:
 *   - apps/bff/src/trpc/app.ts                   (注册 router)
 *   - apps/admin/src/App.tsx                     (添加路由)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve, relative } from 'path';

// ---- 解析参数 ----
const [, , singular, plural] = process.argv;

if (!singular || !plural) {
  console.error('用法: pnpm gen:api <单数名> <复数名>');
  console.error('示例: pnpm gen:api article articles');
  process.exit(1);
}

const Module = singular.charAt(0).toUpperCase() + singular.slice(1); // Article
const module = singular.toLowerCase(); // article
const modules = plural.toLowerCase(); // articles

const root = resolve(import.meta.dirname, '..');

// ---- 模板 ----

const routerTemplate = `import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../router.js';
import { prisma } from '../../db/prisma.js';

const ${module}Schema = z.object({
  title: z.string().min(1, '标题不能为空'),
  content: z.string().optional(),
});

export const ${module}Router = router({
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
        prisma.${module}.findMany({
          skip,
          take: input.pageSize,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.${module}.count(),
      ]);
      return {
        items: items.map((i: Record<string, unknown>) => ({
          ...i,
          createdAt: (i.createdAt as Date).toISOString(),
          updatedAt: (i.updatedAt as Date).toISOString(),
        })),
        total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  byId: publicProcedure.input(z.string()).query(async ({ input }) => {
    const item = await prisma.${module}.findUnique({ where: { id: input } });
    if (!item) throw new Error('${Module} 不存在');
    return item;
  }),

  create: protectedProcedure.input(${module}Schema).mutation(async ({ input }) => {
    const item = await prisma.${module}.create({ data: input });
    return item;
  }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: ${module}Schema }))
    .mutation(async ({ input }) => {
      const item = await prisma.${module}.update({
        where: { id: input.id },
        data: input.data,
      });
      return item;
    }),

  delete: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    await prisma.${module}.delete({ where: { id: input } });
    return { success: true };
  }),
});
`;

const listPageTemplate = `import { Table, Button, Card, Space, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../trpc/client';

export default function ${Module}ListPage() {
  const navigate = useNavigate();
  const { data, isLoading, refetch } = trpc.${module}.list.useQuery({ page: 1, pageSize: 20 });
  const deleteMutation = trpc.${module}.delete.useMutation({
    onSuccess: () => {
      message.success('删除成功');
      refetch();
    },
  });

  const columns = [
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: { id: string }) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => navigate(\`/${modules}/\${record.id}/edit\`)}>
            编辑
          </Button>
          <Popconfirm title="确认删除？" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="${Module} 管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(\`/${modules}/new\`)}>
          新建
        </Button>
      }
    >
      <Table
        dataSource={data?.items}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ total: data?.total, pageSize: 20, showTotal: (t: number) => \`共 \${t} 条\` }}
      />
    </Card>
  );
}
`;

const formPageTemplate = `import { useEffect } from 'react';
import { Card, Form, Input, Button, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { trpc } from '../trpc/client';

export default function ${Module}FormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [form] = Form.useForm();

  const { data: item } = trpc.${module}.byId.useQuery(id ?? '', { enabled: isEdit });
  const createMutation = trpc.${module}.create.useMutation({
    onSuccess: () => {
      message.success('创建成功');
      navigate(\`/${modules}\`);
    },
  });
  const updateMutation = trpc.${module}.update.useMutation({
    onSuccess: () => {
      message.success('更新成功');
      navigate(\`/${modules}\`);
    },
  });

  useEffect(() => {
    if (item) form.setFieldsValue(item);
  }, [item, form]);

  const handleSubmit = (values: { title: string; content?: string }) => {
    if (isEdit) {
      updateMutation.mutate({ id: id!, data: values });
    } else {
      createMutation.mutate(values as { title: string; content?: string });
    }
  };

  return (
    <Card title={isEdit ? '编辑 ${Module}' : '新建 ${Module}'}>
      <Form form={form} onFinish={handleSubmit} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
          <Input placeholder="标题" />
        </Form.Item>
        <Form.Item name="content" label="内容">
          <Input.TextArea rows={4} placeholder="内容（可选）" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={createMutation.isLoading || updateMutation.isLoading}>
            {isEdit ? '更新' : '创建'}
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={() => navigate(\`/${modules}\`)}>
            取消
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
`;

// ---- 写入文件 ----

function write(path: string, content: string) {
  const fullPath = resolve(root, path);
  const dir = fullPath.substring(0, fullPath.lastIndexOf('\\'));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(fullPath, content, 'utf-8');
  console.log(`  ✅ Created: ${relative(root, fullPath)}`);
}

function patch(file: string, search: string, replace: string) {
  const fullPath = resolve(root, file);
  const content = readFileSync(fullPath, 'utf-8');
  if (content.includes(replace)) {
    console.log(`  ⏭️  Skipped (already patched): ${file}`);
    return;
  }
  const updated = content.replace(search, replace);
  writeFileSync(fullPath, updated, 'utf-8');
  console.log(`  ✅ Patched: ${file}`);
}

console.log(`\n📦 生成 API 模块: ${module} (${modules})`);
console.log('━'.repeat(40));

// 1. BFF router
write(`apps/bff/src/trpc/routers/${module}.ts`, routerTemplate);
patch(
  'apps/bff/src/trpc/app.ts',
  `import { systemRouter } from './routers/system.js';`,
  `import { ${module}Router } from './routers/${module}.js';\nimport { systemRouter } from './routers/system.js';`,
);
patch(
  'apps/bff/src/trpc/app.ts',
  `  system: systemRouter,`,
  `  ${module}: ${module}Router,\n  system: systemRouter,`,
);

// 2. Admin pages
write(`apps/admin/src/pages/${Module}List.tsx`, listPageTemplate);
write(`apps/admin/src/pages/${Module}Form.tsx`, formPageTemplate);

patch(
  'apps/admin/src/App.tsx',
  `import RegisterPage from './pages/Register';`,
  `import RegisterPage from './pages/Register';\nimport ${Module}ListPage from './pages/${Module}List';\nimport ${Module}FormPage from './pages/${Module}Form';`,
);
patch(
  'apps/admin/src/App.tsx',
  `<Route path="/register" element={<RegisterPage />} />`,
  `<Route path="/register" element={<RegisterPage />} />
      <Route path="/${modules}" element={<${Module}ListPage />} />
      <Route path="/${modules}/new" element={<${Module}FormPage />} />
      <Route path="/${modules}/:id/edit" element={<${Module}FormPage />} />`,
);

console.log('━'.repeat(40));
console.log(`🎉 生成完成！请执行以下步骤完成接入：

  1. 在 prisma/schema.prisma 中添加 ${Module} 模型
     (如果尚未添加)

  2. 运行 prisma db push 同步数据库

  3. 检查 typecheck: pnpm typecheck
`);
