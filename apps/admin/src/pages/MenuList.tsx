import { useMemo, useState } from 'react';
import { Table, Button, Card, Space, Popconfirm, message, Tag, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../trpc/client';
import { usePermission } from '../hooks/usePermission';

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
  const { hasPermission } = usePermission();
  const deleteMutation = trpc.menu.delete.useMutation({
    onSuccess: () => {
      message.success('删除成功');
      refetch();
    },
    onError: (err) => message.error(err.message),
  });
  const [searchText, setSearchText] = useState('');

  const dataSource = useMemo(() => {
    if (!data) return [];
    const tree = buildTree(data);
    if (!searchText) return tree;
    const q = searchText.toLowerCase();
    /** 递归过滤树：保留匹配节点及其祖先路径 */
    function filterTree(nodes: any[]): any[] {
      const filtered: any[] = [];
      for (const node of nodes) {
        const children = filterTree(node.children || []);
        const match =
          node.title?.toLowerCase().includes(q) || node.path?.toLowerCase().includes(q);
        if (match || children.length > 0) {
          filtered.push({ ...node, children });
        }
      }
      return filtered;
    }
    return filterTree(tree);
  }, [data, searchText]);

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
          {hasPermission('menu:edit') && (
            <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/menus/${record.id}/edit`)}>
              编辑
            </Button>
          )}
          {hasPermission('menu:delete') && (
            <Popconfirm title="确认删除？" onConfirm={() => deleteMutation.mutate(record.id)}>
              <Button type="link" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="菜单管理"
      extra={
        <Space>
          <Input
            placeholder="搜索名称或路径"
            prefix={<SearchOutlined />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 220 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/menus/new')}>
            新建菜单
          </Button>
        </Space>
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
