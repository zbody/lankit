import { useNavigate, useLocation, useOutlet } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Space, Spin, Badge, Breadcrumb } from 'antd';
import {
  DashboardOutlined,
  MenuOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
} from '@ant-design/icons';
import * as AntdIcons from '@ant-design/icons';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { trpc } from '../trpc/client';
import type { MenuProps } from 'antd';
import AnnouncementModal from '../components/AnnouncementModal';
import PageTabs from '../components/PageTabs';
import type { TabInfo } from '../components/PageTabs';

/** 图标名 → React 组件映射（动态从 @ant-design/icons 获取） */
const ICON_MAP: Record<string, React.ComponentType> = AntdIcons as any;

/** 从图标名字符串获取 React 组件 */
function getIcon(iconName?: string): React.ReactNode {
  if (!iconName) return <MenuOutlined />;
  const IconComp = ICON_MAP[iconName];
  return IconComp ? <IconComp /> : <MenuOutlined />;
}

/** 扁平菜单列表 → 侧栏树形结构 */
function buildSidebarMenus(
  menus: { id: string; name: string; path: string | null; icon: string | null; type: string; sort: number; parentId: string | null; isVisible: boolean }[],
): MenuProps['items'] {
  // 过滤：只保留非 BUTTON、isVisible=true 的菜单
  const visible = menus.filter((m) => m.type !== 'BUTTON' && m.isVisible !== false);

  // 分离目录和叶子菜单
  const dirs = new Map<string, { id: string; name: string; icon: string | null; path: string | null }>();
  const leaves: typeof visible = [];
  for (const m of visible) {
    if (m.type === 'DIRECTORY') {
      dirs.set(m.id, m);
    } else {
      leaves.push(m);
    }
  }

  // 按 parentId 分组子菜单
  const childrenByParent = new Map<string, typeof leaves>();
  for (const leaf of leaves) {
    if (leaf.parentId) {
      if (!childrenByParent.has(leaf.parentId)) {
        childrenByParent.set(leaf.parentId, []);
      }
      childrenByParent.get(leaf.parentId)!.push(leaf);
    }
  }

  const result: MenuProps['items'] = [];

  // 仪表盘（由 myMenus 返回，受 isVisible 控制）
  const dashboard = leaves.find((m) => m.path === '/');
  if (dashboard) {
    result.push({
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    });
  }

  // 有目录的菜单 → 构建树形结构
  for (const [dirId, dir] of dirs) {
    const kids = childrenByParent.get(dirId);
    if (!kids || kids.length === 0) continue;

    result.push({
      key: dir.path || dirId,
      icon: getIcon(dir.icon ?? undefined),
      label: dir.name,
      children: kids.map((m) => ({
        key: m.path!,
        icon: getIcon(m.icon ?? undefined),
        label: m.name,
      })),
    });
  }

  // 没有父目录的独立菜单（仪表盘已在上面处理，跳过）
  for (const m of leaves) {
    if (m.path === '/') continue; // 仪表盘已在上面处理
    // 如果有 parentId 但对应的目录不在 dirs 中，视为孤立菜单，按独立菜单渲染
    const parentExists = m.parentId && dirs.has(m.parentId);
    if (parentExists) continue; // 已由目录渲染
    result.push({
      key: m.path!,
      icon: getIcon(m.icon ?? undefined),
      label: m.name,
    });
  }

  return result;
}

