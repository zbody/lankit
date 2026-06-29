/**
 * Redis 缓存工具类
 *
 * 提供通用的 cache.get/set/del 方法，支持 TTL 配置。
 * 所有操作都是非阻塞的——Redis 不可用时自动降级到内存缓存。
 */

import Redis from 'ioredis';

// ── 全局实例 ──────────────────────────────────────────────

let redisClient: Redis | null = null;
const memoryCache = new Map<string, { value: unknown; expiry: number }>();

/** 初始化 Redis 客户端 */
export function initRedis(url?: string): Redis {
  const connectionString = url ?? process.env.REDIS_URL ?? 'redis://localhost:6379/0';

  redisClient = new Redis(connectionString, {
    reconnectOnError: (err: Error) => {
      const targetErrors = [/READONLY/, /ETIMEDOUT/, /ECONNREFUSED/, /DEADLOCK/];
      const shouldReconnect = targetErrors.some((target) => target.test(err.message));
      if (shouldReconnect) {
        return true;
      }
      return false;
    },
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
  });

  redisClient.on('error', (err: Error) => {
    console.warn('[Redis] Connection error:', err.message);
    // 出错时自动降级到内存缓存
    redisClient = null;
  });

  redisClient.on('connect', () => {
    console.log('[Redis] Connected successfully');
  });

  return redisClient;
}

// ── 通用缓存方法 ──────────────────────────────────────────

/**
 * 获取缓存值
 * @param key 缓存键
 * @returns 缓存值，未命中则返回 null
 */
export async function cacheGet<T = unknown>(key: string): Promise<T | null> {
  // 优先从 Redis 读取
  if (redisClient) {
    try {
      const raw = await redisClient.get(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      // Redis 不可用，降级到内存缓存
      redisClient = null;
    }
  }

  // 降级到内存缓存
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiry > 0 && entry.expiry < Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value as T;
}

/**
 * 设置缓存值
 * @param key 缓存键
 * @param value 缓存值
 * @param ttlSeconds 过期时间（秒），默认 3600（1小时）
 */
export async function cacheSet<T>(key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
  const serialized = JSON.stringify(value);

  // 优先写入 Redis
  if (redisClient) {
    try {
      await redisClient.setex(key, ttlSeconds, serialized);
      return;
    } catch {
      redisClient = null;
    }
  }

  // 降级到内存缓存
  memoryCache.set(key, {
    value,
    expiry: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0,
  });
}

/**
 * 删除缓存
 * @param key 缓存键
 */
export async function cacheDel(key: string): Promise<void> {
  // 尝试从 Redis 删除
  if (redisClient) {
    try {
      await redisClient.del(key);
    } catch {
      // 忽略错误
    }
  }

  // 从内存缓存删除
  memoryCache.delete(key);
}

/**
 * 检查缓存是否存在
 * @param key 缓存键
 * @returns 是否存在
 */
export async function cacheHas(key: string): Promise<boolean> {
  if (redisClient) {
    try {
      const result = await redisClient.exists(key);
      return result > 0;
    } catch {
      redisClient = null;
    }
  }
  return memoryCache.has(key);
}

/**
 * 清除所有内存缓存（用于调试或手动清理）
 */
export function clearMemoryCache(): void {
  memoryCache.clear();
}

/**
 * 关闭 Redis 连接
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      // 忽略关闭时的错误
    }
    redisClient = null;
  }
  memoryCache.clear();
}
