import { useState } from 'react';
import {
  Table, Button, Card, Space, Popconfirm, message, Tag, Modal, Form,
  Input, InputNumber, Switch, Select, Drawer,
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { trpc } from '../trpc/client';

export default function DictTypeListPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = trpc.dict.listTypes.useQuery({ page, pageSize: 20 });
  const deleteMutation = trpc.dict.deleteType.useMutation({
    onSuccess: () => { message.success('删除成功'); refetch(); },
    onError: (err) => message.error(err.message),
  });

  // 新建/编辑弹窗
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const createMutation = trpc.dict.createType.useMutation({
    onSuccess: () => { message.success('创建成功'); setFormOpen(false); form.resetFields(); refetch(); },
    onError: (err) => message.error(err.message),
  });
  const updateMutation = trpc.dict.updateType.useMutation({
    onSuccess: () => { message.success('更新成功'); setFormOpen(false); form.resetFields(); setEditingId(null); refetch(); },
    onError: (err) => message.error(err.message),
  });

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
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
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  // 数据项抽屉
  const [dataDrawerOpen, setDataDrawerOpen] = useState(false);
  const [currentTypeId, setCurrentTypeId] = useState<string | null>(null);
  const [currentTypeName, setCurrentTypeName] = useState('');

  const columns = [
    { title: '字典名称', dataIndex: 'name', key: 'name' },
    { title: '编码', dataIndex: 'code', key: 'code' },
    {
      title: '类型', dataIndex: 'kind', key: 'kind', width: 100,
      render: (v: string) => {
        const map: Record<string, string> = { STRING: '字符串', NUMBER: '数字', BOOLEAN: '布尔' };
        return <Tag>{map[v] || v}</Tag>;
      },
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (v: boolean) => v ? <Tag color="green">启用</Tag> : <Tag color="red">停用</Tag>,
    },
    { title: '数据项', dataIndex: 'itemCount', key: 'itemCount', width: 80 },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 60 },
    {
      title: '操作', key: 'action',
      render: (_: unknown, record: { id: string; name: string }) => (
        <Space>
          <Button type="link" icon={<UnorderedListOutlined />}
            onClick={() => { setCurrentTypeId(record.id); setCurrentTypeName(record.name); setDataDrawerOpen(true); }}>
            数据项
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record.id)}>编辑</Button>
          <Popconfirm title="确认删除？此操作会删除所有数据项" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title="数据字典"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建字典</Button>}
      >
        <Table
          dataSource={data?.items}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page, pageSize: 20, total: data?.total,
            onChange: setPage, showTotal: (t: number) => `共 ${t} 条`,
          }}
        />
      </Card>

      <Modal
        title={editingId ? '编辑字典' : '新建字典'}
        open={formOpen}
        onOk={handleSubmit}
        onCancel={() => { setFormOpen(false); setEditingId(null); form.resetFields(); }}
        confirmLoading={createMutation.isLoading || updateMutation.isLoading}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="字典名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：性别" />
          </Form.Item>
          <Form.Item name="code" label="字典编码">
            <Input placeholder="留空自动生成" />
          </Form.Item>
          <Form.Item name="kind" label="值类型" initialValue="STRING">
            <Select>
              <Select.Option value="STRING">字符串</Select.Option>
              <Select.Option value="NUMBER">数字</Select.Option>
              <Select.Option value="BOOLEAN">布尔</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="sort" label="排序" initialValue={0}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={`数据项 - ${currentTypeName}`}
        open={dataDrawerOpen}
        onClose={() => { setDataDrawerOpen(false); setCurrentTypeId(null); }}
        width={600}
        destroyOnClose
      >
        {currentTypeId && <DictDataPanel dictTypeId={currentTypeId} />}
      </Drawer>
    </>
  );
}

/** 数据项管理面板（内嵌在 Drawer 中） */
function DictDataPanel({ dictTypeId }: { dictTypeId: string }) {
  const { data, isLoading, refetch } = trpc.dict.listData.useQuery({ dictTypeId, pageSize: 200 });
  const createMutation = trpc.dict.createData.useMutation({
    onSuccess: () => { message.success('添加成功'); refetch(); },
    onError: (err) => message.error(err.message),
  });
  const updateMutation = trpc.dict.updateData.useMutation({
    onSuccess: () => { message.success('更新成功'); refetch(); },
    onError: (err) => message.error(err.message),
  });
  const deleteMutation = trpc.dict.deleteData.useMutation({
    onSuccess: () => { message.success('删除成功'); refetch(); },
    onError: (err) => message.error(err.message),
  });

  const [editing, setEditing] = useState<string | null>(null);
  const [form] = Form.useForm();

  const startEdit = (record?: Record<string, unknown>) => {
    setEditing((record?.id as string) ?? null);
    form.setFieldsValue(record ?? { label: '', value: '', color: '', sort: 0, status: true, remark: '' });
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    if (editing) {
      updateMutation.mutate({ id: editing, data: values });
    } else {
      createMutation.mutate({ dictTypeId, ...values });
    }
    form.resetFields();
    setEditing(null);
  };

  const columns = [
    { title: '标签', dataIndex: 'label', key: 'label' },
    { title: '值', dataIndex: 'value', key: 'value' },
    {
      title: '颜色', dataIndex: 'color', key: 'color',
      render: (v: string) => v ? <Tag color={v}>{v}</Tag> : '-',
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (v: boolean) => v ? <Tag color="green">启用</Tag> : <Tag color="red">停用</Tag>,
    },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 60 },
    {
      title: '操作', key: 'action',
      render: (_: unknown, record: { id: string }) => (
        <Space>
          <Button type="link" size="small" onClick={() => startEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {editing === null ? (
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => startEdit()} style={{ marginBottom: 16 }}>
          新增数据项
        </Button>
      ) : (
        <Card size="small" title={editing ? '编辑数据项' : '新增数据项'} style={{ marginBottom: 16 }}>
          <Form form={form} layout="inline" onFinish={handleSave}>
            <Form.Item name="label" rules={[{ required: true }]}><Input placeholder="标签" /></Form.Item>
            <Form.Item name="value" rules={[{ required: true }]}><Input placeholder="值" /></Form.Item>
            <Form.Item name="color"><Input placeholder="颜色" /></Form.Item>
            <Form.Item name="sort" initialValue={0}><InputNumber placeholder="排序" /></Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" size="small">保存</Button>
                <Button size="small" onClick={() => { setEditing(null); form.resetFields(); }}>取消</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}

      <Table
        dataSource={data?.items}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="small"
        pagination={false}
      />
    </div>
  );
}
