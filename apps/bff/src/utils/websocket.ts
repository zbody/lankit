/**
 * WebSocket 实时推送服务
 *
 * 功能：
 * - 实时通知推送
 * - 在线状态管理
 * - 系统广播
 * - 断连自动重连（客户端）
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends WebSocket {
  userId: string;
  username?: string;
}

/** 连接的客户端集合 */
const clients = new Map<string, AuthenticatedSocket>();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

/**
 * 初始化 WebSocket 服务器
 * 在独立端口上运行，避免与 Hono HTTP 服务器的 upgrade 事件兼容问题
 */
const WS_PORT = parseInt(process.env.WS_PORT || '3003', 10);

export function initWebSocket(_server: any): void {
  // 在独立端口上创建 WebSocket 服务器
  const wss = new WebSocketServer({ port: WS_PORT });
  console.log(`🔌 WebSocket server running at ws://localhost:${WS_PORT}`);

  wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.send(JSON.stringify({ type: 'error', message: '未提供认证令牌' }));
      ws.close(4001, 'Unauthorized');
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const authenticatedWs = ws as AuthenticatedSocket;
      authenticatedWs.userId = decoded.userId;

      // 注册连接
      clients.set(decoded.userId, authenticatedWs);

      // 发送连接成功消息
      authenticatedWs.send(JSON.stringify({
        type: 'connected',
        userId: decoded.userId,
        message: 'WebSocket 连接成功',
      }));

      console.log(`[WebSocket] 用户 ${decoded.userId} 已连接，当前在线: ${clients.size}`);
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: '令牌无效' }));
      ws.close(4001, 'Invalid token');
    }

    ws.on('close', () => {
      const authWs = ws as AuthenticatedSocket;
      if (authWs.userId) {
        clients.delete(authWs.userId);
        console.log(`[WebSocket] 用户 ${authWs.userId} 已断开，当前在线: ${clients.size}`);
      }
    });

    ws.on('error', (err: Error) => {
      console.error('[WebSocket] 连接错误:', err.message);
    });
  });
}

/**
 * 向指定用户发送消息
 */
export function sendTo(userId: string, message: unknown): boolean {
  const ws = clients.get(userId);
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return false;
  }
  ws.send(JSON.stringify(message));
  return true;
}

/**
 * 向所有在线用户广播消息
 */
export function broadcast(message: unknown): void {
  const data = JSON.stringify(message);
  for (const [, ws] of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

/**
 * 获取在线用户数量
 */
export function getOnlineCount(): number {
  return clients.size;
}

/**
 * 获取所有在线用户ID
 */
export function getOnlineUsers(): string[] {
  return Array.from(clients.keys());
}
