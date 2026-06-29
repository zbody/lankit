import type { MiddlewareHandler } from 'hono';
import { prisma } from '../db/prisma.js';

let whitelistCache: string[] | null = null;
let lastFetch = 0;

async function getWhitelist(): Promise<string[]> {
  const now = Date.now();
  if (whitelistCache && now - lastFetch < 60000) return whitelistCache; // 缓存 60 秒
  const setting = await prisma.systemSetting.findUnique({ where: { key: 'ipWhitelist.enabled' } });
  if (setting?.value !== 'true') {
    whitelistCache = null;
    return [];
  }
  const ips = await prisma.systemSetting.findUnique({ where: { key: 'ipWhitelist.ips' } });
  whitelistCache = ips?.value ? ips.value.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
  lastFetch = now;
  return whitelistCache;
}

export function ipWhitelistMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const whitelist = await getWhitelist();
    if (whitelist.length > 0) {
      const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || 'unknown';
      if (!whitelist.includes(ip)) {
        return c.json({ error: { message: 'IP 不在白名单中' } }, 403);
      }
    }
    await next();
  };
}
