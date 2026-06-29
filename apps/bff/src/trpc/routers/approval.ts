import { z } from 'zod';
import { protectedProcedure, router } from '../router.js';
import { prisma } from '../../db/prisma.js';

export const approvalRouter = router({
  list: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(20),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const where: Record<string, unknown> = {};
      if (input.status) where.status = input.status;
      const skip = (input.page - 1) * input.pageSize;
      const [items, total] = await Promise.all([
        prisma.approval.findMany({
          where, skip, take: input.pageSize, orderBy: { createdAt: 'desc' },
          include: { actions: { orderBy: { createdAt: 'desc' } } },
        }),
        prisma.approval.count({ where }),
      ]);
      return {
        items: items.map((a: any) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
          updatedAt: a.updatedAt.toISOString(),
          actions: a.actions.map((act: any) => ({ ...act, createdAt: act.createdAt.toISOString() })),
        })),
        total, page: input.page, pageSize: input.pageSize,
      };
    }),

  create: protectedProcedure
    .input(z.object({ title: z.string().min(1), type: z.string().min(1), content: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const item = await prisma.approval.create({
        data: { ...input, applicantId: ctx.session!.userId },
      });
      return item;
    }),

  approve: protectedProcedure
    .input(z.object({ id: z.string(), comment: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const approval = await prisma.approval.findUnique({ where: { id: input.id } });
      if (!approval || approval.status !== 'PENDING') throw new Error('审批不存在或已完成');
      await prisma.$transaction([
        prisma.approval.update({ where: { id: input.id }, data: { status: 'APPROVED' } }),
        prisma.approvalAction.create({
          data: { approvalId: input.id, action: 'APPROVED', comment: input.comment, operatorId: ctx.session!.userId },
        }),
      ]);
      return { success: true };
    }),

  reject: protectedProcedure
    .input(z.object({ id: z.string(), comment: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const approval = await prisma.approval.findUnique({ where: { id: input.id } });
      if (!approval || approval.status !== 'PENDING') throw new Error('审批不存在或已完成');
      await prisma.$transaction([
        prisma.approval.update({ where: { id: input.id }, data: { status: 'REJECTED' } }),
        prisma.approvalAction.create({
          data: { approvalId: input.id, action: 'REJECTED', comment: input.comment, operatorId: ctx.session!.userId },
        }),
      ]);
      return { success: true };
    }),
});
