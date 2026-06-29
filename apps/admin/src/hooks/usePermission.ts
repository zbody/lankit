import { trpc } from '../trpc/client';

/**
 * usePermission - 按钮级/菜单级权限检查 Hook
 *
 * 基于当前用户的 myMenus 数据判断权限。
 * hasPermission(code)  - 检查按钮权限（permission 字段匹配）
 * hasMenu(path)        - 检查菜单/页面访问权限（path 字段匹配）
 */
export function usePermission() {
  const { data: myMenusData } = trpc.menu.myMenus.useQuery();

  const menus = myMenusData?.menus ?? [];

  /** 检查按钮权限：传入 permission 标识，如 "user:create" */
  function hasPermission(code: string): boolean {
    if (!code) return false;
    return menus.some((m) => m.permission === code);
  }

  /** 检查菜单访问权限：传入路由 path，如 "/users" */
  function hasMenu(path: string): boolean {
    if (!path) return false;
    return menus.some((m) => m.path === path);
  }

  /** 检查是否有任意一个权限（OR） */
  function hasAnyPermission(...codes: string[]): boolean {
    return codes.some((c) => hasPermission(c));
  }

  /** 检查是否同时拥有所有权限（AND） */
  function hasAllPermissions(...codes: string[]): boolean {
    return codes.every((c) => hasPermission(c));
  }

  return {
    hasPermission,
    hasMenu,
    hasAnyPermission,
    hasAllPermissions,
    menus,
    menuIds: myMenusData?.menuIds ?? [],
  };
}
