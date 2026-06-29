import { useMemo } from 'react';
import { Table, Button, Card, Space, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../trpc/client';

const typeColors: Record<string, string> = { DIRECTORY: 'orange', MENU: 'blue', BUTTON: 'green' };
const typeLabels: Record<string, string> = { DIRECTORY: '目录', MENU: '菜单', BUTTON: '按钮' };

/** 扁平列表 → 嵌套树结构 */
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

export default function MenuListPage() {
  const navigate = useNavigate();
  const { data, isLoading, refetch } = trpc.menu.tree.useQuery();
  const deleteMutation = trpc.menu.delete.useMutation({
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
    { title: '路径', dataIndex: 'path', key: 'path' },
    { title: '图标', dataIndex: 'icon', key: 'icon' },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (v: string) => <Tag color={typeColors[v]}>{typeLabels[v] ?? v}</Tag>,
    },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: { id: string }) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/menus/${record.id}/edit`)}>
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
      title="菜单管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/menus/new')}>
          新建菜单
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
