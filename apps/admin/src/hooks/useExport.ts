import { trpc } from '../trpc/client';

/**
 * 通用导出 Hook
 *
 * 使用示例：
 * ```tsx
 * const { exportData, downloading } = useExport({
 *   exportFn: trpc.export.exportUsers,
 *   params: { page: 1, pageSize: 100 },
 *   filename: '用户列表.xlsx',
 * });
 * ```
 */
export function useExport() {
  const exportMutation = trpc.export.exportUsers.useMutation({
    onSuccess: (data: { filename: string; data: string }) => {
      const link = document.createElement('a');
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${data.data}`;
      link.download = data.filename;
      link.click();
    },
    onError: (err) => {
      console.error('导出失败:', err);
    },
  });

  return {
    exportData: exportMutation.mutate,
    downloading: exportMutation.isLoading,
    error: exportMutation.error,
  };
}
