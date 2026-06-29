import { z } from 'zod';
import { protectedProcedure, router } from '../router.js';
import { prisma } from '../../db/prisma.js';
import { sendTo, broadcast } from '../../utils/websocket.js';

export const websocketRouter = router({
  /**
   * 发送实时通知给用户
   */
  sendNotification: protectedProcedure
    .input(z.object({
      userId: z.string(),
      title: z.string(),
      message: z.string(),
      type: z.enum(['INFO', 'WARNING', 'ERROR', 'SUCCESS']).default('INFO'),
    }))
    .mutation(async ({ input }) => {
      // 创建数据库通知记录
      await prisma.notification.create({
        data: {
          userId: input.userId,
          title: input.title,
          message: input.message,
          type: input.type,
        },
      });

      // 通过 WebSocket 实时推送
      sendTo(input.userId, {
        type: 'notification',
        title: input.title,
        message: input.message,
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    }),

  /**
   * 广播系统消息给所有在线用户
   */
  broadcastSystemMessage: protectedProcedure
    .input(z.object({
      title: z.string(),
      message: z.string(),
      type: z.enum(['INFO', 'WARNING', 'ERROR', 'SUCCESS']).default('INFO'),
    }))
    .mutation(async ({ input }) => {
      broadcast({
        type: 'system_message',
        title: input.title,
        message: input.message,
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    }),

  /**
   * 获取在线用户数量
   */
  getOnlineCount: protectedProcedure.query(async () => {
    const { getOnlineCount } = await import('../../utils/websocket.js');
    return { count: getOnlineCount() };
  }),
});
