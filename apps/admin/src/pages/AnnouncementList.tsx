import { useState } from 'react';
import { Table, Button, Card, Space, Popconfirm, message, Tag, Modal, Form, Input, InputNumber, Switch, Select } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { trpc } from '../trpc/client';

const levelConfig: Record<string, { color: string; label: string }> = {
  INFO: { color: 'blue', label: '普通' },
  WARNING: { color: 'orange', label: '警告' },
  IMPORTANT: { color: 'red', label: '重要' },
};

export default function AnnouncementListPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = trpc.announcement.list.useQuery({ page, pageSize: 20 });
  const deleteMutation = trpc.announcement.delete.useMutation({
    onSuccess: () => { message.success('删除成功'); refetch(); },
    onError: (err) => message.error(err.message),
  });

  // 新建/编辑弹窗
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState({ title: '', content: '' });
  const [form] = Form.useForm();
  const createMutation = trpc.announcement.create.useMutation({
    onSuccess: () => { message.success('创建成功'); setFormOpen(false); form.resetFields(); refetch(); },
    onError: (err) => message.error(err.message),
  });
  const updateMutation = trpc.announcement.update.useMutation({
    onSuccess: () => { message.success('更新成功'); setFormOpen(false); form.resetFields(); setEditingId(null); refetch(); },
    onError: (err) => message.error(err.message),
  });

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ level: 'INFO', status: true, sort: 0 });
    setFormOpen(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    const record = data?.items.find((i: { id: string }) => i.id === id);
    if (record) {
      form.setFieldsValue({
        title: record.title,
        content: record.content,
        level: record.level,
        status: record.status,
        sort: record.sort,
      });
    }
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
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: string) => {
        const cfg = levelConfig[level] || { color: 'default', label: level };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: boolean) => <Tag color={status ? 'green' : 'default'}>{status ? '已发布' : '草稿'}</Tag>,
    },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 60 },
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
      width: 180,
      render: (_: unknown, record: { id: string; title: string; content: string }) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setPreviewContent({ title: record.title, content: record.content });
              setPreviewOpen(true);
            }}
          >
            预览
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record.id)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此公告？" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="公告管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建公告</Button>}>
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
        title={editingId ? '编辑公告' : '新建公告'}
        open={formOpen}
        onOk={handleSubmit}
        onCancel={() => { setFormOpen(false); setEditingId(null); }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入公告标题' }]}>
            <Input placeholder="请输入公告标题" maxLength={200} />
          </Form.Item>
          <Form.Item name="level" label="级别">
            <Select>
              <Select.Option value="INFO">普通</Select.Option>
              <Select.Option value="WARNING">警告</Select.Option>
              <Select.Option value="IMPORTANT">重要</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入公告内容' }]}>
            <Input.TextArea rows={8} placeholder="支持 HTML 格式" />
          </Form.Item>
          <Form.Item name="sort" label="排序">
            <InputNumber min={0} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked">
            <Switch checkedChildren="已发布" unCheckedChildren="草稿" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 预览弹窗 */}
      <Modal
        title={previewContent.title}
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        width={600}
      >
        <div dangerouslySetInnerHTML={{ __html: previewContent.content }} />
      </Modal>
    </Card>
  );
}
