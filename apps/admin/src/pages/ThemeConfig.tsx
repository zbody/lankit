import { useState, useEffect } from 'react';
import { Card, Button, Space, ColorPicker, Tag, message, Switch, Divider } from 'antd';
import { useTheme } from '../contexts/ThemeContext';
import { trpc } from '../trpc/client';

const presetThemes = [
  { label: '默认蓝', primary: '#1677ff', color: 'blue' },
  { label: '极客绿', primary: '#00b96b', color: 'green' },
  { label: '暮光紫', primary: '#722ed1', color: 'purple' },
  { label: '烈焰红', primary: '#f5222d', color: 'red' },
  { label: '暗夜橙', primary: '#fa8c16', color: 'orange' },
  { label: '极光青', primary: '#13c2c2', color: 'cyan' },
];

export default function ThemeConfigPage() {
  const { data: config, refetch } = trpc.theme.getConfig.useQuery();
  const saveMutation = trpc.theme.saveConfig.useMutation({
    onSuccess: () => { message.success('主题已保存'); refetch(); },
  });
  const [primary, setPrimary] = useState('#1677ff');
  const { isDark, toggle } = useTheme();

  useEffect(() => {
    if (config?.primary) {
      setPrimary(config.primary);
      applyThemeStyle(config.primary);
    }
  }, [config]);

  const applyThemeStyle = (color: string) => {
    document.documentElement.style.setProperty('--primary-color', color);
  };

  const applyTheme = (color: string) => {
    setPrimary(color);
    applyThemeStyle(color);
    saveMutation.mutate({ primary: color });
  };

  return (
    <Card title="主题配置">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 暗黑模式开关 */}
        <div>
          <h4>显示模式</h4>
          <Space>
            <span style={{ color: isDark ? '#94a3b8' : undefined }}>☀️ 浅色</span>
            <Switch
              checked={isDark}
              onChange={toggle}
              checkedChildren="🌙"
              unCheckedChildren="☀️"
            />
            <span style={{ color: isDark ? undefined : '#94a3b8' }}>🌙 深色</span>
          </Space>
        </div>

        <Divider />

        <div>
          <h4>预设主题</h4>
          <Space wrap>
            {presetThemes.map((t) => (
              <Card key={t.color} size="small" hoverable onClick={() => applyTheme(t.primary)}
                style={{ width: 120, textAlign: 'center', border: primary === t.primary ? `2px solid ${t.primary}` : undefined }}
              >
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: t.primary, margin: '0 auto 8px' }} />
                <Tag color={t.color}>{t.label}</Tag>
              </Card>
            ))}
          </Space>
        </div>

        <div>
          <h4>自定义颜色</h4>
          <Space>
            <ColorPicker value={primary} onChange={(c) => setPrimary(c.toHexString())} />
            <Button type="primary" onClick={() => applyTheme(primary)} loading={saveMutation.isPending}>应用主题</Button>
          </Space>
        </div>

        <p style={{ color: '#94a3b8', fontSize: 12 }}>提示：主题颜色保存在服务端，所有用户共享；显示模式保存在本地浏览器。</p>
      </Space>
    </Card>
  );
}
