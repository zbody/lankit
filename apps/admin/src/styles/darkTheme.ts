import type { ThemeConfig } from 'antd';

/**
 * 暗黑模式下覆盖 light theme 的 token 和组件样式。
 * algorithm: theme.darkAlgorithm 在 main.tsx 中通过 ThemeContext 动态切换。
 */
export const darkThemeConfig: ThemeConfig = {
  token: {
    colorBgContainer: '#1e293b',
    colorBgLayout: '#0f172a',
    colorBgElevated: '#1e293b',
    colorBorder: '#334155',
    colorBorderSecondary: '#1e293b',
    colorText: '#f1f5f9',
    colorTextSecondary: '#94a3b8',
    colorTextTertiary: '#64748b',
    colorPrimary: '#818cf8',
    colorPrimaryHover: '#6366f1',
    colorPrimaryActive: '#4f46e5',
    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
    boxShadowSecondary: '0 4px 12px rgba(0,0,0,0.4)',
  },
  components: {
    Layout: {
      headerBg: '#1e293b',
      siderBg: '#0f172a',
      triggerBg: '#0f172a',
      bodyBg: '#0f172a',
    },
    Menu: {
      itemBg: 'transparent',
      itemColor: '#94a3b8',
      itemHoverBg: '#334155',
      itemHoverColor: '#f1f5f9',
      itemSelectedBg: '#334155',
      itemSelectedColor: '#818cf8',
      itemActiveBg: '#334155',
      subMenuItemBg: 'transparent',
      popupBg: '#1e293b',
    },
    Card: {
      headerBg: '#1e293b',
      actionsBg: '#1e293b',
    },
    Table: {
      headerBg: '#1e293b',
      headerColor: '#f1f5f9',
      headerSortActiveBg: '#334155',
      headerSortHoverBg: '#334155',
      rowHoverBg: '#1e293b',
      borderColor: '#334155',
      footerBg: '#1e293b',
    },
    Button: {
      colorBgContainer: '#1e293b',
      colorBorder: '#334155',
    },
    Input: {
      colorBgContainer: '#1e293b',
    },
    Select: {
      colorBgContainer: '#1e293b',
      optionSelectedBg: '#334155',
    },
    Modal: {
      headerBg: '#1e293b',
      contentBg: '#1e293b',
      footerBg: '#1e293b',
    },
    Tabs: {
      cardBg: '#1e293b',
      itemColor: '#94a3b8',
      itemSelectedColor: '#818cf8',
    },
    Notification: {
      width: 400,
    },
    Form: {
      labelColor: '#94a3b8',
    },
    Tag: {
      borderRadius: 4,
      fontSizeSM: 12,
      lineHeightSM: 1.5,
    },
  },
};
