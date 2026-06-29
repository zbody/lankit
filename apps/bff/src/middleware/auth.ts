import type { Context } from 'hono';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';
import { cacheSet, cacheGet } from '../utils/cache.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_BLACKLIST_PREFIX = 'jwt:blacklist:';
const JWT_BLACKLIST_TTL = 7 * 24 * 3600; // 7 天（与 JWT 过期时间一致）

export interface JwtPayload {
  userId: string;
  roles: string[];
  mfaPending?: boolean;
}

export function signToken(payload: JwtPayload, expiresIn: string = '7d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as SignOptions);
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function extractToken(c: Context): string | null {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}

/** 检查登录失败保护 */
export async function checkLoginProtection(email: string, ipAddress: string): Promise<{ allowed: boolean; reason?: string }> {
  const maxAttempts = 5;
  const lockoutMinutes = 30;
  const lockoutUntil = new Date(Date.now() - lockoutMinutes * 60 * 1000);

  // 检查同一邮箱在锁定期间内的失败次数
  const emailFailures = await prisma.loginAttempt.count({
    where: {
      email,
      success: false,
      createdAt: { gte: lockoutUntil },
    },
  });

  // 检查同一 IP 在锁定期间内的失败次数
  const ipFailures = await prisma.loginAttempt.count({
    where: {
      ipAddress,
      success: false,
      createdAt: { gte: lockoutUntil },
    },
  });

  if (emailFailures >= maxAttempts) {
    return { allowed: false, reason: `邮箱 ${email} 登录失败次数过多，请稍后再试` };
  }
  if (ipFailures >= maxAttempts) {
    return { allowed: false, reason: `IP ${ipAddress} 登录失败次数过多，请稍后再试` };
  }

  return { allowed: true };
}

/** 记录登录尝试 */
export async function recordLoginAttempt(
  email: string,
  success: boolean,
  ipAddress: string | null,
  userAgent: string | null,
  reason?: string,
): Promise<void> {
  await prisma.loginAttempt.create({
    data: {
      email,
      success,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      reason: reason || null,
    },
  });
}

/**
 * 将 JWT 加入黑名单（注销时调用）
 * @param token JWT token
 */
export async function blacklistToken(token: string): Promise<void> {
  const payload = verifyToken(token);
  if (!payload) return;

  const key = `${JWT_BLACKLIST_PREFIX}${token}`;
  await cacheSet(key, { blacklisted: true }, JWT_BLACKLIST_TTL);
}

/**
 * 检查 JWT 是否在黑名单中
 * @param token JWT token
 * @returns 是否在黑名单中
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const key = `${JWT_BLACKLIST_PREFIX}${token}`;
  const result = await cacheGet<{ blacklisted: boolean }>(key);
  return result?.blacklisted === true;
}

