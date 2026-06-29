import { z } from 'zod';
import { protectedProcedure, router } from '../router.js';
import { prisma } from '../../db/prisma.js';

export const auditLogRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        action: z.string().optional(),
        entity: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const where: Record<string, unknown> = {};
      if (input.action) where.action = input.action;
      if (input.entity) where.entity = input.entity;
      if (input.search) {
        where.OR = [
          { userName: { contains: input.search } },
          { ipAddress: { contains: input.search } },
        ];
      }
      if (input.startDate || input.endDate) {
        const createdAt: Record<string, Date> = {};
        if (input.startDate) createdAt.gte = new Date(input.startDate);
        if (input.endDate) createdAt.lte = new Date(input.endDate);
        where.createdAt = createdAt;
      }
      const skip = (input.page - 1) * input.pageSize;
      const [items, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
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
        prisma.auditLog.count({ where }),
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
