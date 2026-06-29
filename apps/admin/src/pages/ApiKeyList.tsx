import { useState } from 'react';
import { Table, Button, Card, Space, Popconfirm, message, Modal, Form, Input, Switch, Tag, Alert, DatePicker, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, KeyOutlined, CopyOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { trpc } from '../trpc/client';

export default function ApiKeyListPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = trpc.apiKey.list.useQuery({ page, pageSize: 20 });
  const deleteMutation = trpc.apiKey.delete.useMutation({
    onSuccess: () => { message.success('删除成功'); refetch(); },
    onError: (err) => message.error(err.message),
  });
  const statusMutation = trpc.apiKey.updateStatus.useMutation({
    onSuccess: () => { message.success('状态已更新'); refetch(); },
    onError: (err) => message.error(err.message),
  });
  const regenerateMutation = trpc.apiKey.regenerate.useMutation({
    onSuccess: (data) => {
      setNewSecret(data.secret);
      setNewKeyDisplay(`密钥已重新生成，请立即复制：`);
      setSecretModalOpen(true);
      refetch();
    },
    onError: (err) => message.error(err.message),
  });

  // 新建/编辑弹窗
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [secretModalOpen, setSecretModalOpen] = useState(false);
  const [newSecret, setNewSecret] = useState('');
  const [newKeyDisplay, setNewKeyDisplay] = useState('');
  const [form] = Form.useForm();
  const createMutation = trpc.apiKey.create.useMutation({
    onSuccess: (data) => {
      setFormOpen(false);
      form.resetFields();
      setNewSecret(data.secret);
      setNewKeyDisplay(`密钥 "${data.name}" 创建成功！请立即复制密钥，关闭后将无法再次查看。`);
      setSecretModalOpen(true);
      refetch();
    },
    onError: (err) => message.error(err.message),
  });
  const updateMutation = trpc.apiKey.update.useMutation({
    onSuccess: () => { message.success('更新成功'); setFormOpen(false); form.resetFields(); setEditingId(null); refetch(); },
    onError: (err) => message.error(err.message),
  });

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ name: '', expiresAt: null });
    setFormOpen(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    const record = data?.items.find((i: { id: string }) => i.id === id);
    if (record) {
      form.setFieldsValue({
        name: record.name,
        expiresAt: record.expiresAt,
      });
    }
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: { name: values.name, expiresAt: values.expiresAt } });
    } else {
      createMutation.mutate({ name: values.name, expiresAt: values.expiresAt || null });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => message.success('已复制到剪贴板'));
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '密钥标识',
      dataIndex: 'key',
      key: 'key',
      render: (key: string) => (
        <Space>
          <code style={{ background: '#f5f5f5', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{key}</code>
          <Tooltip title="复制密钥标识">
            <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(key)} />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: boolean, record: { id: string }) => (
        <Switch
          checked={status}
          size="small"
          onChange={(checked) => statusMutation.mutate({ id: record.id, status: checked })}
          checkedChildren={<CheckCircleOutlined />}
          unCheckedChildren={<StopOutlined />}
        />
      ),
    },
    {
      title: '最后使用',
      dataIndex: 'lastUsedAt',
      key: 'lastUsedAt',
      width: 180,
      render: (v: string | null) => v ? new Date(v).toLocaleString('zh-CN') : <span style={{ color: '#999' }}>从未使用</span>,
    },
    {
      title: '过期时间',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      width: 180,
      render: (v: string | null) => v ? new Date(v).toLocaleString('zh-CN') : <Tag>永不过期</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: { id: string; name: string }) => (
        <Space>
          <Button type="link" size="small" icon={<KeyOutlined />} onClick={() => {
            Modal.confirm({
              title: '重新生成密钥',
              content: `确定重新生成 "${record.name}" 的密钥？旧密钥将立即失效。`,
              onOk: () => regenerateMutation.mutate(record.id),
            });
          }}>
            重新生成
          </Button>
          <Button type="link" size="small" onClick={() => openEdit(record.id)}>编辑</Button>
          <Popconfirm title="确定删除此密钥？" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="API 密钥管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建密钥</Button>}>
      <Table
        dataSource={data?.items}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.total,
          onChange: setPage,
          showTotal: (t: number) => `共 ${t} 条`,
        }}
      />

      {/* 新建/编辑弹窗 */}
      <Modal
        title={editingId ? '编辑密钥' : '新建密钥'}
        open={formOpen}
        onOk={handleSubmit}
        onCancel={() => { setFormOpen(false); setEditingId(null); }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="密钥名称" rules={[{ required: true, message: '请输入密钥名称' }]}>
            <Input placeholder="例如：生产环境 - 支付服务" maxLength={100} />
          </Form.Item>
          <Form.Item name="expiresAt" label="过期时间">
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="留空则永不过期"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 新密钥提示弹窗 */}
      <Modal
        title="密钥已创建"
        open={secretModalOpen}
        onCancel={() => setSecretModalOpen(false)}
        footer={<Button type="primary" onClick={() => setSecretModalOpen(false)}>我已安全保存</Button>}
        width={600}
      >
        <Alert
          type="warning"
          showIcon
          message="请立即复制此密钥"
          description="关闭此弹窗后将无法再次查看完整密钥。请将其保存在安全的地方。"
          style={{ marginBottom: 16 }}
        />
        <p style={{ fontWeight: 500 }}>{newKeyDisplay}</p>
        <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6, padding: 12, marginTop: 8 }}>
          <code style={{ fontSize: 13, wordBreak: 'break-all', userSelect: 'all' }}>{newSecret}</code>
        </div>
        <Button
          type="primary"
          icon={<CopyOutlined />}
          onClick={() => copyToClipboard(newSecret)}
          style={{ marginTop: 12 }}
        >
          复制密钥
        </Button>
      </Modal>
    </Card>
  );
}
