import { useState, useMemo } from 'react';
import {
  Table, Button, Card, Space, Popconfirm, message, Form, Input,
  InputNumber, Switch, TreeSelect,
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { trpc } from '../trpc/client';
import PageHeader from '../components/PageHeader';
import FormDrawer from '../components/FormDrawer';

/** 扁平列表 → 嵌套树结构 */
function buildTree<T extends { id: string; parentId: string | null }>(items: T[]): (T & { children: T[] })[] {
  const map = new Map<string, T & { children: T[] }>();
  const roots: (T & { children: T[] })[] = [];

  for (const item of items) {
    map.set(item.id, { ...item, children: [] });
  }

  for (const item of items) {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export default function CategoryListPage() {
  const { data, isLoading, refetch } = trpc.category.tree.useQuery();
  const deleteMutation = trpc.category.delete.useMutation({
    onSuccess: () => { message.success('删除成功'); refetch(); },
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const createMutation = trpc.category.create.useMutation({
    onSuccess: () => { message.success('创建成功'); setFormOpen(false); form.resetFields(); refetch(); },
  });
  const updateMutation = trpc.category.update.useMutation({
    onSuccess: () => { message.success('更新成功'); setFormOpen(false); form.resetFields(); setEditingId(null); refetch(); },
  });

  const treeDataSource = useMemo(() => {
    if (!data) return [];
    return buildTree(data);
  }, [data]);

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ sort: 0, status: true });
    setFormOpen(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    const r = data?.find((i: { id: string }) => i.id === id);
    if (r) form.setFieldsValue(r);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingId) updateMutation.mutate({ id: editingId, data: values });
    else createMutation.mutate(values);
  };

  const treeSelectData = data?.map((t: { id: string; name: string }) => ({
    value: t.id, title: t.name,
  })) || [];

  const columns = [
    { title: '分类名称', dataIndex: 'name', key: 'name' },
    { title: '编码', dataIndex: 'code', key: 'code' },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 60 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s: boolean) => s ? '启用' : '停用',
    },
    {
      title: '操作', key: 'action', width: 160,
      render: (_: unknown, r: { id: string }) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r.id)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => deleteMutation.mutate(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="分类管理"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建分类</Button>}
      />
      <Card>
      <Table
        dataSource={treeDataSource}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        defaultExpandAllRows
        size="middle"
      />
      <FormDrawer
        title={editingId ? '编辑分类' : '新建分类'}
        open={formOpen}
        form={form}
        onClose={() => { setFormOpen(false); setEditingId(null); }}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending || updateMutation.isPending}
      >
        <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="parentId" label="父分类">
          <TreeSelect treeData={treeSelectData} allowClear placeholder="留空为顶级" />
        </Form.Item>
        <Form.Item name="sort" label="排序"><InputNumber min={0} style={{ width: 120 }} /></Form.Item>
        <Form.Item name="status" label="状态" valuePropName="checked"><Switch /></Form.Item>
      </FormDrawer>
    </Card>
    </div>
  );
}
