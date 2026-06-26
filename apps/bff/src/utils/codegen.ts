/**
 * 后端编码自动生成（前缀 + 序号）
 *
 * 每个表的前缀：
 * - ORG — Organization
 * - ROLE — Role
 * - MENU — Menu
 *
 * 规则：前缀 + 5 位数字序列（如 ORG00001、ROLE00042）
 * 查询表中已有的最大编码，自增得到下一个。
 * 若没有匹配前缀的记录，则从 00001 开始。
 */

import { PrismaClient } from '@prisma/client';

type ModelWithCode = {
  findFirst: (args: {
    where: { code: { startsWith: string } };
    orderBy: { code: 'desc' };
    select: { code: true };
  }) => Promise<{ code: string } | null>;
};

export async function generateCode(
  prisma: PrismaClient,
  model: keyof PrismaClient,
  prefix: string,
): Promise<string> {
  const delegate = (prisma as any)[model] as ModelWithCode;

  const lastRecord = await delegate.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' },
    select: { code: true },
  });

  if (!lastRecord) {
    return `${prefix}00001`;
  }

  const suffix = lastRecord.code.slice(prefix.length);

  // 只有后缀是全数字时才递增，否则从头开始
  if (/^\d+$/.test(suffix)) {
    const nextNum = parseInt(suffix, 10) + 1;
    return `${prefix}${String(nextNum).padStart(5, '0')}`;
  }

  return `${prefix}00001`;
}
