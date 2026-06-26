import type { Context } from 'hono';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export interface JwtPayload {
  userId: string;
  roles: string[];
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
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
