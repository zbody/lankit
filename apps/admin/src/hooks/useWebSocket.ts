import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: string;
  title?: string;
  message?: string;
  userId?: string;
  timestamp?: string;
}

/**
 * WebSocket 客户端 Hook
 *
 * 使用示例：
 * ```tsx
 * const { connected, sendMessage, messages } = useWebSocket('ws://localhost:3000/ws');
 * ```
 */
export function useWebSocket(url: string, token: string | null) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!token) return;

    const ws = new WebSocket(`${url}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WebSocket] 连接成功');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setMessages((prev) => [...prev.slice(-99), message]); // 保留最近100条
      } catch {
        console.error('[WebSocket] 消息解析失败:', event.data);
      }
    };

    ws.onclose = () => {
      console.log('[WebSocket] 连接关闭');
      setConnected(false);
      // 3秒后重连
      reconnectTimerRef.current = window.setTimeout(() => {
        console.log('[WebSocket] 尝试重连...');
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('[WebSocket] 错误:', error);
    };

    return () => {
      ws.close();
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [url, token]);

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return { connected, messages, sendMessage };
}
