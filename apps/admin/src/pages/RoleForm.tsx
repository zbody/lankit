import { useEffect, useState } from 'react';
import { Card, Form, Input, InputNumber, Tree, Button, message, Spin, Divider } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { trpc } from '../trpc/client';
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

export default function RoleFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);

  const { data: item, isLoading: itemLoading } = trpc.role.byId.useQuery(id ?? '', { enabled: isEdit });
  const { data: menuList } = trpc.menu.list.useQuery({ page: 1, pageSize: 100 });

  const utils = trpc.useUtils();

  const createMutation = trpc.role.create.useMutation({
    onError: (err) => message.error(err.message),
  });
  const updateMutation = trpc.role.update.useMutation({
    onError: (err) => message.error(err.message),
  });
  const bindMenusMutation = trpc.role.bindMenus.useMutation({
    onError: (err) => message.error(err.message),
  });

  useEffect(() => {
    if (item) {
      form.setFieldsValue(item);
      if ('menuIds' in item) setCheckedKeys((item as { menuIds: string[] }).menuIds);
    }
  }, [item, form]);

  const handleSubmit = (values: { name: string; description?: string; sort: number }) => {
    const save = isEdit
      ? updateMutation.mutateAsync({ id: id!, data: values })
      : createMutation.mutateAsync(values);

    save
      .then(async (result) => {
        const roleId = isEdit ? id! : (result as { id: string }).id;
        await bindMenusMutation.mutateAsync({ roleId, menuIds: checkedKeys });
        utils.role.byId.invalidate(roleId);
        utils.role.list.invalidate();
        message.success(isEdit ? '更新成功' : '创建成功');
        navigate('/roles');
      })
      .catch((err) => message.error(err.message));
  };

  const treeData = menuList?.items ? buildTree(menuList.items) : [];

  if (isEdit && itemLoading) return <Spin style={{ display: 'block', margin: '48px auto' }} />;

  return (
    <Card title={isEdit ? '编辑角色' : '新建角色'}>
      <Form form={form} onFinish={handleSubmit} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item name="name" label="角色名称" rules={[{ required: true, message: '请输入名称' }]}>
          <Input placeholder="管理员" />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea rows={2} placeholder="角色描述（可选）" />
        </Form.Item>
        <Form.Item name="sort" label="排序">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
      </Form>

      <Divider>菜单权限</Divider>
      <Tree
        checkable
        defaultExpandAll
        checkedKeys={checkedKeys}
        onCheck={(keys) => setCheckedKeys(keys as string[])}
        treeData={treeData}
      />

      <div style={{ marginTop: 16 }}>
        <Button
          type="primary"
          onClick={() => form.submit()}
          loading={createMutation.isLoading || updateMutation.isLoading}
        >
          {isEdit ? '更新' : '创建'}
        </Button>
        <Button style={{ marginLeft: 8 }} onClick={() => navigate('/roles')}>
          取消
        </Button>
      </div>
    </Card>
  );
}
