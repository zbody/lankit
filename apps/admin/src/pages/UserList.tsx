import { useEffect } from 'react';
import { Button, Card, Space, Tag, message, Modal, Form, Input, Select, Switch } from 'antd';
import { useState } from 'react';
import { DownloadOutlined, ImportOutlined } from '@ant-design/icons';
import { trpc } from '../trpc/client';
import BatchOperations from '../components/BatchOperations';
import ImportModal from '../components/ImportModal';
import DataTable from '../components/DataTable';
import FormDrawer from '../components/FormDrawer';
import { OrgPicker } from '../components/Picker';

function buildPasswordRules(settings?: { key: string; value: string }[]): Record<string, unknown>[] {
  const rules: Record<string, unknown>[] = [{ required: true, message: '请输入密码' }];
  if (!settings) return rules;

  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const minLength = parseInt(map['password.minLength'] ?? '8', 10);
  const requireUppercase = map['password.requireUppercase'] === 'true';
  const requireLowercase = map['password.requireLowercase'] === 'true';
  const requireNumbers = map['password.requireNumbers'] === 'true';
  const requireSpecialChars = map['password.requireSpecialChars'] === 'true';

  rules.push({ min: minLength, message: `密码长度不能小于 ${minLength} 位` });
  if (requireUppercase) {
    rules.push({ pattern: /[A-Z]/, message: '密码必须包含大写字母' });
  }
  if (requireLowercase) {
    rules.push({ pattern: /[a-z]/, message: '密码必须包含小写字母' });
  }
  if (requireNumbers) {
    rules.push({ pattern: /[0-9]/, message: '密码必须包含数字' });
  }
  if (requireSpecialChars) {
    rules.push({ pattern: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, message: '密码必须包含特殊字符' });
  }
  return rules;
}

