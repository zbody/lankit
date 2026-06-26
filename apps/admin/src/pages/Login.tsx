import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { trpc } from '../trpc/client';
import type { LoginInput } from '@platform/shared';

const { Title, Text } = Typography;

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const loginMutation = trpc.auth.login.useMutation();

  const handleSubmit = async (values: LoginInput) => {
    setLoading(true);
    try {
      const result = await loginMutation.mutateAsync(values);
      localStorage.setItem('token', result.token);
      message.success('登录成功');
      navigate('/');
    } catch (err) {
      message.error(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* 背景装饰 */}
      <div style={styles.bgCircle1} />
      <div style={styles.bgCircle2} />

      <div className="login-card" style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrapper}>
          <div style={styles.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <Title level={2} style={styles.title}>
            Lankit Admin
          </Title>
          <Text style={styles.subtitle}>企业级后台管理系统</Text>
        </div>

        {/* 表单 */}
        <Form onFinish={handleSubmit} layout="vertical" size="large" style={styles.form}>
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '邮箱格式不正确' },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
              placeholder="邮箱"
              style={styles.input}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少 6 位' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
              placeholder="密码"
              style={styles.input}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={styles.submitButton}
            >
              登录
            </Button>
          </Form.Item>

          <div style={styles.footer}>
            <Text style={styles.footerText}>
              没有账号？<Link to="/register" style={styles.link}>立即注册</Link>
            </Text>
          </div>
        </Form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)',
    position: 'relative',
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
    top: -200,
    right: -150,
  },
  bgCircle2: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
    bottom: -150,
    left: -100,
  },
  card: {
    width: 420,
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: 16,
    padding: '40px 40px 32px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
    position: 'relative',
    zIndex: 1,
  },
  logoWrapper: {
    textAlign: 'center' as const,
    marginBottom: 32,
  },
  logoIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    margin: '0 auto 16px',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  form: {
    maxWidth: '100%',
  },
  input: {
    borderRadius: 8,
    padding: '8px 12px',
  },
  submitButton: {
    height: 44,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
  },
  footer: {
    textAlign: 'center' as const,
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  link: {
    color: '#6366f1',
    fontWeight: 500,
  },
};
