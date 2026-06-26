import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始初始化数据...');

  // 1. 创建默认组织
  const rootOrg = await prisma.organization.upsert({
    where: { code: 'root' },
    update: {},
    create: { name: '根组织', code: 'root', sort: 0 },
  });
  console.log(`✅ 根组织: ${rootOrg.name}`);

  // 2. 创建默认角色
  const adminRole = await prisma.role.upsert({
    where: { code: 'admin' },
    update: {},
    create: { name: '超级管理员', code: 'admin', description: '系统超级管理员', isSystem: true, sort: 0 },
  });
  const userRole = await prisma.role.upsert({
    where: { code: 'user' },
    update: {},
    create: { name: '普通用户', code: 'user', description: '普通用户', isSystem: true, sort: 1 },
  });
  console.log(`✅ 角色: ${adminRole.name}, ${userRole.name}`);

  // 3. 创建菜单（系统管理目录 + 各功能菜单）
  const menuData = [
    { name: '仪表盘', code: 'Dashboard', path: '/', component: 'Dashboard', icon: 'DashboardOutlined', type: 'MENU' as const, sort: 0 },
    { name: '系统管理', code: 'System', icon: 'SettingOutlined', type: 'DIRECTORY' as const, sort: 1 },
    { name: '用户管理', code: 'UserManagement', path: '/users', component: 'UserList', icon: 'UserOutlined', type: 'MENU' as const, sort: 0, parentCode: 'System' },
    { name: '组织管理', code: 'OrgManagement', path: '/orgs', component: 'OrgList', icon: 'ApartmentOutlined', type: 'MENU' as const, sort: 1, parentCode: 'System' },
    { name: '角色管理', code: 'RoleManagement', path: '/roles', component: 'RoleList', icon: 'SafetyOutlined', type: 'MENU' as const, sort: 2, parentCode: 'System' },
    { name: '菜单管理', code: 'MenuManagement', path: '/menus', component: 'MenuList', icon: 'MenuOutlined', type: 'MENU' as const, sort: 3, parentCode: 'System' },
    // 用户管理子菜单 - 按钮级权限
    { name: '用户列表', code: 'UserList', path: '/users', type: 'BUTTON' as const, permission: 'system:user:list', sort: 0, parentCode: 'UserManagement' },
    { name: '创建用户', code: 'UserCreate', type: 'BUTTON' as const, permission: 'system:user:create', sort: 1, parentCode: 'UserManagement' },
  ];

  const parentMap = new Map<string, string | null>();
  for (const m of menuData) {
    const parentId = m.parentCode ? parentMap.get(m.parentCode) ?? null : null;
    const { parentCode, ...rest } = m;
    const menu = await prisma.menu.upsert({
      where: { code: rest.code },
      update: { name: rest.name, path: rest.path, sort: rest.sort },
      create: { ...rest, parentId },
    });
    parentMap.set(rest.code, menu.id);
  }
  console.log(`✅ 菜单创建完成 (${menuData.length} 项)`);

  // 4. 给 admin 角色绑定所有菜单
  const allMenus = await prisma.menu.findMany();
  await prisma.roleMenu.deleteMany({ where: { roleId: adminRole.id } });
  await prisma.roleMenu.createMany({
    data: allMenus.map((m) => ({ roleId: adminRole.id, menuId: m.id })),
  });
  console.log(`✅ admin 角色绑定 ${allMenus.length} 个菜单权限`);

  // 5. 创建管理员用户
  const adminEmail = 'admin@bk.com';
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin',
      password: hashedPassword,
      organizationId: rootOrg.id,
    },
  });
  // 绑定 admin 角色
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  });
  console.log(`✅ 管理员用户: ${adminEmail}`);

  // 6. 创建测试用户
  const testUsers = [
    { email: 'alice@bk.com', name: 'Alice' },
    { email: 'bob@bk.com', name: 'Bob' },
    { email: 'charlie@bk.com', name: 'Charlie' },
  ];
  const testPwd = await bcrypt.hash('123456', 10);
  for (const u of testUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password: testPwd, organizationId: rootOrg.id },
    });
    // 绑定普通用户角色
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: userRole.id } },
      update: {},
      create: { userId: user.id, roleId: userRole.id },
    });
    console.log(`✅ 测试用户: ${u.email} (角色: ${userRole.name})`);
  }

  // 7. 初始化系统默认设置
  const defaultSettings = [
    { key: 'password.minLength', value: '8', description: '密码最小长度' },
    { key: 'password.requireUppercase', value: 'true', description: '密码需要大写字母' },
    { key: 'password.requireLowercase', value: 'true', description: '密码需要小写字母' },
    { key: 'password.requireNumbers', value: 'true', description: '密码需要数字' },
    { key: 'password.requireSpecialChars', value: 'false', description: '密码需要特殊字符' },
    { key: 'login.maxFailedAttempts', value: '5', description: '登录最大失败次数' },
    { key: 'login.lockoutDurationMinutes', value: '30', description: '登录锁定持续时间（分钟）' },
    { key: 'session.timeoutMinutes', value: '480', description: '会话超时时间（分钟，默认8小时）' },
    { key: 'audit.enabled', value: 'true', description: '审计日志启用' },
    { key: 'audit.level', value: 'info', description: '审计日志级别（info=全部, warn=修改/删除, error=仅删除）' },
  ];
  for (const s of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s,
    });
  }
  console.log(`✅ 系统设置初始化完成 (${defaultSettings.length} 项)`);

  console.log('🎉 数据初始化完成');
}

main()
  .catch((e) => {
    console.error('❌ 初始化失败:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