const { Header, Sider, Content } = Layout;

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);

  // ---- 多标签页状态 ----
  const [tabs, setTabs] = useState<TabInfo[]>([
    { key: '/', label: '仪表盘', closable: false },
  ]);
  const [activeTabKey, setActiveTabKey] = useState('/');
  const isTabSwitchRef = useRef(false);
  const prevPathForTabEffect = useRef(location.pathname);

  // WebSocket 连接管理
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const wsUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:3003/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WebSocket] 连接成功');
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'notification') {
          // 收到新通知，刷新未读计数
          trpc.notification.unreadCount.useQuery();
        }
      } catch (err) {
        console.error('[WebSocket] 消息解析失败:', err);
      }
    };

    ws.onclose = () => {
      console.log('[WebSocket] 连接关闭');
      setWsConnected(false);
      // 3秒后重连
      setTimeout(() => {
        if (localStorage.getItem('token')) {
          console.log('[WebSocket] 尝试重连...');
        }
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('[WebSocket] 错误:', error);
    };

    return () => {
      ws.close();
    };
  }, []);

  // 获取当前用户的菜单
  const { data: myMenusData, isLoading: menusLoading } = trpc.menu.myMenus.useQuery();
  // 获取未读通知数
  const { data: unreadData } = trpc.notification.unreadCount.useQuery();
  // 获取最新5条通知（用于下拉面板）
  const { data: recentNotifs } = trpc.notification.list.useQuery({ page: 1, pageSize: 5 });
  // 获取已发布的公告
  const { data: announcements } = trpc.announcement.published.useQuery();
  // 未读公告（排除已读的）
  const unreadAnnouncements = useMemo(() => {
    if (!announcements) return [];
    return announcements.filter((a: { id: string }) => !readIds.has(a.id));
  }, [announcements, readIds]);

  // 有未读公告时自动弹窗
  useEffect(() => {
    if (unreadAnnouncements.length > 0) {
      setAnnouncementOpen(true);
    }
  }, [unreadAnnouncements.length]);

  // ---- 多标签页缓存 ----
  const outlet = useOutlet();
  const pageCacheRef = useRef<Map<string, React.ReactNode>>(new Map());
  const prevPathRef = useRef(location.pathname);
  const prevOutletRef = useRef<React.ReactNode>(null);

  // 渲染阶段：路径变化时捕获上一页内容到缓存（必须在 outlet 被替换前执行）
  if (prevPathRef.current !== location.pathname) {
    if (prevOutletRef.current) {
      pageCacheRef.current.set(prevPathRef.current, prevOutletRef.current);
    }
  }
  prevPathRef.current = location.pathname;
  prevOutletRef.current = outlet;
  // 始终刷新当前页缓存
  if (outlet) {
    pageCacheRef.current.set(location.pathname, outlet);
  }

  const sidebarItems = useMemo(() => {
    if (!myMenusData) return [];
    return buildSidebarMenus(myMenusData.menus);
  }, [myMenusData]);

  const childPaths = useMemo(() => {
    const paths = new Set<string>();
    for (const item of sidebarItems ?? []) {
      const sub = item as typeof item & { children?: { key: string }[] };
      if (sub?.children) {
        for (const c of sub.children) {
          if (c && 'key' in c) paths.add(String((c as any).key));
        }
      }
    }
    return paths;
  }, [sidebarItems]);

  const defaultOpenKeys = useMemo(() => {
    const keys: string[] = [];
    for (const item of sidebarItems ?? []) {
      const sub = item as typeof item & { children?: { key: string }[] };
      if (sub?.children?.some((c) => c && 'key' in c && c.key === location.pathname)) {
        keys.push(String(sub.key));
      }
    }
    return keys;
  }, [sidebarItems, location.pathname]);

  /** 路由 → 中文名称映射（用于面包屑） */
  const routeLabelMap: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {
      '/': '仪表盘',
      '/users': '用户管理',
      '/users/new': '新建用户',
      '/orgs': '组织管理',
      '/orgs/new': '新建组织',
      '/roles': '角色管理',
      '/roles/new': '新建角色',
      '/menus': '菜单管理',
      '/menus/new': '新建菜单',
      '/audit-logs': '审计日志',
      '/notifications': '通知中心',
      '/settings': '系统设置',
      '/dict': '数据字典',
      '/files': '文件管理',
      '/operation-logs': '操作日志',
      '/performance': '性能监控',
      '/announcements': '公告管理',
      '/api-keys': 'API 密钥',
      '/email': '邮件配置',
      '/tasks': '定时任务',
      '/mfa': 'MFA 设置',
      '/approvals': '审批管理',
      '/code-generator': '代码生成',
      '/theme': '主题配置',
      '/categories': '分类管理',
      '/recycle-bin': '回收站',
      '/articles': '文章管理',
      '/contacts': '留言管理',
      '/oauth': 'OAuth 配置',
      '/profile': '个人中心',
    };
    // 用菜单数据覆盖（用户自定义名称优先）
    if (myMenusData?.menus) {
      for (const m of myMenusData.menus) {
        if (m.path && m.type !== 'BUTTON') {
          map[m.path] = m.name;
        }
      }
    }
    return map;
  }, [myMenusData]);

  /** 面包屑导航项 */
  const breadcrumbItems = useMemo(() => {
    const items: { title: string }[] = [{ title: routeLabelMap['/'] || '首页' }];
    const path = location.pathname;

    // 编辑页特殊处理: /users/some-id/edit → /users + "编辑用户"
    const editMatch = path.match(/^\/(\w+)\/[^/]+\/edit$/);
    if (editMatch) {
      const parentPath = `/${editMatch[1]}`;
      const parentName = routeLabelMap[parentPath] || parentPath;
      items.push({ title: parentName });
      items.push({ title: '编辑' });
      return items;
    }

    // 新建页: /users/new
    const newMatch = path.match(/^\/(\w+)\/new$/);
    if (newMatch) {
      const parentPath = `/${newMatch[1]}`;
      const parentName = routeLabelMap[parentPath] || parentPath;
      items.push({ title: parentName });
      items.push({ title: '新建' });
      return items;
    }

    // 精确匹配
    if (path !== '/' && routeLabelMap[path]) {
      items.push({ title: routeLabelMap[path] });
    } else if (path !== '/') {
      // 兜底：用最后一段路径
      const segments = path.split('/').filter(Boolean);
      for (let i = 0; i < segments.length; i++) {
        const segmentPath = '/' + segments.slice(0, i + 1).join('/');
        const label = routeLabelMap[segmentPath] || segments[i] || '';
        items.push({ title: label });
      }
    }

    return items;
  }, [location.pathname, routeLabelMap]);

  // ---- 标签页辅助函数 ----
  /** 根据路由路径获取标签页显示名称 */
  function getTabLabel(path: string, labelMap: Record<string, string>): string {
    if (labelMap[path]) return labelMap[path];
    const editMatch = path.match(/^\/(\w+)\/[^/]+\/edit$/);
    if (editMatch) {
      const parentName = labelMap[`/${editMatch[1]}`] || editMatch[1];
      return `编辑${parentName}`;
    }
    const newMatch = path.match(/^\/(\w+)\/new$/);
    if (newMatch) {
      const parentName = labelMap[`/${newMatch[1]}`] || newMatch[1];
      return `新建${parentName}`;
    }
    return path.split('/').filter(Boolean).pop() || path;
  }

  // 首次加载时，如果当前路径不是首页，添加为标签
  useEffect(() => {
    const path = location.pathname;
    if (path !== '/') {
      const label = getTabLabel(path, routeLabelMap);
      setTabs((prev) => (prev.some((t) => t.key === path) ? prev : [...prev, { key: path, label, closable: true }]));
    }
    setActiveTabKey(path);
    prevPathForTabEffect.current = path;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 路由变化时自动添加新标签（非 tab 切换产生的导航）
  useEffect(() => {
    const path = location.pathname;
    if (prevPathForTabEffect.current !== path) {
      if (!isTabSwitchRef.current) {
        const label = getTabLabel(path, routeLabelMap);
        setTabs((prev) => (prev.some((t) => t.key === path) ? prev : [...prev, { key: path, label, closable: path !== '/' }]));
      }
      isTabSwitchRef.current = false;
      prevPathForTabEffect.current = path;
      setActiveTabKey(path);
    }
  }, [location.pathname, routeLabelMap]);

  // 标签页操作
  const handleTabChange = (key: string) => {
    if (key === location.pathname) return;
    isTabSwitchRef.current = true;
    setActiveTabKey(key);
    navigate(key);
  };

  const handleTabClose = (targetKey: string) => {
    if (targetKey === '/') return;

    // 清理缓存
    pageCacheRef.current.delete(targetKey);

    const idx = tabs.findIndex((t) => t.key === targetKey);
    const newTabs = tabs.filter((t) => t.key !== targetKey);
    setTabs(newTabs);

    // 如果关闭的是当前标签，切换到相邻标签
    if (targetKey === activeTabKey || targetKey === location.pathname) {
      const nextTab = newTabs[Math.min(idx, newTabs.length - 1)] || newTabs[0];
      if (nextTab) {
        isTabSwitchRef.current = true;
        setActiveTabKey(nextTab.key);
        navigate(nextTab.key);
      }
    }
  };

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (childPaths.has(key) || key === '/') {
      navigate(key);
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 深色侧栏 */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={240}
        style={{
          background: '#0f172a',
          borderRight: 'none',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          overflow: 'auto',
        }}
      >
        {/* Logo区域 + 折叠按钮 */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: collapsed ? '0 12px' : '0 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              P
            </div>
            {!collapsed && (
              <span
                style={{
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 18,
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                }}
              >
                Lankit
              </span>
            )}
          </div>
          <Button
            type="text"
            style={{ color: '#94a3b8', fontSize: 16 }}
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
        </div>

        {/* 导航菜单 */}
        {menusLoading ? (
          <div style={{ height: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spin />
          </div>
        ) : (
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            defaultOpenKeys={defaultOpenKeys}
            items={sidebarItems}
            onClick={handleMenuClick}
            style={{
              background: 'transparent',
              borderRight: 'none',
              padding: '12px 8px',
            }}
          />
        )}


      </Sider>

      {/* 右侧区域 */}
      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s ease' }}>
        {/* 顶部栏 */}
        <Header
          style={{
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 24px',
            borderBottom: '1px solid #e2e8f0',
            height: 56,
            position: 'sticky',
            top: 0,
            zIndex: 99,
          }}
        >
          <Dropdown
            menu={{
              items: recentNotifs?.items?.map((n: any) => ({
                key: n.id,
                label: (
                  <div style={{ padding: '4px 0' }}>
                    <div style={{ fontWeight: 500 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{n.message}</div>
                  </div>
                ),
                onClick: () => navigate('/notifications'),
              })) || [],
            }}
            placement="bottomRight"
            trigger={['click']}
            open={notificationOpen}
            onOpenChange={(open) => setNotificationOpen(open)}
          >
            <Space
              style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 6, position: 'relative' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#f1f5f9';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <Badge count={unreadData?.count || 0} overflowCount={99}>
                <BellOutlined style={{ color: '#94a3b8', fontSize: 16 }} />
              </Badge>
              {wsConnected && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
              )}
              {!wsConnected && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
              )}
            </Space>
          </Dropdown>

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space
              style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#f1f5f9';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span style={{ color: '#0f172a', fontWeight: 500, fontSize: 14 }}>
                {user?.name || '用户'}
              </span>
              <SettingOutlined style={{ color: '#94a3b8', fontSize: 14 }} />
            </Space>
          </Dropdown>
        </Header>

        {/* 内容区域 */}
        <Content
          style={{
            margin: 0,
            padding: 24,
            minHeight: 'calc(100vh - 56px)',
            background: '#f1f5f9',
          }}
        >
          {/* 面包屑导航 */}
          <Breadcrumb
            items={breadcrumbItems}
            style={{ marginBottom: 0 }}
          />

          {/* 多标签页栏 */}
          <PageTabs
            tabs={tabs}
            activeKey={activeTabKey}
            onChange={handleTabChange}
            onClose={handleTabClose}
          />

          {/* 标签页内容（所有打开页面缓存，只显示当前激活的） */}
          <div className="page-enter" style={{ position: 'relative' }}>
            {tabs.map((tab) => (
              <div
                key={tab.key}
                style={{
                  display: tab.key === activeTabKey ? 'block' : 'none',
                  minHeight: 'calc(100vh - 200px)',
                }}
              >
                {tab.key === location.pathname
                  ? outlet
                  : pageCacheRef.current.get(tab.key)}
              </div>
            ))}
          </div>
        </Content>
      </Layout>
      <AnnouncementModal
        announcements={unreadAnnouncements}
        open={announcementOpen}
        onClose={() => {
          setAnnouncementOpen(false);
          setReadIds((prev) => {
            const next = new Set(prev);
            for (const a of unreadAnnouncements) next.add(a.id);
            return next;
          });
        }}
      />
    </Layout>
  );
}
