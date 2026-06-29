import { Table, Card, Statistic, Row, Col, Typography } from 'antd';
import { trpc } from '../trpc/client';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '../components/PageHeader';

const { Title } = Typography;

/** 格式化 ISO 时间戳 */
function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('zh-CN');
  } catch {
    return iso;
  }
}

export default function PerformanceMonitoringPage() {
  const { data: performanceData, isLoading: dataLoading } = trpc.performance.getData.useQuery(
    { limit: 100 },
    { refetchInterval: 30000 },
  );
  const { data: slowQueries, isLoading: slowLoading } = trpc.performance.getSlowQueries.useQuery(
    { thresholdMs: 1000 },
    { refetchInterval: 30000 },
  );

  // stats 从 getData 返回结果中取，避免重复请求
  const stats = performanceData?.stats;

  const performanceColumns: ColumnsType<any> = [
    { title: '方法', dataIndex: 'method', key: 'method', width: 80 },
    { title: '路径', dataIndex: 'path', key: 'path', ellipsis: true },
    { title: '状态码', dataIndex: 'status', key: 'status', width: 80 },
    {
      title: '耗时 (ms)',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      sorter: (a, b) => a.duration - b.duration,
      render: (v: number) => (
        <span style={{ color: v > 1000 ? '#ef4444' : v > 500 ? '#f59e0b' : undefined }}>
          {v}
        </span>
      ),
    },
    { title: '用户ID', dataIndex: 'userId', key: 'userId', width: 120 },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: formatTime,
    },
  ];

  const slowQueryColumns: ColumnsType<any> = [
    { title: '方法', dataIndex: 'method', key: 'method', width: 80 },
    { title: '路径', dataIndex: 'path', key: 'path', ellipsis: true },
    {
      title: '耗时 (ms)',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      sorter: (a, b) => a.duration - b.duration,
      render: (v: number) => <span style={{ color: '#ef4444', fontWeight: 600 }}>{v}</span>,
    },
    { title: '状态码', dataIndex: 'status', key: 'status', width: 80 },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: formatTime,
    },
  ];

  return (
    <div>
      <PageHeader title="性能监控" />
      <Card>
        {/* 统计卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="总请求数" value={stats?.totalRequests || 0} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="平均耗时" value={stats?.avgDuration || 0} suffix="ms" />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="最小耗时" value={stats?.minDuration ?? '-'} suffix={stats?.minDuration != null ? 'ms' : undefined} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="最大耗时"
                value={stats?.maxDuration || 0}
                suffix="ms"
                valueStyle={stats?.maxDuration && stats.maxDuration > 1000 ? { color: '#ef4444' } : undefined}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="慢查询数"
                value={stats?.slowRequests || 0}
                valueStyle={stats?.slowRequests && stats.slowRequests > 0 ? { color: '#ef4444' } : undefined}
              />
            </Card>
          </Col>
        </Row>

        {/* 性能数据表格 */}
        <Title level={5}>最近请求</Title>
        <Table
          dataSource={performanceData?.data}
          columns={performanceColumns}
          rowKey={(_, index) => String(index)}
          loading={dataLoading}
          scroll={{ x: 900 }}
          pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
        />

        {/* 慢查询表格 */}
        <Title level={5} style={{ marginTop: 24 }}>
          慢查询 (&gt;1000ms)
          {slowQueries?.count != null && (
            <span style={{ fontSize: 13, fontWeight: 400, color: '#94a3b8', marginLeft: 8 }}>
              （{slowQueries.count} 条）
            </span>
          )}
        </Title>
        <Table
          dataSource={slowQueries?.queries}
          columns={slowQueryColumns}
          rowKey={(_, index) => String(index)}
          loading={slowLoading}
          scroll={{ x: 900 }}
          pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>
    </div>
  );
}
