import { Table, Button, Card, Space, Tag, Typography, Modal, DatePicker, Input, Select } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { trpc } from '../trpc/client';
import type { ColumnsType } from 'antd/es/table';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const actionColors: Record<string, string> = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
};

export default function AuditLogListPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    action: '' as string,
    entity: '' as string,
    dateRange: null as any,
    search: '' as string,
  });

  const queryParams = {
    page,
    pageSize: 20,
    ...(filters.action && { action: filters.action }),
    ...(filters.entity && { entity: filters.entity }),
    ...(filters.dateRange?.[0] && { startDate: filters.dateRange[0].toISOString() }),
    ...(filters.dateRange?.[1] && { endDate: filters.dateRange[1].toISOString() }),
    ...(filters.search && { search: filters.search }),
  };
  const { data, isLoading, refetch } = trpc.auditLogs.list.useQuery(queryParams);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [currentLog, setCurrentLog] = useState<any>(null);

  const columns: ColumnsType<any> = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
    { title: '用户', dataIndex: 'userName', key: 'userName', width: 120, render: (v: string) => v || '-' },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (v: string) => <Tag color={actionColors[v] || 'default'}>{v}</Tag>,
    },
    { title: '实体', dataIndex: 'entity', key: 'entity', width: 100 },
    { title: 'IP地址', dataIndex: 'ipAddress', key: 'ipAddress', width: 150 },
    {
      title: '详情',
      key: 'detail',
      width: 80,
      render: (_: any, record: any) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => { setCurrentLog(record); setIsDetailVisible(true); }}
        />
      ),
    },
  ];

  return (
    <Card
      title="审计日志"
      extra={
        <Button type="primary" icon={<SearchOutlined />} onClick={() => { setPage(1); refetch(); }}>
          刷新
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }} size="small">
        <Space>
          <Select
            placeholder="操作类型"
            allowClear
            style={{ width: 150 }}
            options={['CREATE', 'UPDATE', 'DELETE'].map(a => ({ label: a, value: a }))}
            value={filters.action || undefined}
            onChange={(v: string) => setFilters(f => ({ ...f, action: v }))}
          />
          <Select
            placeholder="实体类型"
            allowClear
            style={{ width: 150 }}
            options={['USER', 'ORG', 'ROLE', 'MENU'].map(e => ({ label: e, value: e }))}
            value={filters.entity || undefined}
            onChange={(v: string) => setFilters(f => ({ ...f, entity: v }))}
          />
          <RangePicker             onChange={(dates: any) => setFilters(f => ({ ...f, dateRange: dates }))} />
          <Input
            placeholder="搜索用户..."
            style={{ width: 150 }}
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </Space>
      </Space>

      <Table
        dataSource={data?.items}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.total,
          onChange: setPage,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />

      <Modal
        title="审计日志详情"
        open={isDetailVisible}
        onCancel={() => setIsDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentLog && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <Text strong>操作:</Text> <Tag color={actionColors[currentLog.action] || 'default'}>{currentLog.action}</Tag>
            </div>
            <div>
              <Text strong>用户:</Text> {currentLog.userName || '-'}
            </div>
            <div>
              <Text strong>实体:</Text> {currentLog.entity}
            </div>
            <div>
              <Text strong>时间:</Text> {new Date(currentLog.createdAt).toLocaleString('zh-CN')}
            </div>
            <div>
              <Text strong>IP:</Text> {currentLog.ipAddress || '-'}
            </div>
            <div>
              <Text strong>User-Agent:</Text> <Text type="secondary">{currentLog.userAgent || '-'}</Text>
            </div>
            {(currentLog.oldValues || currentLog.newValues) && (
              <div>
                <Text strong>变更内容:</Text>
                <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                  {currentLog.oldValues && (
                    <div style={{ flex: 1 }}>
                      <Text type="secondary">变更前:</Text>
                      <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, fontSize: 12, maxHeight: 200, overflow: 'auto' }}>
                        {JSON.stringify(currentLog.oldValues, null, 2)}
                      </pre>
                    </div>
                  )}
                  {currentLog.newValues && (
                    <div style={{ flex: 1 }}>
                      <Text type="secondary">变更后:</Text>
                      <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, fontSize: 12, maxHeight: 200, overflow: 'auto' }}>
                        {JSON.stringify(currentLog.newValues, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Space>
        )}
      </Modal>
    </Card>
  );
}
