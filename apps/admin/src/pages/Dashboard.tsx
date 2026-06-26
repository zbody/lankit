import { Card, Row, Col, Table, Tag, Button, Typography, Space, Divider } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  SafetyOutlined,
  MenuOutlined,
  ApiOutlined,
  ClockCircleOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../trpc/client';

const { Text, Title } = Typography;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: userData } = trpc.auth.me.useQuery();
  const { data: userList } = trpc.user.list.useQuery({ page: 1, pageSize: 10 });
  const { data: orgData } = trpc.org.list.useQuery({ page: 1, pageSize: 1 });
  const { data: roleData } = trpc.role.list.useQuery({ page: 1, pageSize: 1 });
  const { data: menuData } = trpc.menu.list.useQuery({ page: 1, pageSize: 1 });
  const { data: notifUnread } = trpc.notification.unreadCount.useQuery();

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: { name: string; code: string }[]) =>
        roles?.map((r) => (
          <Tag key={r.code} color={r.code === 'admin' ? 'red' : 'blue'}>
            {r.name}
          </Tag>
        )),
    },
    { title: '注册时间', dataIndex: 'createdAt', key: 'createdAt' },
  ];

  const quickActions = [
    { label: '新建用户', icon: <UserOutlined />, path: '/users/new', color: '#6366f1' },
    { label: '新建组织', icon: <TeamOutlined />, path: '/orgs/new', color: '#10b981' },
    { label: '新建角色', icon: <SafetyOutlined />, path: '/roles/new', color: '#f59e0b' },
    { label: '新建菜单', icon: <MenuOutlined />, path: '/menus/new', color: '#3b82f6' },
  ];

  const statsCards = [
    { title: '用户总数', value: userList?.total ?? 0, icon: <UserOutlined />, color: '#6366f1', bg: '#eef2ff' },
    { title: '组织总数', value: orgData?.total ?? 0, icon: <TeamOutlined />, color: '#10b981', bg: '#ecfdf5' },
    { title: '角色总数', value: roleData?.total ?? 0, icon: <SafetyOutlined />, color: '#f59e0b', bg: '#fffbeb' },
    { title: '菜单总数', value: menuData?.total ?? 0, icon: <MenuOutlined />, color: '#3b82f6', bg: '#eff6ff' },
    { title: '未读通知', value: notifUnread?.count ?? 0, icon: <BellOutlined />, color: '#ef4444', bg: '#fef2f2' },
  ];

  return (
    <div>
      {/* 欢迎横幅 */}
      <Card
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          borderRadius: 12,
          marginBottom: 24,
          border: 'none',
        }}
        styles={{ body: { padding: '28px 32px' } }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={4} style={{ color: '#ffffff', margin: 0, fontWeight: 600 }}>
              欢迎回来，{userData?.name || '用户'}
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 6, display: 'block' }}>
              <ClockCircleOutlined style={{ marginRight: 6 }} />
              {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </Text>
          </Col>
          <Col>
            <Space size={12}>
              {userData?.roles?.map((r) => (
                <Tag key={r.code} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 4 }}>
                  {r.name}
                </Tag>
              ))}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        {statsCards.map((stat) => (
          <Col xs={24} sm={12} lg={6} key={stat.title}>
            <Card
              hoverable
              styles={{ body: { padding: 20 } }}
              style={{ borderRadius: 8, border: '1px solid #f1f5f9' }}
            >
              <Row justify="space-between" align="middle">
                <Col>
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>{stat.title}</Text>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                    {stat.value}
                  </div>
                </Col>
                <Col>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: stat.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      color: stat.color,
                    }}
                  >
                    {stat.icon}
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 快速操作 + 系统信息 */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <ApiOutlined style={{ color: '#6366f1' }} />
                <span>快捷操作</span>
              </Space>
            }
            styles={{ body: { padding: 16 } }}
            style={{ borderRadius: 8, height: '100%' }}
          >
            <Row gutter={[12, 12]}>
              {quickActions.map((action) => (
                <Col span={12} key={action.path}>
                  <Button
                    block
                    size="large"
                    icon={action.icon}
                    onClick={() => navigate(action.path)}
                    style={{
                      height: 64,
                      borderRadius: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      border: '1px solid #f1f5f9',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{action.label}</span>
                  </Button>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <TeamOutlined style={{ color: '#6366f1' }} />
                <span>最近用户</span>
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/users')} style={{ padding: 0 }}>
                查看全部
              </Button>
            }
            styles={{ body: { padding: 0 } }}
            style={{ borderRadius: 8, height: '100%' }}
          >
            <Table
              dataSource={userList?.items}
              columns={columns}
              rowKey="id"
              loading={!userList}
              pagination={false}
              size="middle"
              style={{ borderRadius: 8 }}
            />
          </Card>
        </Col>
      </Row>

      <Divider style={{ margin: '32px 0 0' }} />
      <div style={{ textAlign: 'center', padding: '16px 0 0', color: '#94a3b8', fontSize: 12 }}>
        Lankit Admin &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
}
