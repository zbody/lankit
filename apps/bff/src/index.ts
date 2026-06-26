import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { trpcServer } from '@hono/trpc-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { appRouter, type AppRouter } from './trpc/app.js';
import { createTRPCContext } from './trpc/context.js';

export type { AppRouter };

const app = new Hono();

// CORS for tRPC
app.use(
  '/trpc/*',
  cors({
    origin: ['http://localhost:5175', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
  }),
);

app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext: createTRPCContext,
  }),
);

// 文件静态服务
app.use('/files/*', serveStatic({ root: './uploads' }));

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

const port = Number(process.env.PORT) || 3000;

serve({ fetch: app.fetch, port }, () => {
  console.log(`🚀 BFF server running at http://localhost:${port}`);
  console.log(`📡 tRPC endpoint at http://localhost:${port}/trpc`);
});
