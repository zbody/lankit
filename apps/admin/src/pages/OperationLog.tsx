import { useState } from 'react';
import { Table, Card, Statistic, Row, Col, DatePicker, Input, Tooltip } from 'antd';
import { trpc } from '../trpc/client';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '../components/PageHeader';
import { SearchOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;

export default function OperationLogPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    entity: '',
    userId: '',
    dateRange: null as [Date, Date] | null,
  });

  const { data, isLoading } = trpc.operationLogs.list.useQuery(
    {
      page,
      pageSize: 20,
      entity: filters.entity || undefined,
      userId: filters.userId || undefined,
      startDate: filters.dateRange?.[0]?.toISOString(),
      endDate: filters.dateRange?.[1]?.toISOString(),
    },
    { refetchInterval: 30000 },
  );

  const { data: stats } = trpc.operationLogs.getStats.useQuery(undefined, {
    refetchInterval: 60000,
  });

  const columns: ColumnsType<any> = [
    { title: '用户', dataIndex: 'userName', key: 'userName', width: 100 },
    { title: '操作', dataIndex: 'action', key: 'action', width: 100 },
    { title: '实体', dataIndex: 'entity', key: 'entity', width: 100 },
    { title: '耗时 (ms)', dataIndex: 'duration', key: 'duration', width: 100 },
    {
      title: '状态',
      dataIndex: 'success',
      key: 'success',
      width: 80,
      render: (v: boolean) => (v ? '成功' : '失败'),
    },
    {
      title: '错误信息',
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      ellipsis: true,
      render: (v: string) =>
        v ? (
          <Tooltip title={<div style={{ maxWidth: 400, wordBreak: 'break-all' }}>{v}</div>} color="#1e293b">
            <span style={{ cursor: 'pointer', color: '#ef4444' }}>
              {v.length > 30 ? v.slice(0, 30) + '...' : v}
            </span>
          </Tooltip>
        ) : (
          '-'
        ),
    },
    { title: 'IP', dataIndex: 'ipAddress', key: 'ipAddress', width: 120 },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
  ];

  return (
    <div>
      <PageHeader title="操作日志" />
      <Card>
        {/* 统计卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={8}>
            <Card size="small">
              <Statistic title="今日操作" value={stats?.todayCount || 0} />
            </Card>
          </Col>
          <Col xs={12} sm={8}>
            <Card size="small">
              <Statistic title="本周操作" value={stats?.weekCount || 0} />
            </Card>
          </Col>
          <Col xs={12} sm={8}>
            <Card size="small">
              <Statistic title="本月操作" value={stats?.monthCount || 0} />
            </Card>
          </Col>
        </Row>

        {/* 筛选条件（tRPC 输入变化时自动重新查询，无需查询按钮） */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="实体类型（如 User/Org）"
              prefix={<SearchOutlined />}
              value={filters.entity}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, entity: e.target.value }));
                setPage(1);
              }}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="用户 ID"
              prefix={<SearchOutlined />}
              value={filters.userId}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, userId: e.target.value }));
                setPage(1);
              }}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              onChange={(dates) => {
                setFilters((prev) => ({ ...prev, dateRange: dates as [Date, Date] | null }));
                setPage(1);
              }}
            />
          </Col>
        </Row>

        {/* 操作日志表格 */}
        <Table
          dataSource={data?.items}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1100 }}
          pagination={{
            current: page,
            total: data?.total,
            pageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p) => setPage(p),
          }}
        />
      </Card>
    </div>
  );
}
