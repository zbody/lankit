import type { inferAsyncReturnType } from '@trpc/server';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { prisma } from '../db/prisma.js';
import { verifyToken, type JwtPayload } from '../middleware/auth.js';

export async function createTRPCContext(opts: FetchCreateContextFnOptions) {
  const token = opts.req.headers.get('authorization')?.slice(7) || null;
  const session: JwtPayload | null = token ? verifyToken(token) : null;

  return {
    prisma,
    session,
    headers: opts.req.headers,
  };
}

export type TRPCContext = inferAsyncReturnType<typeof createTRPCContext>;
