import { Table, Button, Card, Space, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../trpc/client';

export default function RoleListPage() {
  const navigate = useNavigate();
  const { data, isLoading, refetch } = trpc.role.list.useQuery({ page: 1, pageSize: 100 });
  const deleteMutation = trpc.role.delete.useMutation({
    onSuccess: () => {
      message.success('删除成功');
      refetch();
    },
    onError: (err) => message.error(err.message),
  });

  const columns = [
    { title: '角色名称', dataIndex: 'name', key: 'name' },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '用户数', dataIndex: 'userCount', key: 'userCount', width: 80 },
    {
      title: '系统角色',
      dataIndex: 'isSystem',
      key: 'isSystem',
      width: 100,
      render: (v: boolean) => v ? <Tag color="blue">系统</Tag> : <Tag>自定义</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: { id: string }) => (
        <Space>
          <Button type="link" icon={<SafetyOutlined />} onClick={() => navigate(`/roles/${record.id}/edit`)}>
            权限
          </Button>
          <Popconfirm title="确认删除？" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="角色管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/roles/new')}>
          新建角色
        </Button>
      }
    >
      <Table
        dataSource={data?.items}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ total: data?.total, pageSize: 20, showTotal: (t: number) => `共 ${t} 条` }}
      />
    </Card>
  );
}
