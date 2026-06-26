import { useNavigate, useLocation, useOutlet } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Space, Spin } from 'antd';
import {
  DashboardOutlined,
  MenuOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import * as AntdIcons from '@ant-design/icons';
import { useState, useMemo, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { trpc } from '../trpc/client';
import type { MenuProps } from 'antd';

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
    if (m.parentId || m.path === '/') continue; // 已有父目录
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

  // 获取当前用户的菜单
  const { data: myMenusData, isLoading: menusLoading } = trpc.menu.myMenus.useQuery();
  // 获取未读通知数
  const { data: unreadData } = trpc.notification.unreadCount.useQuery();
  // 获取最新5条通知（用于下拉面板）
  const { data: recentNotifs } = trpc.notification.list.useQuery({ page: 1, pageSize: 5 });

  // ---- KeepAlive（isCache 缓存机制） ----
  const outlet = useOutlet();
  const pageCache = useRef<Map<string, React.ReactNode>>(new Map());
  const prevPathRef = useRef(location.pathname);
  const prevOutletRef = useRef<React.ReactNode>(null);

  // 从菜单配置中提取需要缓存的路径
  const cachedPaths = useMemo(() => {
    if (!myMenusData) return new Set<string>();
    return new Set(
      myMenusData.menus
        .filter((m) => m.isCache && m.path)
        .map((m) => m.path as string),
    );
  }, [myMenusData]);

  // 在渲染前更新页面缓存：路径变化时捕获上一页的内容
  if (prevOutletRef.current && prevPathRef.current !== location.pathname && cachedPaths.has(prevPathRef.current)) {
    pageCache.current.set(prevPathRef.current, prevOutletRef.current);
  }
  // 清除不再需要的缓存（路径从缓存列表中移除时）
  for (const path of pageCache.current.keys()) {
    if (!cachedPaths.has(path)) {
      pageCache.current.delete(path);
    }
  }
  prevPathRef.current = location.pathname;
  prevOutletRef.current = outlet;

  const sidebarItems = useMemo(() => {
    if (!myMenusData) return [];
    return buildSidebarMenus(myMenusData.menus);
  }, [myMenusData]);

  // 添加管理菜单（审计日志、通知中心、系统设置）
  const adminMenuItems = useMemo(() => {
    const items: MenuProps['items'] = [];
    // 检查是否有 admin 角色
    const isAdmin = user?.roles?.some((r: { code: string }) => r.code === 'admin');
    if (isAdmin) {
      items.push({ key: '/audit-logs', icon: <FileTextOutlined />, label: '审计日志' });
      items.push({ key: '/notifications', icon: <BellOutlined />, label: '通知中心' });
      items.push({ key: '/settings', icon: <SettingOutlined />, label: '系统设置' });
    }
    return items;
  }, [user]);

  const allSidebarItems = useMemo(() => {
    const items: MenuProps['items'] = [...(sidebarItems ?? [])];
    if (adminMenuItems.length > 0) {
      items.push({
        key: 'admin',
        icon: <SettingOutlined />,
        label: '管理',
        children: adminMenuItems,
      });
    }
    return items;
  }, [sidebarItems, adminMenuItems]);

  const childPaths = useMemo(() => {
    const paths = new Set<string>();
    for (const item of allSidebarItems ?? []) {
      const sub = item as typeof item & { children?: { key: string }[] };
      if (sub?.children) {
        for (const c of sub.children) {
          if (c && 'key' in c) paths.add(String((c as any).key));
        }
      }
    }
    return paths;
  }, [allSidebarItems]);

  const defaultOpenKeys = useMemo(() => {
    const keys: string[] = [];
    for (const item of allSidebarItems ?? []) {
      const sub = item as typeof item & { children?: { key: string }[] };
      if (sub?.children?.some((c) => c && 'key' in c && c.key === location.pathname)) {
        keys.push(String(sub.key));
      }
    }
    return keys;
  }, [allSidebarItems, location.pathname]);

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (childPaths.has(key) || key === '/' || key === 'admin') {
      navigate(key);
    }
  };

  const userMenuItems: MenuProps['items'] = [
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
        {/* Logo区域 */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
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
            items={allSidebarItems}
            onClick={handleMenuClick}
            style={{
              background: 'transparent',
              borderRight: 'none',
              padding: '12px 8px',
            }}
          />
        )}

        {/* 底部折叠按钮 */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'center',
            padding: '12px 0',
          }}
        >
          <Button
            type="text"
            style={{ color: '#94a3b8', fontSize: 16 }}
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
        </div>
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
              <BellOutlined style={{ color: '#94a3b8', fontSize: 16 }} />
              {unreadData && unreadData.count > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {unreadData.count}
                </span>
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
          <div className="page-enter">
            {Array.from(pageCache.current.entries()).map(([path, element]) => (
              <div key={path} style={{ display: path === location.pathname ? 'block' : 'none' }}>
                {element}
              </div>
            ))}
            {!cachedPaths.has(location.pathname) && outlet}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