export default function UserListPage() {
  const utils = trpc.useUtils();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [importVisible, setImportVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Drawer 状态
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading } = trpc.user.list.useQuery({ page: 1, pageSize: 20 });
  const { data: roleList } = trpc.role.listAll.useQuery();
  const { data: systemSettings } = trpc.systemSettings.getAll.useQuery();

  const { data: editItem, isLoading: editLoading } = trpc.user.byId.useQuery(editingId ?? '', { enabled: !!editingId });

  // 编辑时填充表单
  useEffect(() => {
    if (editItem) {
      form.setFieldsValue({
        ...editItem,
        organizationId: (editItem as { organization?: { id: string } }).organization?.id ?? undefined,
        roleIds: (editItem as { roles?: { id: string }[] }).roles?.map((r) => r.id) ?? [],
      });
    }
  }, [editItem, form]);

  const exportMutation = trpc.export.exportUsers.useMutation({
    onSuccess: (data) => {
      const link = document.createElement('a');
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${data.data}`;
      link.download = data.filename;
      link.click();
      message.success('导出成功');
    },
    onError: (err) => message.error(err.message),
  });
  const resetPwdMutation = trpc.user.resetPassword.useMutation({
    onSuccess: () => message.success('密码已重置为 123456'),
    onError: (err) => message.error(err.message),
  });

  const createMutation = trpc.user.create.useMutation({
    onSuccess: () => {
      message.success('创建成功');
      setFormOpen(false);
      form.resetFields();
      setEditingId(null);
      utils.user.list.invalidate();
    },
    onError: (err) => message.error(err.message),
  });
  const updateMutation = trpc.user.update.useMutation({
    onSuccess: () => {
      message.success('更新成功');
      setFormOpen(false);
      form.resetFields();
      setEditingId(null);
      utils.user.list.invalidate();
      if (editingId) utils.user.byId.invalidate(editingId);
    },
    onError: (err) => message.error(err.message),
  });

  // 客户端搜索过滤
  const filteredItems = data?.items?.filter((item: any) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.email?.toLowerCase().includes(q)
    );
  });

  const deleteMutation = trpc.user.delete.useMutation({
    onSuccess: () => {
      message.success('删除成功');
      utils.user.list.invalidate();
      utils.user.recycleBin.invalidate();
    },
    onError: (err) => message.error(err.message),
  });

  const handleImport = () => {
    setImportVisible(true);
  };

  const handleImportSuccess = () => {
    setImportVisible(false);
    utils.user.list.invalidate();
    message.success('导入完成');
  };

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    setFormOpen(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingId) {
      const { email, password, ...rest } = values;
      updateMutation.mutate({ id: editingId, data: rest });
    } else {
      createMutation.mutate(values as Parameters<typeof createMutation.mutate>[0]);
    }
  };

  const columns = [
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '组织',
      dataIndex: 'organization',
      key: 'organization',
      render: (org: { name: string } | null) => org?.name ?? '-',
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: { name: string; code: string }[]) =>
        roles?.map((r) => <Tag key={r.code} color="blue">{r.name}</Tag>),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (v: boolean) => v ? <Tag color="green">启用</Tag> : <Tag color="red">禁用</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: { id: string; name: string }) => (
        <Space>
          <Button type="link" onClick={() => openEdit(record.id)}>
            编辑
          </Button>
          <Button type="link" onClick={() => resetPwdMutation.mutate({ id: record.id, password: '123456' })}>
            重置密码
          </Button>
          <Button
            type="link"
            danger
            loading={deleteMutation.isLoading}
            onClick={() =>
              Modal.confirm({
                title: '确认删除',
                content: `确定要删除用户 "${record.name}" 吗？`,
                okText: '删除',
                okType: 'danger',
                cancelText: '取消',
                onOk: () => deleteMutation.mutateAsync(record.id),
              })
            }
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="用户管理"
      extra={
        <Space>
          <Button icon={<ImportOutlined />} onClick={handleImport}>导入数据</Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => exportMutation.mutate({ page: 1, pageSize: 10000 })}
            loading={exportMutation.isLoading}
          >
            导出数据
          </Button>
          <Button type="primary" onClick={openCreate}>新建用户</Button>
        </Space>
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
        searchPlaceholder="搜索用户名称或邮箱"
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => setSelectedIds(keys as string[]),
        }}
        onRefresh={() => { utils.user.list.invalidate(); }}
        batchActions={<BatchOperations selectedIds={selectedIds} onCompleted={() => setSelectedIds([])} />}
      />
      <ImportModal
        visible={importVisible}
        onClose={() => setImportVisible(false)}
        targetType="users"
        onSuccess={handleImportSuccess}
      />

      <FormDrawer
        title={editingId ? '编辑用户' : '新建用户'}
        open={formOpen}
        form={form}
        onClose={() => { setFormOpen(false); setEditingId(null); form.resetFields(); }}
        onSubmit={handleSubmit}
        loading={editingId ? editLoading : false}
        submitting={createMutation.isPending || updateMutation.isPending}
        width={560}
      >
        {!editingId && (
          <>
            <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email', message: '请输入正确的邮箱' }]}>
              <Input placeholder="user@example.com" />
            </Form.Item>
            <Form.Item name="password" label="密码" rules={buildPasswordRules(systemSettings)}>
              <Input.Password placeholder="输入密码" />
            </Form.Item>
          </>
        )}
        <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
          <Input placeholder="用户名称" />
        </Form.Item>
        <Form.Item name="organizationId" label="所属组织">
          <OrgPicker mode="treeSelect" />
        </Form.Item>
        <Form.Item name="roleIds" label="角色">
          <Select
            mode="multiple"
            placeholder="选择角色"
            options={(roleList ?? []).map((r) => ({ label: r.name, value: r.id }))}
          />
        </Form.Item>
        {editingId && (
          <Form.Item name="isActive" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        )}
      </FormDrawer>
    </Card>
  );
}
