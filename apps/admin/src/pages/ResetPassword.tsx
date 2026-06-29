import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Form, Input, Button, message, Typography, Result } from 'antd';
import { LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { trpc } from '../trpc/client';
const { Title, Text } = Typography;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const resetPasswordMutation = trpc.auth.resetPassword.useMutation();

  const handleSubmit = async (values: { password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      message.warning('两次输入的密码不一致');
      return;
    }
    if (!token) {
      message.error('重置链接无效');
      return;
    }
    setLoading(true);
    try {
      await resetPasswordMutation.mutateAsync({ token, password: values.password });
      setDone(true);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '重置失败');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={styles.container}>
        <div style={styles.bgCircle1} />
        <div style={styles.bgCircle2} />
        <div className="login-card" style={styles.card}>
          <Result
            status="error"
            title="链接无效"
            subTitle="缺少重置令牌，请重新发送密码重置邮件。"
            extra={[
              <Button key="back" type="primary" onClick={() => navigate('/forgot-password')}>
                重新发送
              </Button>,
            ]}
          />
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div style={styles.container}>
        <div style={styles.bgCircle1} />
        <div style={styles.bgCircle2} />
        <div className="login-card" style={styles.card}>
          <Result
            status="success"
            title="密码已重置"
            subTitle="您的密码已成功修改，请使用新密码登录。"
            extra={[
              <Button key="login" type="primary" onClick={() => navigate('/login')}>
                立即登录
              </Button>,
            ]}
          />
        </div>
      </div>
    );
  }

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
          <Text style={styles.subtitle}>设置新密码</Text>
        </div>

        {/* 表单 */}
        <Form onFinish={handleSubmit} layout="vertical" size="large" style={styles.form}>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少 6 位' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
              placeholder="新密码"
              style={styles.input}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
              placeholder="确认新密码"
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
              重置密码
            </Button>
          </Form.Item>

          <div style={styles.footer}>
            <Link to="/login" style={styles.link}>
              <ArrowLeftOutlined style={{ marginRight: 4 }} />
              返回登录
            </Link>
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
  link: {
    color: '#6366f1',
    fontWeight: 500,
  },
};
