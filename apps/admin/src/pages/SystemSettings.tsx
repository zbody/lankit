import { useEffect, useState } from 'react';
import { Card, Form, Input, Button, message, Typography, Space, Divider } from 'antd';
import { trpc } from '../trpc/client';

const { Title } = Typography;

const settingGroups = [
  {
    title: '密码策略',
    keys: ['password.minLength', 'password.requireUppercase', 'password.requireLowercase', 'password.requireNumbers', 'password.requireSpecialChars'],
  },
  {
    title: '安全设置',
    keys: ['login.maxFailedAttempts', 'login.lockoutDurationMinutes', 'session.timeoutMinutes'],
  },
  {
    title: '审计日志',
    keys: ['audit.enabled', 'audit.level'],
  },
];

export default function SystemSettingsPage() {
  const { data: settings, isLoading, refetch } = trpc.systemSettings.getAll.useQuery();
  const updateMutation = trpc.systemSettings.update.useMutation({
    onSuccess: () => {
      message.success('保存成功');
      refetch();
    },
    onError: (err) => message.error(err.message),
  });

  const [formValues, setFormValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) {
      const vals: Record<string, string> = {};
      for (const s of settings) {
        vals[s.key] = s.value;
      }
      setFormValues(vals);
    }
  }, [settings]);

  const handleSave = async (key: string, value: string) => {
    updateMutation.mutate({ key, value });
  };

  const handleReset = () => {
    // TODO: 调用 resetToDefaults
    message.info('重置功能待实现');
  };

  if (isLoading) return <div style={{ padding: 48, textAlign: 'center' }}>加载中...</div>;

  return (
    <Card title="系统设置">
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {settingGroups.map((group) => (
          <div key={group.title}>
            <Title level={5}>{group.title}</Title>
            <Divider style={{ margin: '8px 0' }} />
            {group.keys.map((key) => {
              const setting = settings?.find((s) => s.key === key);
              if (!setting) return null;

              const isBoolean = setting.value === 'true' || setting.value === 'false';
              const isLevelSelector = key === 'audit.level';

              return (
                <div key={key} style={{ marginBottom: 16 }}>
                  <Form.Item label={setting.description || key} style={{ marginBottom: 8 }}>
                    {isLevelSelector ? (
                      <select
                        value={formValues[key] || 'info'}
                        onChange={(e) => handleSave(key, e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #d9d9d9', minWidth: 120 }}
                      >
                        <option value="info">全部记录（CREATE/UPDATE/DELETE）</option>
                        <option value="warn">仅记录修改和删除（UPDATE/DELETE）</option>
                        <option value="error">仅记录删除（DELETE）</option>
                      </select>
                    ) : isBoolean ? (
                      <select
                        value={formValues[key] || ''}
                        onChange={(e) => handleSave(key, e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #d9d9d9', minWidth: 120 }}
                      >
                        <option value="true">是</option>
                        <option value="false">否</option>
                      </select>
                    ) : (
                      <Input
                        value={formValues[key] || ''}
                        onChange={(e) => setFormValues((prev) => ({ ...prev, [key]: e.target.value }))}
                        onBlur={() => handleSave(key, formValues[key] || '')}
                        style={{ maxWidth: 200 }}
                      />
                    )}
                  </Form.Item>
                </div>
              );
            })}
          </div>
        ))}
        <div style={{ textAlign: 'right' }}>
          <Button onClick={handleReset}>恢复默认</Button>
        </div>
      </Space>
    </Card>
  );
}
