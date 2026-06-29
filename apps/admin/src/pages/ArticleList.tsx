import { useState } from 'react';
import { Table, Button, Card, Space, Popconfirm, message, Modal, Form, Input, Select, Tag, Switch } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, CheckCircleOutlined } from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { trpc } from '../trpc/client';

export default function ArticleListPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = trpc.article.list.useQuery({ page, pageSize: 20 });
  const { data: categories } = trpc.category.tree.useQuery();
  const deleteMutation = trpc.article.delete.useMutation({ onSuccess: () => { message.success('删除成功'); refetch(); } });
  const publishMutation = trpc.article.publish.useMutation({ onSuccess: () => { message.success('已发布'); refetch(); } });

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const createMutation = trpc.article.create.useMutation({ onSuccess: () => { message.success('创建成功'); setFormOpen(false); form.resetFields(); refetch(); } });
  const updateMutation = trpc.article.update.useMutation({ onSuccess: () => { message.success('更新成功'); setFormOpen(false); form.resetFields(); setEditingId(null); refetch(); } });

  const openCreate = () => { setEditingId(null); form.resetFields(); form.setFieldsValue({ status: 'DRAFT', isFeatured: false }); setFormOpen(true); };
  const openEdit = (id: string) => {
    setEditingId(id);
    const r = data?.items.find((i: { id: string }) => i.id === id);
    if (r) form.setFieldsValue(r);
    setFormOpen(true);
  };
  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingId) updateMutation.mutate({ id: editingId, data: values });
    else createMutation.mutate(values);
  };

  const catOptions = categories?.map((c: { id: string; name: string }) => ({ value: c.id, label: c.name })) || [];

  const columns = [
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '分类', dataIndex: ['category', 'name'], key: 'category', render: (n: string) => n ? <Tag>{n}</Tag> : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s: string) => <Tag color={s === 'PUBLISHED' ? 'green' : 'orange'}>{s === 'PUBLISHED' ? '已发布' : '草稿'}</Tag> },
    { title: '浏览', dataIndex: 'viewCount', key: 'viewCount', width: 60 },
    { title: '发布时间', dataIndex: 'publishedAt', key: 'publishedAt', width: 180, render: (v: string | null) => v ? new Date(v).toLocaleString('zh-CN') : '-' },
    {
      title: '操作', key: 'action', width: 200,
      render: (_: unknown, r: { id: string; status: string }) => (
        <Space>
          {r.status === 'DRAFT' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => publishMutation.mutate(r.id)}>发布</Button>
          )}
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r.id)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => deleteMutation.mutate(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="文章管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建文章</Button>}>
      <Table dataSource={data?.items} columns={columns} rowKey="id" loading={isLoading}
        pagination={{ current: page, pageSize: 20, total: data?.total, onChange: setPage, showTotal: (t: number) => `共 ${t} 条` }}
      />
      <Modal title={editingId ? '编辑文章' : '新建文章'} open={formOpen} onOk={handleSubmit} onCancel={() => { setFormOpen(false); setEditingId(null); }} width={800} confirmLoading={createMutation.isPending || updateMutation.isPending}>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true }]}>
            <ReactQuill theme="snow" style={{ height: 300, marginBottom: 48 }} />
          </Form.Item>
          <Form.Item name="summary" label="摘要"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="coverUrl" label="封面 URL"><Input placeholder="https://..." /></Form.Item>
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="categoryId" label="分类"><Select options={catOptions} allowClear style={{ width: 200 }} /></Form.Item>
            <Form.Item name="status" label="状态"><Select style={{ width: 120 }}><Select.Option value="DRAFT">草稿</Select.Option><Select.Option value="PUBLISHED">发布</Select.Option></Select></Form.Item>
            <Form.Item name="isFeatured" label="推荐" valuePropName="checked"><Switch /></Form.Item>
          </Space>
          <Form.Item name="seoTitle" label="SEO 标题"><Input /></Form.Item>
          <Form.Item name="seoDesc" label="SEO 描述"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="seoKeywords" label="SEO 关键词"><Input placeholder="逗号分隔" /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
