import { useState } from 'react';
import { Table, Button, Card, Space, Popconfirm, message, Upload, Tag, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, DownloadOutlined, FileOutlined } from '@ant-design/icons';
import { trpc } from '../trpc/client';
import type { UploadProps } from 'antd';

export default function FileListPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = trpc.file.list.useQuery({ page, pageSize: 20 });
  const deleteMutation = trpc.file.delete.useMutation({
    onSuccess: () => { message.success('删除成功'); refetch(); },
    onError: (err) => message.error(err.message),
  });
  const uploadMutation = trpc.file.upload.useMutation({
    onSuccess: () => { message.success('上传成功'); refetch(); },
    onError: (err) => message.error(err.message),
  });

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    if (!(file instanceof File)) {
      onError?.(new Error('Invalid file'));
      return;
    }
    const buffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    try {
      await uploadMutation.mutateAsync({
        name: file.name,
        type: file.type,
        size: file.size,
        buffer: base64,
      });
      onSuccess?.(undefined);
    } catch (err) {
      onError?.(err as Error);
    }
  };

  const columns = [
    {
      title: '文件', key: 'name',
      render: (_: unknown, record: { originalName: string; mimeType: string; url: string }) => (
        <Space>
          <FileOutlined style={{ fontSize: 20, color: '#6366f1' }} />
          <div>
            <Typography.Text style={{ display: 'block' }}>{record.originalName}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{record.mimeType}</Typography.Text>
          </div>
        </Space>
      ),
    },
    {
      title: '大小', dataIndex: 'size', key: 'size', width: 100,
      render: (v: number) => formatSize(v),
    },
    { title: '扩展名', dataIndex: 'ext', key: 'ext', width: 80, render: (v: string) => v && <Tag>{v}</Tag> },
    {
      title: '上传时间', dataIndex: 'createdAt', key: 'createdAt', width: 180,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
    {
      title: '操作', key: 'action', width: 160,
      render: (_: unknown, record: { url: string; id: string }) => (
        <Space>
          <Button type="link" icon={<DownloadOutlined />} href={record.url} target="_blank">下载</Button>
          <Popconfirm title="确认删除？" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="文件管理"
      extra={
        <Upload customRequest={handleUpload} showUploadList={false} accept="*">
          <Button type="primary" icon={<PlusOutlined />} loading={uploadMutation.isLoading}>上传文件</Button>
        </Upload>
      }
    >
      <Table
        dataSource={data?.items}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page, pageSize: 20, total: data?.total,
          onChange: setPage, showTotal: (t: number) => `共 ${t} 条`,
        }}
      />
    </Card>
  );
}
