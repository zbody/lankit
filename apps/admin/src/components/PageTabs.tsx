import { Tabs } from 'antd';
import type { TabsProps } from 'antd';

export interface TabInfo {
  key: string;
  label: string;
  closable: boolean;
}

interface PageTabsProps {
  tabs: TabInfo[];
  activeKey: string;
  onChange: (key: string) => void;
  onClose: (key: string) => void;
}

/**
 * PageTabs - 多标签页栏
 *
 * 基于 Ant Design Tabs `editable-card` 类型，用于 AdminLayout 顶部。
 * 每个标签对应一个打开的路由页面，支持点击切换和关闭。
 */
export default function PageTabs({ tabs, activeKey, onChange, onClose }: PageTabsProps) {
  const handleEdit: TabsProps['onEdit'] = (targetKey, action) => {
    if (action === 'remove' && targetKey) {
      onClose(targetKey as string);
    }
  };

  return (
    <Tabs
      type="editable-card"
      hideAdd
      size="small"
      items={tabs.map((tab) => ({
        key: tab.key,
        label: tab.label,
        closable: tab.closable,
      }))}
      activeKey={activeKey}
      onChange={onChange}
      onEdit={handleEdit}
      style={{
        marginBottom: 0,
        background: '#fff',
        padding: '0 8px 0 0',
      }}
    />
  );
}
