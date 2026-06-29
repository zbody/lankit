import { Table, Card, Statistic, Row, Col, Typography } from 'antd';
import { trpc } from '../trpc/client';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

export default function PerformanceMonitoringPage() {
  const { data: stats } = trpc.performance.getStats.useQuery();
  const { data: performanceData, isLoading: dataLoading } = trpc.performance.getData.useQuery({ limit: 100 });
  const { data: slowQueries, isLoading: slowLoading } = trpc.performance.getSlowQueries.useQuery({ thresholdMs: 1000 });

  const performanceColumns: ColumnsType<any> = [
    { title: '方法', dataIndex: 'method', key: 'method', width: 80 },
    { title: '路径', dataIndex: 'path', key: 'path', ellipsis: true },
    { title: '状态码', dataIndex: 'status', key: 'status', width: 80 },
    { title: '耗时 (ms)', dataIndex: 'duration', key: 'duration', width: 100, sorter: (a, b) => a.duration - b.duration },
    { title: '用户ID', dataIndex: 'userId', key: 'userId', width: 120 },
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 180 },
  ];

  const slowQueryColumns: ColumnsType<any> = [
    { title: '路径', dataIndex: 'path', key: 'path', ellipsis: true },
    { title: '耗时 (ms)', dataIndex: 'duration', key: 'duration', width: 100, sorter: (a, b) => a.duration - b.duration },
    { title: '状态码', dataIndex: 'status', key: 'status', width: 80 },
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 180 },
  ];

  return (
    <Card title="性能监控">
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总请求数" value={stats?.totalRequests || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="平均耗时" value={stats?.avgDuration || 0} suffix="ms" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="最大耗时" value={stats?.maxDuration || 0} suffix="ms" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="慢查询数" value={stats?.slowRequests || 0} />
          </Card>
        </Col>
      </Row>

      {/* 性能数据表格 */}
      <Title level={5}>最近请求</Title>
      <Table
        dataSource={performanceData?.data}
        columns={performanceColumns}
        rowKey={(record) => `${record.timestamp}-${record.path}`}
        loading={dataLoading}
        scroll={{ x: 1200 }}
        pagination={{ pageSize: 20 }}
      />

      {/* 慢查询表格 */}
      <Title level={5} style={{ marginTop: 24 }}>慢查询 (&gt;{(slowQueries?.queries?.[0]?.duration || 1000)}ms)</Title>
      <Table
        dataSource={slowQueries?.queries}
        columns={slowQueryColumns}
        rowKey={(record) => `${record.timestamp}-${record.path}`}
        loading={slowLoading}
        scroll={{ x: 1200 }}
        pagination={{ pageSize: 20 }}
      />
    </Card>
  );
}
