import { publicProcedure, router } from '../router.js';
import { prisma } from '../../db/prisma.js';

export const systemRouter = router({
  getStats: publicProcedure.query(async () => {
    const userCount = await prisma.user.count();
    return {
      userCount,
      status: 'online',
      timestamp: new Date().toISOString(),
    };
  }),
});
