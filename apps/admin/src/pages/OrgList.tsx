import { Table, Button, Card, Space, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../trpc/client';

export default function OrgListPage() {
  const navigate = useNavigate();
  const { data, isLoading, refetch } = trpc.org.list.useQuery({ page: 1, pageSize: 100 });
  const deleteMutation = trpc.org.delete.useMutation({
    onSuccess: () => {
      message.success('删除成功');
      refetch();
    },
    onError: (err) => message.error(err.message),
  });

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '上级组织',
      dataIndex: 'parent',
      key: 'parent',
      render: (parent: { name: string } | null) => parent?.name ?? '-',
    },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: { id: string }) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/orgs/${record.id}/edit`)}>
            编辑
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
      title="组织管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/orgs/new')}>
          新建组织
        </Button>
      }
    >
      <Table
        dataSource={data?.items}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={false}
      />
    </Card>
  );
}
