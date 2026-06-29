import cron from 'node-cron';
import { prisma } from '../db/prisma.js';

import type { ScheduledTask } from 'node-cron';

const tasks = new Map<string, ScheduledTask>();
const handlers = new Map<string, () => Promise<void>>();

export function registerHandler(code: string, handler: () => Promise<void>) {
  handlers.set(code, handler);
}

export async function startScheduler() {
  // 停止所有现有任务
  for (const [_, task] of tasks) task.stop();
  tasks.clear();

  // 从数据库加载已启用的任务
  const dbTasks = await prisma.scheduledTask.findMany({ where: { status: true } });
  for (const t of dbTasks) {
    const handler = handlers.get(t.handler);
    if (!handler || !cron.validate(t.cronExpr)) continue;
    const task = cron.schedule(t.cronExpr, async () => {
      try {
        const start = Date.now();
        await handler();
        await prisma.scheduledTask.update({
          where: { id: t.id },
          data: { lastRunAt: new Date(), lastResult: `成功 (${Date.now() - start}ms)` },
        });
      } catch (err: any) {
        await prisma.scheduledTask.update({
          where: { id: t.id },
          data: { lastRunAt: new Date(), lastResult: `失败: ${err.message}` },
        });
      }
    });
    tasks.set(t.id, task);
  }
}

export async function stopScheduler() {
  for (const [_, task] of tasks) task.stop();
  tasks.clear();
}

export async function reloadTask(taskId: string) {
  // 停止旧任务
  const old = tasks.get(taskId);
  if (old) { old.stop(); tasks.delete(taskId); }

  const t = await prisma.scheduledTask.findUnique({ where: { id: taskId } });
  if (!t || !t.status) return;

  const handler = handlers.get(t.handler);
  if (!handler || !cron.validate(t.cronExpr)) return;

  const task = cron.schedule(t.cronExpr, async () => {
    try {
      const start = Date.now();
      await handler();
      await prisma.scheduledTask.update({
        where: { id: t.id },
        data: { lastRunAt: new Date(), lastResult: `成功 (${Date.now() - start}ms)` },
      });
    } catch (err: any) {
      await prisma.scheduledTask.update({
        where: { id: t.id },
        data: { lastRunAt: new Date(), lastResult: `失败: ${err.message}` },
      });
    }
  });
  tasks.set(taskId, task);
}

// 预置任务：清理过期操作日志（每天凌晨3点）
registerHandler('cleanupOldLogs', async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await prisma.operationLog.deleteMany({ where: { createdAt: { lt: thirtyDaysAgo } } });
});

// 预置任务：清理过期审计日志（每天凌晨3:30）
registerHandler('cleanupAuditLogs', async () => {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  await prisma.auditLog.deleteMany({ where: { createdAt: { lt: ninetyDaysAgo } } });
});
