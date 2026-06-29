import { useState } from 'react';
import { Card, Form, Input, Button, message, Typography, Descriptions, Modal, Divider, Tag, Space, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons';
import { trpc } from '../trpc/client';
import { useAuth } from '../hooks/useAuth';
import type { UpdateProfileInput, ChangePasswordInput } from '@platform/shared';

const { Title, Text } = Typography;

export default function ProfilePage() {
  const { user, refetch } = useAuth();
  const utils = trpc.useUtils();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordForm] = Form.useForm();

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      message.success('个人资料已更新');
      refetch();
      utils.auth.me.invalidate();
    },
  });

  const changePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      message.success('密码已修改');
      passwordForm.resetFields();
      setPasswordModalOpen(false);
    },
  });

  const handleUpdateProfile = async (values: UpdateProfileInput) => {
    setProfileLoading(true);
    try {
      await updateProfileMutation.mutateAsync(values);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '更新失败');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (values: ChangePasswordInput & { confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.warning('两次输入的密码不一致');
      return;
    }
    setPasswordLoading(true);
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
    } catch (err) {
      message.error(err instanceof Error ? err.message : '修改失败');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div>
      {/* 页面标题 */}
      <Card style={{ borderRadius: 12, marginBottom: 24, border: 'none' }} styles={{ body: { padding: '24px 32px' } }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <Title level={4} style={{ margin: 0, marginBottom: 4, fontWeight: 600 }}>
              {user?.name || '用户'}
            </Title>
            <Space>
              <Text style={{ color: '#64748b' }}>{user?.email}</Text>
              {user?.roles?.map((r: { code: string; name: string }) => (
                <Tag key={r.code} color={r.code === 'system_admin' ? 'red' : 'blue'}>{r.name}</Tag>
              ))}
            </Space>
          </div>
        </div>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          {/* 个人资料编辑 */}
          <Card
            title={
              <Space>
                <UserOutlined style={{ color: '#6366f1' }} />
                <span>个人资料</span>
              </Space>
            }
            style={{ borderRadius: 8, height: '100%' }}
          >
            <Form
              layout="vertical"
              size="large"
              onFinish={handleUpdateProfile}
              initialValues={{ name: user?.name }}
            >
              <Form.Item
                name="name"
                label="姓名"
                rules={[
                  { required: true, message: '请输入姓名' },
                  { min: 2, message: '姓名至少 2 个字符' },
                  { max: 50, message: '姓名不超过 50 个字符' },
                ]}
              >
                <Input prefix={<UserOutlined style={{ color: '#94a3b8' }} />} placeholder="姓名" />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={profileLoading}
                  style={{ borderRadius: 8 }}
                >
                  保存修改
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          {/* 账户信息 */}
          <Card
            title={
              <Space>
                <SafetyOutlined style={{ color: '#6366f1' }} />
                <span>账户信息</span>
              </Space>
            }
            style={{ borderRadius: 8, height: '100%' }}
          >
            <Descriptions column={1} size="small" labelStyle={{ color: '#64748b', fontWeight: 500 }}>
              <Descriptions.Item label="邮箱">
                <Space>
                  <MailOutlined style={{ color: '#94a3b8' }} />
                  {user?.email}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="注册时间">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '-'}
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: '16px 0' }} />

            <Button
              icon={<LockOutlined />}
              onClick={() => setPasswordModalOpen(true)}
              style={{ borderRadius: 8, width: '100%' }}
            >
              修改密码
            </Button>
          </Card>
        </Col>
      </Row>

      {/* 修改密码弹窗 */}
      <Modal
        title={
          <Space>
            <LockOutlined style={{ color: '#6366f1' }} />
            <span>修改密码</span>
          </Space>
        }
        open={passwordModalOpen}
        onCancel={() => { setPasswordModalOpen(false); passwordForm.resetFields(); }}
        footer={null}
        centered
      >
        <Form
          form={passwordForm}
          layout="vertical"
          size="large"
          onFinish={handleChangePassword}
          style={{ paddingTop: 16 }}
        >
          <Form.Item
            name="currentPassword"
            label="当前密码"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="当前密码" />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少 6 位' },
            ]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="新密码" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="确认新密码" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={passwordLoading} block style={{ borderRadius: 8 }}>
              确认修改
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
