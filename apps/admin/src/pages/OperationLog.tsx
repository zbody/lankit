import { useState } from 'react';
import { Table, Card, Statistic, Row, Col, DatePicker, Input, Button } from 'antd';
import { trpc } from '../trpc/client';
import type { ColumnsType } from 'antd/es/table';

const { RangePicker } = DatePicker;

export default function OperationLogPage() {
  const [filters, setFilters] = useState({
    entity: '',
    userId: '',
    dateRange: null as [Date, Date] | null,
  });

  const { data, isLoading, refetch } = trpc.operationLogs.list.useQuery({
    page: 1,
    pageSize: 20,
    entity: filters.entity,
    userId: filters.userId,
    startDate: filters.dateRange?.[0]?.toISOString(),
    endDate: filters.dateRange?.[1]?.toISOString(),
  });

  const { data: stats } = trpc.operationLogs.getStats.useQuery();

  const columns: ColumnsType<any> = [
    { title: '用户', dataIndex: 'userName', key: 'userName', width: 100 },
    { title: '操作', dataIndex: 'action', key: 'action', width: 100 },
    { title: '实体', dataIndex: 'entity', key: 'entity', width: 100 },
    { title: '耗时 (ms)', dataIndex: 'duration', key: 'duration', width: 100 },
    { title: '状态', dataIndex: 'success', key: 'success', width: 80, render: (v: boolean) => v ? '成功' : '失败' },
    { title: '错误信息', dataIndex: 'errorMessage', key: 'errorMessage', ellipsis: true },
    { title: 'IP', dataIndex: 'ipAddress', key: 'ipAddress', width: 120 },
    { title: '时间', dataIndex: 'createdAt', key: 'createdAt', width: 180, render: (v: string) => new Date(v).toLocaleString('zh-CN') },
  ];

  return (
    <Card title="操作日志">
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic title="今日操作" value={stats?.todayCount || 0} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="本周操作" value={stats?.weekCount || 0} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="本月操作" value={stats?.monthCount || 0} />
          </Card>
        </Col>
      </Row>

      {/* 筛选条件 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Input
            placeholder="实体类型"
            value={filters.entity}
            onChange={(e) => setFilters((prev) => ({ ...prev, entity: e.target.value }))}
          />
        </Col>
        <Col span={6}>
          <RangePicker
            onChange={(dates) => setFilters((prev) => ({ ...prev, dateRange: dates as [Date, Date] | null }))}
          />
        </Col>
        <Col span={12}>
          <Button type="primary" onClick={() => refetch()}>
            查询
          </Button>
        </Col>
      </Row>

      {/* 操作日志表格 */}
      <Table
        dataSource={data?.items}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 1200 }}
        pagination={{
          total: data?.total,
          pageSize: 20,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </Card>
  );
}
