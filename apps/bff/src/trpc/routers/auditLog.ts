import { z } from 'zod';
import { protectedProcedure, router } from '../router.js';
import { prisma } from '../../db/prisma.js';

export const auditLogRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input }) => {
      const skip = (input.page - 1) * input.pageSize;
      const [items, total] = await Promise.all([
        prisma.auditLog.findMany({
          skip,
          take: input.pageSize,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            userId: true,
            userName: true,
            action: true,
            entity: true,
            entityId: true,
            oldValues: true,
            newValues: true,
            ipAddress: true,
            userAgent: true,
            createdAt: true,
          },
        }),
        prisma.auditLog.count(),
      ]);
      return {
        items,
        total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  byId: protectedProcedure.input(z.string()).query(async ({ input }) => {
    const item = await prisma.auditLog.findUnique({
      where: { id: input },
    });
    if (!item) throw new Error('审计日志不存在');
    return item;
  }),
});
