import { z } from 'zod';
import { protectedProcedure, router } from '../router.js';
import { prisma } from '../../db/prisma.js';
import { reloadTask } from '../../utils/scheduler.js';
import { generateCode } from '../../utils/codegen.js';

const taskSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  code: z.string().optional(),
  description: z.string().optional(),
  cronExpr: z.string().min(1, 'Cron 表达式不能为空'),
  handler: z.string().min(1, '处理函数不能为空'),
  params: z.string().optional(),
  status: z.boolean().default(true),
});

const handlerOptions = [
  { value: 'cleanupOldLogs', label: '清理过期操作日志（30天）' },
  { value: 'cleanupAuditLogs', label: '清理过期审计日志（90天）' },
];

export const taskRouter = router({
  list: protectedProcedure
    .input(z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(100).default(20) }))
    .query(async ({ input }) => {
      const skip = (input.page - 1) * input.pageSize;
      const [items, total] = await Promise.all([
        prisma.scheduledTask.findMany({ skip, take: input.pageSize, orderBy: { createdAt: 'desc' } }),
        prisma.scheduledTask.count(),
      ]);
      return {
        items: items.map((t: { id: string; name: string; code: string; description: string | null; cronExpr: string; handler: string; params: string | null; status: boolean; lastRunAt: Date | null; lastResult: string | null; createdBy: string | null; createdAt: Date; updatedAt: Date }) => ({
          ...t,
          lastRunAt: t.lastRunAt?.toISOString() ?? null,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        })),
        total, page: input.page, pageSize: input.pageSize,
      };
    }),

  create: protectedProcedure.input(taskSchema).mutation(async ({ input, ctx }) => {
    const code = input.code ?? (await generateCode(prisma, 'scheduledTask', 'TASK'));
    const item = await prisma.scheduledTask.create({
      data: { ...input, code, createdBy: ctx.session!.userId },
    });
    await reloadTask(item.id);
    return item;
  }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: taskSchema.partial() }))
    .mutation(async ({ input }) => {
      const item = await prisma.scheduledTask.update({ where: { id: input.id }, data: input.data });
      await reloadTask(item.id);
      return item;
    }),

  delete: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    // 停止调度器中的任务并从数据库硬删除
    await reloadTask(input);
    await prisma.scheduledTask.delete({ where: { id: input } });
    return { success: true };
  }),

  toggle: protectedProcedure.input(z.object({ id: z.string(), status: z.boolean() })).mutation(async ({ input }) => {
    const item = await prisma.scheduledTask.update({ where: { id: input.id }, data: { status: input.status } });
    await reloadTask(item.id);
    return item;
  }),

  getHandlers: protectedProcedure.query(async () => handlerOptions),
});
