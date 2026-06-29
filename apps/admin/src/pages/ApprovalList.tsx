import { useState } from 'react';
import { Table, Button, Card, Space, message, Modal, Input, Select, Tag, Descriptions, Divider, Form } from 'antd';
import { CheckOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { trpc } from '../trpc/client';

export default function ApprovalListPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const { data, isLoading, refetch } = trpc.approval.list.useQuery({ page, pageSize: 20, status: statusFilter });
  const approveMutation = trpc.approval.approve.useMutation({ onSuccess: () => { message.success('已审批通过'); refetch(); } });
  const rejectMutation = trpc.approval.reject.useMutation({ onSuccess: () => { message.success('已驳回'); refetch(); } });

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [comment, setComment] = useState('');

  // 新建审批
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitForm] = Form.useForm();
  const createMutation = trpc.approval.create.useMutation({
    onSuccess: () => { message.success('审批已提交'); setSubmitOpen(false); submitForm.resetFields(); refetch(); },
    onError: (err) => message.error(err.message),
  });

  const statusMap: Record<string, { color: string; label: string }> = {
    PENDING: { color: 'orange', label: '待审批' },
    APPROVED: { color: 'green', label: '已通过' },
    REJECTED: { color: 'red', label: '已驳回' },
  };

  const columns = [
    { title: '审批标题', dataIndex: 'title', key: 'title' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '申请人', dataIndex: 'applicantId', key: 'applicantId' },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string) => {
        const cfg = statusMap[s] || { color: 'default', label: s };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180, render: (v: string) => new Date(v).toLocaleString('zh-CN') },
    {
      title: '操作', key: 'action', width: 200,
      render: (_: unknown, r: any) => (
        <Space>
          <Button type="link" size="small" onClick={() => { setDetail(r); setDetailOpen(true); setComment(''); }}>详情</Button>
          {r.status === 'PENDING' && (
            <>
              <Button type="link" size="small" style={{ color: '#52c41a' }} icon={<CheckOutlined />}
                onClick={() => Modal.confirm({ title: '审批通过', content: '确定通过此申请？', onOk: () => approveMutation.mutate({ id: r.id }) })}>通过</Button>
              <Button type="link" size="small" danger icon={<CloseOutlined />}
                onClick={() => Modal.confirm({ title: '驳回', content: <Input.TextArea placeholder="驳回原因" onChange={e => setComment(e.target.value)} />, onOk: () => rejectMutation.mutate({ id: r.id, comment }), onCancel: () => setComment('') })}>驳回</Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card title="审批管理" extra={
      <Space>
        <Select value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} allowClear placeholder="全部状态" style={{ width: 120 }}>
          <Select.Option value="PENDING">待审批</Select.Option>
          <Select.Option value="APPROVED">已通过</Select.Option>
          <Select.Option value="REJECTED">已驳回</Select.Option>
        </Select>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setSubmitOpen(true)}>提交审批</Button>
      </Space>
    }>
      <Table dataSource={data?.items} columns={columns} rowKey="id" loading={isLoading}
        pagination={{ current: page, pageSize: 20, total: data?.total, onChange: setPage, showTotal: (t: number) => `共 ${t} 条` }}
      />
      <Modal title="审批详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={600}>
        {detail && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="标题">{detail.title}</Descriptions.Item>
              <Descriptions.Item label="类型">{detail.type}</Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={statusMap[detail.status]?.color}>{statusMap[detail.status]?.label}</Tag></Descriptions.Item>
              <Descriptions.Item label="申请内容"><pre style={{ whiteSpace: 'pre-wrap' }}>{detail.content}</pre></Descriptions.Item>
              <Descriptions.Item label="创建时间">{new Date(detail.createdAt).toLocaleString('zh-CN')}</Descriptions.Item>
            </Descriptions>
            {detail.actions?.length > 0 && (
              <>
                <Divider>审批记录</Divider>
                {detail.actions.map((act: any) => (
                  <p key={act.id}>
                    <Tag color={act.action === 'APPROVED' ? 'green' : 'red'}>{act.action === 'APPROVED' ? '通过' : '驳回'}</Tag>
                    {act.comment && <span>备注：{act.comment}</span>}
                    <span style={{ color: '#999', marginLeft: 8 }}>{new Date(act.createdAt).toLocaleString('zh-CN')}</span>
                  </p>
                ))}
              </>
            )}
          </>
        )}
      </Modal>

      {/* 提交审批弹窗 */}
      <Modal title="提交审批" open={submitOpen} onCancel={() => setSubmitOpen(false)}
        onOk={() => {
          submitForm.validateFields().then((values) => {
            createMutation.mutate(values);
          });
        }}
        confirmLoading={createMutation.isPending}
      >
        <Form form={submitForm} layout="vertical">
          <Form.Item name="title" label="审批标题" rules={[{ required: true, message: '请输入审批标题' }]}>
            <Input placeholder="请输入审批标题" />
          </Form.Item>
          <Form.Item name="type" label="审批类型" initialValue="PERMISSION">
            <Select>
              <Select.Option value="PERMISSION">权限申请</Select.Option>
              <Select.Option value="CHANGE_ROLE">角色变更</Select.Option>
              <Select.Option value="DELETE_USER">用户删除</Select.Option>
              <Select.Option value="OTHER">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="content" label="申请内容" rules={[{ required: true, message: '请输入申请内容' }]}>
            <Input.TextArea rows={6} placeholder="请详细说明申请原因和内容" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
