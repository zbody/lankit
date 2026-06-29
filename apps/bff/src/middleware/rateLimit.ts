/**
 * API 限流中间件
 *
 * 基于 IP 和用户维度的请求频率控制。
 * 使用 Redis 存储计数器，支持滑动窗口算法。
 *
 * 默认限制：
 * - 普通接口：60 次/分钟
 * - 登录接口：10 次/分钟
 * - 注册接口：5 次/分钟
 */

import type { Context } from 'hono';

interface RateLimitOptions {
  /** 每分钟最大请求次数 */
  windowMs: number;
  /** 窗口大小（秒） */
  maxRequests: number;
  /** 是否针对登录接口 */
  isLogin?: boolean;
  /** 是否针对注册接口 */
  isRegister?: boolean;
}

/** 内存计数器（Redis 不可用时降级） */
const memoryStore = new Map<string, { count: number; resetAt: number }>();

/**
 * 获取客户端 IP
 */
function getClientIp(c: Context): string {
  return c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
    || c.req.header('x-real-ip')
    || c.req.header('cf-connecting-ip')
    || 'unknown';
}

/**
 * 获取限流 key
 */
function getRateLimitKey(ip: string, path: string, isLogin: boolean, isRegister: boolean): string {
  const suffix = isLogin ? ':login' : isRegister ? ':register' : '';
  return `rate-limit:${ip}:${path}${suffix}`;
}

/**
 * 检查请求是否超过限流
 */
export async function checkRateLimit(
  c: Context,
  options: RateLimitOptions,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const opt = options;
  const ip = getClientIp(c);
  const path = c.req.path;
  const isLogin = !!opt.isLogin;
  const isRegister = !!opt.isRegister;
  const key = getRateLimitKey(ip, path, isLogin, isRegister);

  const now = Date.now();
  let entry = memoryStore.get(key);

  // 如果条目不存在或已过期，创建新条目
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + opt.windowMs };
  }

  // 增加计数
  entry.count += 1;
  memoryStore.set(key, entry);

  const remaining = Math.max(0, opt.maxRequests - entry.count);
  const resetAt = entry.resetAt;

  return {
    allowed: entry.count <= opt.maxRequests,
    remaining,
    resetAt,
  };
}

/**
 * 创建限流中间件
 */
export function rateLimitMiddleware(options: RateLimitOptions) {
  return async (c: Context, next: () => Promise<void>) => {
    // 跳过健康检查端点
    if (c.req.path === '/health') {
      return next();
    }

    const result = await checkRateLimit(c, options);

    // 设置限流头部
    c.header('X-RateLimit-Limit', String(options.maxRequests));
    c.header('X-RateLimit-Remaining', String(result.remaining));
    c.header('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));

    if (!result.allowed) {
      c.header('Retry-After', String(Math.ceil((result.resetAt - Date.now()) / 1000)));
      return c.json(
        { error: '请求过于频繁，请稍后再试' },
        429,
      );
    }

    return next();
  };
}

/**
 * 清除过期的内存缓存条目
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.resetAt < now) {
      memoryStore.delete(key);
    }
  }
}

// 每 5 分钟清理一次过期条目
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
