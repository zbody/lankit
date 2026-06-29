import { useEffect, useMemo, useState } from 'react';
import { Table, Button, Card, Space, Popconfirm, message, Form, Input, InputNumber, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { usePermission } from '../hooks/usePermission';
import { trpc } from '../trpc/client';
import FormDrawer from '../components/FormDrawer';

/** 递归检查 childId 是否是 parentId 的后代节点 */
function isDescendant(childId: string, parentId: string, items: { id: string; parentId: string | null }[]): boolean {
  for (const o of items) {
    if (o.parentId === parentId) {
      if (o.id === childId) return true;
      if (isDescendant(childId, o.id, items)) return true;
    }
  }
  return false;
}

/** 扁平列表 → 嵌套树结构（根据 parentId） */
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

export default function OrgListPage() {
  const { hasPermission } = usePermission();
  const { data, isLoading, refetch } = trpc.org.tree.useQuery();
  const { data: orgList } = trpc.org.list.useQuery({ page: 1, pageSize: 100 });
  const [searchText, setSearchText] = useState('');

  // Drawer 状态
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const { data: editItem } = trpc.org.byId.useQuery(editingId ?? '', { enabled: !!editingId });

  useEffect(() => {
    if (editItem) form.setFieldsValue(editItem);
  }, [editItem, form]);

  const createMutation = trpc.org.create.useMutation({
    onSuccess: () => {
      message.success('创建成功');
      setFormOpen(false);
      form.resetFields();
      setEditingId(null);
      refetch();
    },
    onError: (err) => message.error(err.message),
  });
  const updateMutation = trpc.org.update.useMutation({
    onSuccess: () => {
      message.success('更新成功');
      setFormOpen(false);
      form.resetFields();
      setEditingId(null);
      refetch();
      if (editingId) trpc.useUtils().org.byId.invalidate(editingId);
    },
    onError: (err) => message.error(err.message),
  });
  const deleteMutation = trpc.org.delete.useMutation({
    onSuccess: () => {
      message.success('删除成功');
      refetch();
    },
    onError: (err) => message.error(err.message),
  });

  const dataSource = useMemo(() => {
    if (!data) return [];
    const tree = buildTree(data);
    if (!searchText) return tree;
    const q = searchText.toLowerCase();
    /** 递归过滤树：保留匹配节点及其祖先路径 */
    function filterTree(nodes: any[]): any[] {
      const filtered: any[] = [];
      for (const node of nodes) {
        const children = filterTree(node.children || []);
        const match = node.name?.toLowerCase().includes(q) || node.code?.toLowerCase().includes(q);
        if (match || children.length > 0) {
          filtered.push({ ...node, children });
        }
      }
      return filtered;
    }
    return filterTree(tree);
  }, [data, searchText]);

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ sort: 0 });
    setFormOpen(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '组织编码', dataIndex: 'code', key: 'code' },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: { id: string }) => (
        <Space>
          {hasPermission('org:edit') && (
            <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record.id)}>
              编辑
            </Button>
          )}
          {hasPermission('org:delete') && (
            <Popconfirm title="确认删除？" onConfirm={() => deleteMutation.mutate(record.id)}>
              <Button type="link" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="组织管理"
      extra={
        <Space>
          <Input
            placeholder="搜索名称或编码"
            prefix={<SearchOutlined />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 220 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建组织
          </Button>
        </Space>
      }
    >
      <Table
        dataSource={dataSource}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        defaultExpandAllRows
        size="middle"
      />
      <FormDrawer
        title={editingId ? '编辑组织' : '新建组织'}
        open={formOpen}
        form={form}
        onClose={() => { setFormOpen(false); setEditingId(null); form.resetFields(); }}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending || updateMutation.isPending}
      >
        <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
          <Input placeholder="组织名称" />
        </Form.Item>
        <Form.Item name="parentId" label="上级组织" tooltip="留空则为根级组织">
          <Select
            allowClear
            placeholder="留空则为根级组织"
            options={(orgList?.items ?? [])
              .filter((o) => {
                if (o.id === editingId) return false;
                if (editingId && o.parentId === editingId) return false;
                if (editingId && isDescendant(o.id, editingId, orgList?.items ?? [])) return false;
                return true;
              })
              .map((o) => ({ label: o.name, value: o.id }))}
          />
        </Form.Item>
        <Form.Item name="sort" label="排序">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
      </FormDrawer>
    </Card>
  );
}
