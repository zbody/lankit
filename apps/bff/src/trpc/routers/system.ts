import { publicProcedure, protectedProcedure, router } from '../router.js';
import { prisma } from '../../db/prisma.js';

export const systemRouter = router({
  getStats: publicProcedure.query(async () => {
    const userCount = await prisma.user.count();
    return {
      userCount,
      status: 'online',
      timestamp: new Date().toISOString(),
    };
  }),

  dashboardStats: protectedProcedure.query(async () => {
    const [
      userCount,
      activeUserCount,
      orgCount,
      roleCount,
      menuCount,
      unreadNotifCount,
      recentLoginAttempts,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true, deletedAt: null } }),
      prisma.organization.count({ where: { deletedAt: null } }),
      prisma.role.count({ where: { deletedAt: null } }),
      prisma.menu.count({ where: { deletedAt: null } }),
      prisma.notification.count({ where: { isRead: false } }),
      prisma.loginAttempt.count({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      prisma.auditLog.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    return {
      userCount,
      activeUserCount,
      orgCount,
      roleCount,
      menuCount,
      unreadNotifCount,
      recentLoginAttempts,
      recentAuditLogs,
      timestamp: new Date().toISOString(),
    };
  }),
});
