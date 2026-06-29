import { useState } from 'react';
import { Table, Button, Card, Space, Tag, Typography, Input } from 'antd';
import { CheckCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { trpc } from '../trpc/client';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

const typeColors: Record<string, string> = {
  INFO: 'blue',
  WARNING: 'orange',
  ERROR: 'red',
  SUCCESS: 'green',
};

const typeLabels: Record<string, string> = {
  INFO: '信息',
  WARNING: '警告',
  ERROR: '错误',
  SUCCESS: '成功',
};

export default function NotificationCenterPage() {
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const { data, isLoading, refetch } = trpc.notification.list.useQuery({ page, pageSize: 20 });
  const { data: unreadData } = trpc.notification.unreadCount.useQuery();
  const markAsReadMutation = trpc.notification.markAsRead.useMutation({
    onSuccess: () => refetch(),
  });
  const markAllAsReadMutation = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => refetch(),
  }  );

  const filteredItems = (data?.items || []).filter((item) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return (
      (item?.title || '').toLowerCase().includes(q) ||
      (item?.message || '').toLowerCase().includes(q)
    );
  });

  const columns: ColumnsType<any> = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (v: string) => <Tag color={typeColors[v]}>{typeLabels[v] || v}</Tag>,
    },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '内容', dataIndex: 'message', key: 'message', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'isRead',
      key: 'isRead',
      width: 100,
      render: (v: boolean) => v ? <Text type="secondary">已读</Text> : <Text strong style={{ color: '#f5222d' }}>未读</Text>,
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => (
        !record.isRead && (
          <Button
            type="link"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => markAsReadMutation.mutate(record.id)}
          >
            标记已读
          </Button>
        )
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <span>通知中心</span>
          {unreadData && unreadData.count > 0 && (
            <Tag color="red">{unreadData.count} 条未读</Tag>
          )}
        </Space>
      }
      extra={
        <Space>
          <Input
            placeholder="搜索标题/内容"
            prefix={<SearchOutlined />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 220 }}
          />
          <Button onClick={() => refetch()}>刷新</Button>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => markAllAsReadMutation.mutate()}
            loading={markAllAsReadMutation.isPending}
          >
            全部已读
          </Button>
        </Space>
      }
    >
      <Table
        dataSource={filteredItems}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize: 20,
          total: filteredItems?.length,
          onChange: setPage,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </Card>
  );
}
