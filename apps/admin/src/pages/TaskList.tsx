import { useState } from 'react';
import { Table, Button, Card, Space, Popconfirm, message, Modal, Form, Input, Switch, Select } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { trpc } from '../trpc/client';

export default function TaskListPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = trpc.task.list.useQuery({ page, pageSize: 20 });
  const { data: handlers } = trpc.task.getHandlers.useQuery();
  const deleteMutation = trpc.task.delete.useMutation({ onSuccess: () => { message.success('已删除'); refetch(); } });
  const toggleMutation = trpc.task.toggle.useMutation({ onSuccess: () => { message.success('状态已更新'); refetch(); } });

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const createMutation = trpc.task.create.useMutation({ onSuccess: () => { message.success('创建成功'); setFormOpen(false); form.resetFields(); refetch(); } });
  const updateMutation = trpc.task.update.useMutation({ onSuccess: () => { message.success('更新成功'); setFormOpen(false); form.resetFields(); setEditingId(null); refetch(); } });

  const openCreate = () => {
    setEditingId(null); form.resetFields();
    form.setFieldsValue({ cronExpr: '0 3 * * *', status: true });
    setFormOpen(true);
  };
  const openEdit = (id: string) => {
    setEditingId(id);
    const record = data?.items.find((i: { id: string }) => i.id === id);
    if (record) form.setFieldsValue(record);
    setFormOpen(true);
  };
  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingId) updateMutation.mutate({ id: editingId, data: values });
    else createMutation.mutate(values);
  };

  const columns = [
    { title: '任务名称', dataIndex: 'name', key: 'name' },
    { title: 'Cron 表达式', dataIndex: 'cronExpr', key: 'cronExpr' },
    { title: '处理函数', dataIndex: 'handler', key: 'handler' },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s: boolean, r: { id: string }) => (
        <Switch checked={s} size="small" onChange={(v) => toggleMutation.mutate({ id: r.id, status: v })} />
      ),
    },
    { title: '上次运行', dataIndex: 'lastRunAt', key: 'lastRunAt', width: 180, render: (v: string | null) => v ? new Date(v).toLocaleString('zh-CN') : '-' },
    { title: '上次结果', dataIndex: 'lastResult', key: 'lastResult', width: 200, ellipsis: true },
    {
      title: '操作', key: 'action', width: 100,
      render: (_: unknown, r: { id: string }) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(r.id)}>编辑</Button>
          <Popconfirm title="确定删除此任务？" onConfirm={() => deleteMutation.mutate(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="定时任务管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建任务</Button>}>
      <Table dataSource={data?.items} columns={columns} rowKey="id" loading={isLoading}
        pagination={{ current: page, pageSize: 20, total: data?.total, onChange: setPage, showTotal: (t: number) => `共 ${t} 条` }}
      />
      <Modal title={editingId ? '编辑任务' : '新建任务'} open={formOpen} onOk={handleSubmit} onCancel={() => { setFormOpen(false); setEditingId(null); }} confirmLoading={createMutation.isPending || updateMutation.isPending} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="任务名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="handler" label="处理函数" rules={[{ required: true }]}>
            <Select>
              {handlers?.map((h: { value: string; label: string }) => (
                <Select.Option key={h.value} value={h.value}>{h.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="cronExpr" label="Cron 表达式" rules={[{ required: true }]}><Input placeholder="0 3 * * *" /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="status" label="启用" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
