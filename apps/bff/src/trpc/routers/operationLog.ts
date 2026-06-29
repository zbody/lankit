import { z } from 'zod';
import { protectedProcedure, router } from '../router.js';
import { prisma } from '../../db/prisma.js';

export const operationLogRouter = router({
  /**
   * 获取操作日志列表
   */
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        entity: z.string().optional(),
        userId: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const skip = (input.page - 1) * input.pageSize;
      const where: Record<string, unknown> = {};

      if (input.entity) {
        where.entity = input.entity;
      }
      if (input.userId) {
        where.userId = input.userId;
      }
      if (input.startDate || input.endDate) {
        where.createdAt = {};
        if (input.startDate) {
          (where.createdAt as any).gte = new Date(input.startDate);
        }
        if (input.endDate) {
          (where.createdAt as any).lte = new Date(input.endDate);
        }
      }

      const [logs, total] = await Promise.all([
        prisma.operationLog.findMany({
          where,
          skip,
          take: input.pageSize,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.operationLog.count({ where }),
      ]);

      return {
        items: logs.map((l: any) => ({
          ...l,
          createdAt: l.createdAt.toISOString(),
        })),
        total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  /**
   * 获取操作统计
   */
  getStats: protectedProcedure.query(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayCount, weekCount, monthCount] = await Promise.all([
      prisma.operationLog.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.operationLog.count({
        where: { createdAt: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.operationLog.count({
        where: { createdAt: { gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    return {
      todayCount,
      weekCount,
      monthCount,
    };
  }),
});
