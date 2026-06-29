import { Table, Button, Card, Space, Tag, message, Modal } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DownloadOutlined, ImportOutlined } from '@ant-design/icons';
import { trpc } from '../trpc/client';
import BatchOperations from '../components/BatchOperations';
import ImportModal from '../components/ImportModal';

export default function UserListPage() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [importVisible, setImportVisible] = useState(false);
  const { data, isLoading } = trpc.user.list.useQuery({ page: 1, pageSize: 20 });
  const exportMutation = trpc.export.exportUsers.useMutation({
    onSuccess: (data) => {
      const link = document.createElement('a');
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${data.data}`;
      link.download = data.filename;
      link.click();
      message.success('导出成功');
    },
    onError: (err) => message.error(err.message),
  });
  const resetPwdMutation = trpc.user.resetPassword.useMutation({
    onSuccess: () => message.success('密码已重置为 123456'),
    onError: (err) => message.error(err.message),
  });
  const deleteMutation = trpc.user.delete.useMutation({
    onSuccess: () => {
      message.success('删除成功');
      utils.user.list.invalidate();
    },
    onError: (err) => message.error(err.message),
  });

  const handleImport = () => {
    setImportVisible(true);
  };

  const handleImportSuccess = () => {
    setImportVisible(false);
    utils.user.list.invalidate();
    message.success('导入完成');
  };

  const columns = [
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '组织',
      dataIndex: 'organization',
      key: 'organization',
      render: (org: { name: string } | null) => org?.name ?? '-',
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: { name: string; code: string }[]) =>
        roles?.map((r) => <Tag key={r.code} color="blue">{r.name}</Tag>),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (v: boolean) => v ? <Tag color="green">启用</Tag> : <Tag color="red">禁用</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: { id: string; name: string }) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/users/${record.id}/edit`)}>
            编辑
          </Button>
          <Button type="link" onClick={() => resetPwdMutation.mutate({ id: record.id, password: '123456' })}>
            重置密码
          </Button>
          <Button
            type="link"
            danger
            loading={deleteMutation.isLoading}
            onClick={() =>
              Modal.confirm({
                title: '确认删除',
                content: `确定要删除用户 "${record.name}" 吗？`,
                okText: '删除',
                okType: 'danger',
                cancelText: '取消',
                onOk: () => deleteMutation.mutateAsync(record.id),
              })
            }
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="用户管理"
      extra={
        <Space>
          <Button
            icon={<ImportOutlined />}
            onClick={handleImport}
          >
            导入数据
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => exportMutation.mutate({ page: 1, pageSize: 10000 })}
            loading={exportMutation.isLoading}
          >
            导出数据
          </Button>
          <Button type="primary" onClick={() => navigate('/users/new')}>
            新建用户
          </Button>
        </Space>
      }
    >
      <BatchOperations selectedIds={selectedIds} onCompleted={() => setSelectedIds([])} />
      <Table
        dataSource={data?.items}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => setSelectedIds(keys as string[]),
        }}
        pagination={{ total: data?.total, pageSize: 20, showTotal: (t: number) => `共 ${t} 条` }}
      />
      <ImportModal
        visible={importVisible}
        onClose={() => setImportVisible(false)}
        targetType="users"
        onSuccess={handleImportSuccess}
      />
    </Card>
  );
}
