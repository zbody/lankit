import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../router.js';
import { prisma } from '../../db/prisma.js';

export const notificationRouter = router({
  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input }) => {
      const skip = (input.page - 1) * input.pageSize;
      const [items, total] = await Promise.all([
        prisma.notification.findMany({
          skip,
          take: input.pageSize,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            userId: true,
            type: true,
            title: true,
            message: true,
            isRead: true,
            metadata: true,
            createdAt: true,
          },
        }),
        prisma.notification.count(),
      ]);
      return {
        items,
        total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  byId: publicProcedure.input(z.string()).query(async ({ input }) => {
    const item = await prisma.notification.findUnique({
      where: { id: input },
    });
    if (!item) throw new Error('通知不存在');
    return item;
  }),

  markAsRead: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    await prisma.notification.update({
      where: { id: input },
      data: { isRead: true },
    });
    return { success: true };
  }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await prisma.notification.updateMany({
      where: { userId: ctx.session!.userId, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await prisma.notification.count({
      where: { userId: ctx.session!.userId, isRead: false },
    });
    return { count };
  }),

  // 系统发送通知（管理用）
  send: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        type: z.enum(['INFO', 'WARNING', 'ERROR', 'SUCCESS']).default('INFO'),
        title: z.string().min(1),
        message: z.string().min(1),
        metadata: z.record(z.string()).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const notification = await prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          message: input.message,
          metadata: input.metadata || undefined,
        },
      });
      return notification;
    }),
});
