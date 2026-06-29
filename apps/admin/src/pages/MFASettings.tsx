import { useState } from 'react';
import { Card, Button, message, Modal, Input, Alert, Space, QRCode } from 'antd';
import { SecurityScanOutlined, DisconnectOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { trpc } from '../trpc/client';

export default function MFASettingsPage() {
  const { data: status, refetch } = trpc.mfa.status.useQuery();
  const setupMutation = trpc.mfa.setup.useMutation();
  const verifyMutation = trpc.mfa.verify.useMutation({
    onSuccess: () => { message.success('MFA 已启用'); setSetupOpen(false); refetch(); },
    onError: (err) => message.error(err.message),
  });
  const disableMutation = trpc.mfa.disable.useMutation({
    onSuccess: () => { message.success('MFA 已禁用'); refetch(); },
    onError: (err) => message.error(err.message),
  });

  const [setupOpen, setSetupOpen] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [setupData, setSetupData] = useState<{ secret: string; otpauthUrl: string } | null>(null);

  const startSetup = async () => {
    try {
      const data = await setupMutation.mutateAsync();
      setSetupData(data);
      setSetupOpen(true);
    } catch (err: any) {
      message.error(err.message);
    }
  };

  const handleVerify = () => {
    if (!verifyCode) { message.warning('请输入验证码'); return; }
    verifyMutation.mutate({ token: verifyCode });
  };

  return (
    <Card title="双因素认证 (MFA)">
      {status?.enabled ? (
        <Space direction="vertical" size="large">
          <Alert type="success" showIcon icon={<CheckCircleOutlined />} message="MFA 已启用" description={`认证方式：${status.method === 'TOTP' ? '身份验证器 App (TOTP)' : status.method}`} />
          <Button danger icon={<DisconnectOutlined />} onClick={() => Modal.confirm({ title: '确定禁用 MFA？', onOk: () => disableMutation.mutateAsync().then(() => refetch()) })}>
            禁用 MFA
          </Button>
        </Space>
      ) : (
        <Space direction="vertical" size="large">
          <Alert type="warning" showIcon icon={<SecurityScanOutlined />} message="MFA 未启用" description="启用双因素认证可以显著提升账户安全性。" />
          <Button type="primary" icon={<SecurityScanOutlined />} onClick={startSetup} loading={setupMutation.isPending}>
            启用 MFA
          </Button>
        </Space>
      )}

      <Modal title="设置 MFA" open={setupOpen} onCancel={() => { setSetupOpen(false); setVerifyCode(''); }} footer={null} width={480}>
        {setupData && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Alert message="请使用 Google Authenticator 或 Authy 扫描以下二维码" type="info" showIcon />
            <div style={{ textAlign: 'center' }}><QRCode value={setupData.otpauthUrl} size={200} /></div>
            <p style={{ textAlign: 'center' }}>或手动输入密钥：<code style={{ userSelect: 'all', background: '#f5f5f5', padding: '2px 8px' }}>{setupData.secret}</code></p>
            <Input placeholder="输入 6 位验证码" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} maxLength={6} style={{ width: 200 }} />
            <Button type="primary" onClick={handleVerify} loading={verifyMutation.isPending}>验证并启用</Button>
          </Space>
        )}
      </Modal>
    </Card>
  );
}
