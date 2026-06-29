import { useMemo } from 'react';
import { Table, Button, Card, Space, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../trpc/client';

/** 扁平列表 → 嵌套树结构（根据 parentId） */
function buildTree<T extends { id: string; parentId: string | null }>(items: T[]): (T & { children: T[] })[] {
  const map = new Map<string, T & { children: T[] }>();
  const roots: (T & { children: T[] })[] = [];

  for (const item of items) {
    map.set(item.id, { ...item, children: [] });
  }

  for (const item of items) {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export default function OrgListPage() {
  const navigate = useNavigate();
  const { data, isLoading, refetch } = trpc.org.tree.useQuery();
  const deleteMutation = trpc.org.delete.useMutation({
    onSuccess: () => {
      message.success('删除成功');
      refetch();
    },
    onError: (err) => message.error(err.message),
  });

  const dataSource = useMemo(() => {
    if (!data) return [];
    return buildTree(data);
  }, [data]);

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '组织编码', dataIndex: 'code', key: 'code' },
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
        dataSource={dataSource}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        defaultExpandAllRows
        size="middle"
      />
    </Card>
  );
}
