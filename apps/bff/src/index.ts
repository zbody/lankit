import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { trpcServer } from '@hono/trpc-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { ipWhitelistMiddleware } from './middleware/ipWhitelist.js';
import { appRouter, type AppRouter } from './trpc/app.js';
import { createTRPCContext } from './trpc/context.js';
import { initRedis } from './utils/cache.js';
import { initWebSocket } from './utils/websocket.js';
import { startScheduler } from './utils/scheduler.js';

// 初始化 Redis（可选，不可用时自动降级）
initRedis();

export type { AppRouter };

const app = new Hono();

// IP 白名单中间件（仅对 /trpc 生效）
app.use('/trpc/*', ipWhitelistMiddleware());

// 全局限流中间件
app.use('/trpc/*', rateLimitMiddleware({ windowMs: 60000, maxRequests: 60 }));

// CORS for tRPC
app.use(
  '/trpc/*',
  cors({
    origin: ['http://localhost:5175', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
  }),
);

// 登录接口更严格的限流（用 app.use 而非 app.post，保持中间件链完整）
app.use('/trpc/auth.login', rateLimitMiddleware({ windowMs: 60000, maxRequests: 10 }));

// 注册接口更严格的限流
app.use('/trpc/auth.register', rateLimitMiddleware({ windowMs: 60000, maxRequests: 5 }));

// 确保所有响应都使用 UTF-8 编码
app.use('/trpc/*', async (c, next) => {
  await next();
  c.res.headers.set('Content-Type', 'application/json; charset=utf-8');
});

app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext: createTRPCContext,
    onError: (opts) => {
      console.error('tRPC error:', opts.error);
    },
  }),
);

// 文件静态服务
app.use('/files/*', serveStatic({ root: './uploads' }));

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

const port = Number(process.env.PORT) || 3000;

const server = serve({ fetch: app.fetch, port }, () => {
  console.log(`🚀 BFF server running at http://localhost:${port}`);
  console.log(`📡 tRPC endpoint at http://localhost:${port}/trpc`);
  console.log(`🔌 WebSocket at ws://localhost:${port}/ws`);
});

// 初始化 WebSocket
initWebSocket(server);

// 启动定时任务调度器
startScheduler().then(() => console.log('⏰ 定时任务调度器已启动'));
