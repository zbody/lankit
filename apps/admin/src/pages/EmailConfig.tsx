import { useEffect } from 'react';
import { Card, Form, Input, InputNumber, Button, message, Tabs, Table, Tag, Space, Switch } from 'antd';
import { trpc } from '../trpc/client';

export default function EmailConfigPage() {
  const [form] = Form.useForm();
  const { data: config, refetch } = trpc.email.getConfig.useQuery();
  const saveMutation = trpc.email.saveConfig.useMutation({
    onSuccess: () => { message.success('SMTP 配置已保存'); refetch(); },
    onError: (err) => message.error(err.message),
  });
  const testMutation = trpc.email.test.useMutation({
    onSuccess: () => message.success('测试邮件发送成功！请检查收件箱'),
    onError: (err) => message.error(err.message),
  });
  const { data: logsData } = trpc.email.logs.useQuery({ page: 1, pageSize: 50 });

  useEffect(() => {
    if (config) form.setFieldsValue(config);
  }, [config, form]);

  const handleSave = async () => {
    const values = await form.validateFields();
    saveMutation.mutate(values);
  };

  const handleTest = () => {
    const email = prompt('请输入测试邮箱：');
    if (email) testMutation.mutate({ to: email });
  };

  const logColumns = [
    { title: '收件人', dataIndex: 'to', key: 'to' },
    { title: '主题', dataIndex: 'subject', key: 'subject', ellipsis: true },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string) => <Tag color={s === 'SUCCESS' ? 'green' : 'red'}>{s === 'SUCCESS' ? '成功' : '失败'}</Tag>,
    },
    { title: '错误信息', dataIndex: 'errorMsg', key: 'errorMsg', ellipsis: true },
    { title: '时间', dataIndex: 'createdAt', key: 'createdAt', width: 180, render: (v: string) => new Date(v).toLocaleString('zh-CN') },
  ];

  return (
    <Card title="邮件配置">
      <Tabs items={[
        {
          key: 'config', label: 'SMTP 设置',
          children: (
            <Form form={form} layout="vertical" style={{ maxWidth: 500 }}>
              <Form.Item name="host" label="SMTP 服务器" rules={[{ required: true }]}>
                <Input placeholder="smtp.example.com" />
              </Form.Item>
              <Form.Item name="port" label="端口" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={1} max={65535} placeholder="587" />
              </Form.Item>
              <Form.Item name="user" label="用户名" rules={[{ required: true }]}>
                <Input placeholder="user@example.com" />
              </Form.Item>
              <Form.Item name="pass" label="密码">
                <Input.Password placeholder="留空则不修改" />
              </Form.Item>
              <Form.Item name="from" label="发件人地址">
                <Input placeholder="默认使用用户名" />
              </Form.Item>
              <Form.Item name="secure" label="SSL" valuePropName="checked" getValueFromEvent={(e) => String(e)} getValueProps={(v) => ({ checked: v === 'true' })}>
                <Switch />
              </Form.Item>
              <Space>
                <Button type="primary" onClick={handleSave} loading={saveMutation.isPending}>保存配置</Button>
                <Button onClick={handleTest} loading={testMutation.isPending}>发送测试邮件</Button>
              </Space>
            </Form>
          ),
        },
        {
          key: 'logs', label: '发送记录',
          children: (
            <Table dataSource={logsData?.items} columns={logColumns} rowKey="id" size="small" pagination={{ pageSize: 20, total: logsData?.total }} />
          ),
        },
      ]} />
    </Card>
  );
}
