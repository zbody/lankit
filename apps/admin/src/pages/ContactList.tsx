import { useState } from 'react';
import { Table, Button, Card, Space, message, Modal, Input, Tag, Select } from 'antd';
import { MailOutlined, CheckOutlined } from '@ant-design/icons';
import { trpc } from '../trpc/client';

export default function ContactListPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const { data, isLoading, refetch } = trpc.contact.list.useQuery({ page, pageSize: 20, status: statusFilter });
  const replyMutation = trpc.contact.reply.useMutation({ onSuccess: () => { message.success('回复成功'); setReplyOpen(false); refetch(); } });
  const markReadMutation = trpc.contact.markRead.useMutation({ onSuccess: () => refetch() });

  const [replyOpen, setReplyOpen] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const statusMap: Record<string, { color: string; label: string }> = {
    UNREAD: { color: 'red', label: '未读' },
    READ: { color: 'blue', label: '已读' },
    REPLIED: { color: 'green', label: '已回复' },
  };

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '主题', dataIndex: 'subject', key: 'subject', ellipsis: true },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s: string) => { const c = statusMap[s] || { color: 'default', label: s }; return <Tag color={c.color}>{c.label}</Tag>; },
    },
    { title: '时间', dataIndex: 'createdAt', key: 'createdAt', width: 180, render: (v: string) => new Date(v).toLocaleString('zh-CN') },
    {
      title: '操作', key: 'action', width: 160,
      render: (_: unknown, r: { id: string; status: string }) => (
        <Space>
          {r.status === 'UNREAD' && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => markReadMutation.mutate(r.id)}>标记已读</Button>
          )}
          <Button type="link" size="small" icon={<MailOutlined />} onClick={() => { setCurrentId(r.id); setReplyContent(''); setReplyOpen(true); }}>回复</Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title="联系表单管理" extra={
      <Select value={statusFilter} onChange={setStatusFilter} allowClear placeholder="全部状态" style={{ width: 120 }}>
        <Select.Option value="UNREAD">未读</Select.Option>
        <Select.Option value="READ">已读</Select.Option>
        <Select.Option value="REPLIED">已回复</Select.Option>
      </Select>
    }>
      <Table dataSource={data?.items} columns={columns} rowKey="id" loading={isLoading}
        pagination={{ current: page, pageSize: 20, total: data?.total, onChange: setPage, showTotal: (t: number) => `共 ${t} 条` }}
      />
      <Modal title="回复留言" open={replyOpen} onCancel={() => setReplyOpen(false)}
        onOk={() => currentId && replyMutation.mutate({ id: currentId, reply: replyContent })}
        confirmLoading={replyMutation.isPending}
      >
        <Input.TextArea rows={6} placeholder="输入回复内容" value={replyContent} onChange={(e) => setReplyContent(e.target.value)} />
      </Modal>
    </Card>
  );
}
