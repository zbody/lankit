import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { trpc } from '../trpc/client';
import type { RegisterInput } from '@platform/shared';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const registerMutation = trpc.auth.register.useMutation();

  const handleSubmit = async (values: RegisterInput) => {
    setLoading(true);
    try {
      const result = await registerMutation.mutateAsync(values);
      localStorage.setItem('token', result.token);
      message.success('注册成功');
      navigate('/');
    } catch (err) {
      message.error(err instanceof Error ? err.message : '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
      }}
    >
      <Card style={{ width: 400 }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>
          Lankit Admin
        </Title>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 32 }}>
          创建新账号
        </Text>
        <Form onFinish={handleSubmit} layout="vertical" size="large">
          <Form.Item name="name" rules={[{ required: true, message: '请输入姓名' }, { min: 2, message: '姓名至少 2 个字符' }]}>
            <Input prefix={<UserOutlined />} placeholder="姓名" />
          </Form.Item>
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '邮箱格式不正确' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="邮箱" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少 6 位' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              注册
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center' }}>
            已有账号？<Link to="/login">立即登录</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
