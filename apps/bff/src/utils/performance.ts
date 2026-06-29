/**
 * 性能监控中间件
 *
 * 功能：
 * - 记录接口请求耗时
 * - 统计慢查询
 * - 内存环形缓冲区存储监控数据
 */

export interface PerformanceEntry {
  method: string;
  path: string;
  status: number;
  duration: number; // 毫秒
  userId?: string;
  timestamp: string;
}

/** 内存环形缓冲区，最多存储 1000 条记录 */
const MAX_ENTRIES = 1000;
const buffer: PerformanceEntry[] = [];
let bufferIndex = 0;

/**
 * 记录性能数据
 */
export function recordPerformance(entry: Omit<PerformanceEntry, 'timestamp'>): void {
  const now = new Date().toISOString();
  const perfEntry: PerformanceEntry = { ...entry, timestamp: now };

  if (buffer.length < MAX_ENTRIES) {
    buffer.push(perfEntry);
  } else {
    buffer[bufferIndex] = perfEntry;
  }
  bufferIndex = (bufferIndex + 1) % MAX_ENTRIES;
}

/**
 * 获取性能监控数据
 */
export function getPerformanceData(limit: number = 100): PerformanceEntry[] {
  return buffer.slice(-limit);
}

/**
 * 获取慢查询列表（超过 1000ms 的请求）
 */
export function getSlowQueries(thresholdMs: number = 1000): PerformanceEntry[] {
  return buffer.filter((entry) => entry.duration > thresholdMs);
}

/**
 * 获取接口响应时间统计
 */
export function getApiStats(): {
  totalRequests: number;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  slowRequests: number;
} {
  if (buffer.length === 0) {
    return { totalRequests: 0, avgDuration: 0, maxDuration: 0, minDuration: 0, slowRequests: 0 };
  }

  const durations = buffer.map((e) => e.duration);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const maxDuration = Math.max(...durations);
  const minDuration = Math.min(...durations);
  const slowRequests = durations.filter((d) => d > 1000).length;

  return {
    totalRequests: buffer.length,
    avgDuration: Math.round(avgDuration),
    maxDuration,
    minDuration,
    slowRequests,
  };
}
