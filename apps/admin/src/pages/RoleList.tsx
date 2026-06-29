import { useEffect, useState } from 'react';
import { Button, Card, Space, Popconfirm, message, Tag, Form, Input, InputNumber, Tree, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined, SafetyOutlined } from '@ant-design/icons';
import { trpc } from '../trpc/client';
import DataTable from '../components/DataTable';
import FormDrawer from '../components/FormDrawer';
import type { DataNode } from 'antd/es/tree';

/** 平铺菜单列表 → 树形 DataNode */
function buildTree(menus: { id: string; name: string; parentId: string | null; type: string; sort: number }[]): DataNode[] {
  const map = new Map<string, DataNode>();
  const roots: DataNode[] = [];

  for (const m of menus.sort((a, b) => a.sort - b.sort)) {
    const node: DataNode = {
      key: m.id,
      title: `${m.name} (${m.type})`,
    };
    map.set(m.id, node);
  }

  for (const m of menus) {
    const node = map.get(m.id)!;
    if (m.parentId && map.has(m.parentId)) {
      const parent = map.get(m.parentId)!;
      parent.children = [...(parent.children ?? []), node];
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export default function RoleListPage() {
  const [searchText, setSearchText] = useState('');
  const { data, isLoading, refetch } = trpc.role.list.useQuery({ page: 1, pageSize: 100 });

  // Drawer 状态
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [form] = Form.useForm();

  const { data: item, isLoading: itemLoading } = trpc.role.byId.useQuery(editingId ?? '', { enabled: !!editingId });
  const { data: menuList } = trpc.menu.list.useQuery({ page: 1, pageSize: 100 });

  useEffect(() => {
    if (item) {
      form.setFieldsValue(item);
      if ('menuIds' in item) setCheckedKeys((item as { menuIds: string[] }).menuIds);
    }
  }, [item, form]);

  const filteredItems = data?.items?.filter((item: any) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return item.name?.toLowerCase().includes(q);
  });

  const utils = trpc.useUtils();

  const deleteMutation = trpc.role.delete.useMutation({
    onSuccess: () => {
      message.success('删除成功');
      refetch();
    },
    onError: (err) => message.error(err.message),
  });

  const createMutation = trpc.role.create.useMutation({ onError: (err) => message.error(err.message) });
  const updateMutation = trpc.role.update.useMutation({ onError: (err) => message.error(err.message) });
  const bindMenusMutation = trpc.role.bindMenus.useMutation({ onError: (err) => message.error(err.message) });

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    setCheckedKeys([]);
    setFormOpen(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    setFormOpen(true);
  };

  const handleSubmit = (values: { name: string; description?: string; sort: number }) => {
    const save = editingId
      ? updateMutation.mutateAsync({ id: editingId, data: values })
      : createMutation.mutateAsync(values);

    save
      .then(async (result) => {
        const roleId = editingId! || (result as { id: string }).id;
        await bindMenusMutation.mutateAsync({ roleId, menuIds: checkedKeys });
        utils.role.byId.invalidate(roleId);
        utils.role.list.invalidate();
        message.success(editingId ? '更新成功' : '创建成功');
        setFormOpen(false);
        form.resetFields();
        setEditingId(null);
        setCheckedKeys([]);
      })
      .catch((err) => message.error(err.message));
  };

  const treeData = menuList?.items ? buildTree(menuList.items) : [];

  const columns = [
    { title: '角色名称', dataIndex: 'name', key: 'name' },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '用户数', dataIndex: 'userCount', key: 'userCount', width: 80 },
    {
      title: '系统角色',
      dataIndex: 'isSystem',
      key: 'isSystem',
      width: 100,
      render: (v: boolean) => v ? <Tag color="blue">系统</Tag> : <Tag>自定义</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: { id: string }) => (
        <Space>
          <Button type="link" icon={<SafetyOutlined />} onClick={() => openEdit(record.id)}>
            权限
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
      title="角色管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新建角色
        </Button>
      }
    >
      <DataTable
        dataSource={filteredItems}
        columns={columns}
        total={data?.total}
        loading={isLoading}
        showSearch
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="搜索角色名称"
        onRefresh={() => refetch()}
      />

      <FormDrawer
        title={editingId ? '编辑角色' : '新建角色'}
        open={formOpen}
        form={form}
        onClose={() => { setFormOpen(false); setEditingId(null); form.resetFields(); setCheckedKeys([]); }}
        onSubmit={handleSubmit}
        loading={editingId ? itemLoading : false}
        submitting={createMutation.isPending || updateMutation.isPending}
        width={600}
      >
        <Form.Item name="name" label="角色名称" rules={[{ required: true, message: '请输入名称' }]}>
          <Input placeholder="管理员" />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea rows={2} placeholder="角色描述（可选）" />
        </Form.Item>
        <Form.Item name="sort" label="排序">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Divider>菜单权限</Divider>
        <Tree
          checkable
          defaultExpandAll
          checkedKeys={checkedKeys}
          onCheck={(keys) => setCheckedKeys(keys as string[])}
          treeData={treeData}
        />
      </FormDrawer>
    </Card>
  );
}
