import { useState } from 'react';
import { Card, Table, Tabs, Button, Space, Popconfirm, message, Tag } from 'antd';
import { RollbackOutlined, DeleteOutlined } from '@ant-design/icons';
import { trpc } from '../trpc/client';

const MODULES = [
  { key: 'org', label: '组织' },
  { key: 'user', label: '用户' },
  { key: 'role', label: '角色' },
  { key: 'menu', label: '菜单' },
] as const;

type ModuleKey = (typeof MODULES)[number]['key'];

/** 各模块后台接口映射 */
export default function RecycleBinPage() {
  const [activeTab, setActiveTab] = useState<ModuleKey>('org');
  const utils = trpc.useUtils();

  const orgRecycle = trpc.org.recycleBin.useQuery();
  const orgRestore = trpc.org.restore.useMutation({ onSuccess: () => { message.success('已恢复'); orgRecycle.refetch(); utils.org.list.invalidate(); } });
  const orgForceDel = trpc.org.forceDelete.useMutation({ onSuccess: () => { message.success('已永久删除'); orgRecycle.refetch(); } });

  const userRecycle = trpc.user.recycleBin.useQuery();
  const userRestore = trpc.user.restore.useMutation({ onSuccess: () => { message.success('已恢复'); userRecycle.refetch(); utils.user.list.invalidate(); } });
  const userForceDel = trpc.user.forceDelete.useMutation({ onSuccess: () => { message.success('已永久删除'); userRecycle.refetch(); } });

  const roleRecycle = trpc.role.recycleBin.useQuery();
  const roleRestore = trpc.role.restore.useMutation({ onSuccess: () => { message.success('已恢复'); roleRecycle.refetch(); utils.role.list.invalidate(); } });
  const roleForceDel = trpc.role.forceDelete.useMutation({ onSuccess: () => { message.success('已永久删除'); roleRecycle.refetch(); } });

  const menuRecycle = trpc.menu.recycleBin.useQuery();
  const menuRestore = trpc.menu.restore.useMutation({ onSuccess: () => { message.success('已恢复'); menuRecycle.refetch(); utils.menu.list.invalidate(); } });
  const menuForceDel = trpc.menu.forceDelete.useMutation({ onSuccess: () => { message.success('已永久删除'); menuRecycle.refetch(); } });

  const queryMap: Record<ModuleKey, { data: any; isLoading: boolean; refetch: () => void }> = {
    org: orgRecycle,
    user: userRecycle,
    role: roleRecycle,
    menu: menuRecycle,
  };

  const restoreMap: Record<ModuleKey, (id: string) => void> = {
    org: (id) => orgRestore.mutate(id),
    user: (id) => userRestore.mutate(id),
    role: (id) => roleRestore.mutate(id),
    menu: (id) => menuRestore.mutate(id),
  };

  const forceDeleteMap: Record<ModuleKey, (id: string) => void> = {
    org: (id) => orgForceDel.mutate(id),
    user: (id) => userForceDel.mutate(id),
    role: (id) => roleForceDel.mutate(id),
    menu: (id) => menuForceDel.mutate(id),
  };

  const isPendingMap: Record<ModuleKey, boolean> = {
    org: orgRestore.isPending || orgForceDel.isPending,
    user: userRestore.isPending || userForceDel.isPending,
    role: roleRestore.isPending || roleForceDel.isPending,
    menu: menuRestore.isPending || menuForceDel.isPending,
  };

  const { data: currentData, isLoading } = queryMap[activeTab];
  const currentRestore = restoreMap[activeTab];
  const currentForceDelete = forceDeleteMap[activeTab];
  const currentPending = isPendingMap[activeTab];

  const countMap: Record<ModuleKey, number> = {
    org: queryMap.org.data?.length ?? 0,
    user: queryMap.user.data?.length ?? 0,
    role: queryMap.role.data?.length ?? 0,
    menu: queryMap.menu.data?.length ?? 0,
  };

  const columns: Record<ModuleKey, any[]> = {
    org: [
      { title: '名称', dataIndex: 'name', key: 'name' },
      { title: '编码', dataIndex: 'code', key: 'code' },
      { title: '删除时间', dataIndex: 'deletedAt', key: 'deletedAt', render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-' },
      {
        title: '操作', key: 'action', width: 200,
        render: (_: unknown, r: { id: string }) => (
          <Space>
            <Button type="link" icon={<RollbackOutlined />} loading={currentPending} onClick={() => currentRestore(r.id)}>恢复</Button>
            <Popconfirm title="永久删除后不可恢复，确认？" onConfirm={() => currentForceDelete(r.id)}>
              <Button type="link" danger icon={<DeleteOutlined />} loading={currentPending}>彻底删除</Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    user: [
      { title: '姓名', dataIndex: 'name', key: 'name' },
      { title: '邮箱', dataIndex: 'email', key: 'email' },
      { title: '删除时间', dataIndex: 'deletedAt', key: 'deletedAt', render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-' },
      {
        title: '操作', key: 'action', width: 200,
        render: (_: unknown, r: { id: string }) => (
          <Space>
            <Button type="link" icon={<RollbackOutlined />} loading={currentPending} onClick={() => currentRestore(r.id)}>恢复</Button>
            <Popconfirm title="永久删除后不可恢复，确认？" onConfirm={() => currentForceDelete(r.id)}>
              <Button type="link" danger icon={<DeleteOutlined />} loading={currentPending}>彻底删除</Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    role: [
      { title: '名称', dataIndex: 'name', key: 'name' },
      { title: '编码', dataIndex: 'code', key: 'code' },
      { title: '删除时间', dataIndex: 'deletedAt', key: 'deletedAt', render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-' },
      {
        title: '操作', key: 'action', width: 200,
        render: (_: unknown, r: { id: string }) => (
          <Space>
            <Button type="link" icon={<RollbackOutlined />} loading={currentPending} onClick={() => currentRestore(r.id)}>恢复</Button>
            <Popconfirm title="永久删除后不可恢复，确认？" onConfirm={() => currentForceDelete(r.id)}>
              <Button type="link" danger icon={<DeleteOutlined />} loading={currentPending}>彻底删除</Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    menu: [
      { title: '名称', dataIndex: 'name', key: 'name' },
      { title: '路径', dataIndex: 'path', key: 'path' },
      { title: '类型', dataIndex: 'type', key: 'type', render: (v: string) => {
        const map: Record<string, string> = { DIRECTORY: '目录', MENU: '菜单', BUTTON: '按钮' };
        return map[v] ?? v;
      }},
      { title: '删除时间', dataIndex: 'deletedAt', key: 'deletedAt', render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-' },
      {
        title: '操作', key: 'action', width: 200,
        render: (_: unknown, r: { id: string }) => (
          <Space>
            <Button type="link" icon={<RollbackOutlined />} loading={currentPending} onClick={() => currentRestore(r.id)}>恢复</Button>
            <Popconfirm title="永久删除后不可恢复，确认？" onConfirm={() => currentForceDelete(r.id)}>
              <Button type="link" danger icon={<DeleteOutlined />} loading={currentPending}>彻底删除</Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
  };

  const tabItems = MODULES.map((m) => ({
    key: m.key,
    label: (
      <span>
        {m.label}
        <Tag style={{ marginLeft: 6 }}>{countMap[m.key]}</Tag>
      </span>
    ),
    children: (
      <Table
        dataSource={currentData ?? []}
        columns={columns[m.key]}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
      />
    ),
  }));

  return (
    <Card title="回收站">
      <Tabs activeKey={activeTab} onChange={(k) => setActiveTab(k as ModuleKey)} items={tabItems} />
    </Card>
  );
}
