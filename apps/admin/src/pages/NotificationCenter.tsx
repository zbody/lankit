import { Table, Button, Card, Space, Tag, Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
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
  const { data, isLoading, refetch } = trpc.notification.list.useQuery({ page: 1, pageSize: 20 });
  const { data: unreadData } = trpc.notification.unreadCount.useQuery();
  const markAsReadMutation = trpc.notification.markAsRead.useMutation({
    onSuccess: () => refetch(),
  });
  const markAllAsReadMutation = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => refetch(),
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
          <Button onClick={() => refetch()}>刷新</Button>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => markAllAsReadMutation.mutate()}
            loading={markAllAsReadMutation.isLoading}
          >
            全部已读
          </Button>
        </Space>
      }
    >
      <Table
        dataSource={data?.items}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{
          total: data?.total,
          pageSize: 20,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </Card>
  );
}
