import { useState } from 'react';
import { Card, Table, Button, Tag, Modal, Form, Input, Switch, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { trpc } from '../trpc/client';

const providers = [
  { value: 'GITHUB', label: 'GitHub', color: '#333' },
  { value: 'GOOGLE', label: 'Google', color: '#4285f4' },
  { value: 'WECHAT', label: '微信', color: '#07c160' },
  { value: 'DINGTALK', label: '钉钉', color: '#0089ff' },
  { value: 'FEISHU', label: '飞书', color: '#3370ff' },
];

export default function OAuthSettingsPage() {
  const { data: providerList, refetch: refetchProviders } = trpc.oauth.allProviders.useQuery();
  const { data: bindingData } = trpc.oauth.userBindings.useQuery({ page: 1, pageSize: 50 });
  const saveMutation = trpc.oauth.saveProvider.useMutation({ onSuccess: () => { message.success('保存成功'); refetchProviders(); setFormOpen(false); } });

  const [formOpen, setFormOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [form] = Form.useForm();

  const openEdit = (provider: string) => {
    setEditingProvider(provider);
    const cfg = providerList?.find((p: any) => p.provider === provider);
    form.setFieldsValue({
      clientId: cfg?.clientId || '',
      clientSecret: '',
      redirectUri: cfg?.redirectUri || '',
      enabled: cfg?.enabled ?? true,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    saveMutation.mutate({ provider: editingProvider!, ...values });
  };

  const columns = [
    {
      title: '提供商', dataIndex: 'provider', key: 'provider', width: 120,
      render: (v: string) => <Tag color={providers.find(p => p.value === v)?.color}>{providers.find(p => p.value === v)?.label || v}</Tag>,
    },
    { title: 'Client ID', dataIndex: 'clientId', key: 'clientId', ellipsis: true },
    { title: 'Secret', dataIndex: 'hasSecret', key: 'hasSecret', width: 80, render: (v: boolean) => v ? '已设置' : '未设置' },
    { title: '回调地址', dataIndex: 'redirectUri', key: 'redirectUri', ellipsis: true },
    { title: '状态', dataIndex: 'enabled', key: 'enabled', width: 80, render: (v: boolean) => v ? '启用' : '停用' },
    {
      title: '操作', key: 'action', width: 80,
      render: (_: unknown, r: { provider: string }) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r.provider)}>编辑</Button>
      ),
    },
  ];

  return (
    <Card title="OAuth 第三方登录配置">
      <Table dataSource={providerList} columns={columns} rowKey="provider" loading={!providerList} pagination={false} style={{ marginBottom: 24 }} />
      <Card title="用户绑定列表" size="small">
        <Table dataSource={bindingData?.items} columns={[
          { title: '用户', dataIndex: ['user', 'email'], key: 'userEmail' },
          { title: '提供商', dataIndex: 'provider', key: 'provider', render: (v: string) => <Tag color={providers.find(p => p.value === v)?.color}>{providers.find(p => p.value === v)?.label || v}</Tag> },
          { title: '第三方 ID', dataIndex: 'providerId', key: 'providerId' },
          { title: '绑定时间', dataIndex: 'createdAt', key: 'createdAt', width: 180, render: (v: string) => new Date(v).toLocaleString('zh-CN') },
        ]} rowKey="id" loading={!bindingData} pagination={{ pageSize: 20, total: bindingData?.total }} />
      </Card>

      <Modal title={`编辑 ${providers.find(p => p.value === editingProvider)?.label || editingProvider} 配置`} open={formOpen} onOk={handleSave} onCancel={() => setFormOpen(false)} confirmLoading={saveMutation.isPending}>
        <Form form={form} layout="vertical">
          <Form.Item name="clientId" label="Client ID" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="clientSecret" label="Client Secret"><Input.Password placeholder="留空则不修改" /></Form.Item>
          <Form.Item name="redirectUri" label="回调地址"><Input placeholder="https://..." /></Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
