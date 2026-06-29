import { z } from 'zod';
import { protectedProcedure, router } from '../router.js';
import { getPerformanceData, getSlowQueries, getApiStats } from '../../utils/performance.js';

export const performanceRouter = router({
  /**
   * 获取接口性能数据
   */
  getData: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(1000).default(100),
      }),
    )
    .query(({ input }) => {
      return {
        data: getPerformanceData(input.limit),
        stats: getApiStats(),
      };
    }),

  /**
   * 获取慢查询列表
   */
  getSlowQueries: protectedProcedure
    .input(
      z.object({
        thresholdMs: z.number().default(1000),
      }),
    )
    .query(({ input }) => {
      return {
        queries: getSlowQueries(input.thresholdMs),
        count: getSlowQueries(input.thresholdMs).length,
      };
    }),

  /**
   * 获取接口统计
   */
  getStats: protectedProcedure.query(() => {
    return getApiStats();
  }),
});
