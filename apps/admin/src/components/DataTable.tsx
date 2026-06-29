import { Table, Input, Button } from 'antd';
import type { TableProps, TablePaginationConfig } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { EmptyState } from './EmptyState';

interface DataTableProps<T extends object = any> extends Omit<TableProps<T>, 'title' | 'footer' | 'pagination'> {
  /** 数据总量（用于分页） */
  total?: number;
  /** 当前页码 */
  current?: number;
  /** 页大小 */
  pageSize?: number;
  /** 分页变化回调 */
  onPageChange?: (page: number, pageSize: number) => void;
  /** 是否显示搜索框 */
  showSearch?: boolean;
  /** 搜索占位符 */
  searchPlaceholder?: string;
  /** 搜索值 */
  searchValue?: string;
  /** 搜索变化回调 */
  onSearchChange?: (value: string) => void;
  /** 刷新回调 */
  onRefresh?: () => void;
  /** 是否加载中 */
  loading?: boolean;
  /** 批量操作区域（插槽） */
  batchActions?: React.ReactNode;
  /** 导出按钮区域（插槽） */
  exportActions?: React.ReactNode;
  /** 额外操作按钮（插槽，位于搜索框右侧） */
  extraActions?: React.ReactNode;
  /** 空状态配置，不传则使用默认 */
  emptyText?: string;
  /** 禁用内置分页（用于树形表格等自定义分页场景） */
  disablePagination?: boolean;
}

/**
 * DataTable - 通用表格组件
 *
 * 封装 Ant Design Table，内置：
 * - 分页控制
 * - 搜索框（受控）
 * - 刷新按钮
 * - 批量操作插槽
 * - 导出操作插槽
 * - 空状态
 */
export default function DataTable<T extends object = any>({
  total,
  current = 1,
  pageSize = 20,
  onPageChange,
  showSearch = false,
  searchPlaceholder = '搜索...',
  searchValue,
  onSearchChange,
  onRefresh,
  loading = false,
  batchActions,
  exportActions,
  extraActions,
  emptyText,
  disablePagination = false,
  columns,
  dataSource,
  rowKey = 'id',
  ...restProps
}: DataTableProps<T>) {
  const pagination: TablePaginationConfig | false = disablePagination
    ? false
    : {
        current,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
        showTotal: (t: number) => `共 ${t} 条`,
        onChange: (page, size) => onPageChange?.(page, size),
      };

  return (
    <div>
      {/* 工具栏 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {batchActions}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {exportActions}
          {showSearch && (
            <Input.Search
              allowClear
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              onSearch={(val) => onSearchChange?.(val)}
              style={{ width: 220 }}
            />
          )}
          {onRefresh && (
            <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
              刷新
            </Button>
          )}
          {extraActions}
        </div>
      </div>

      {/* 表格 */}
      <Table<T>
        rowKey={rowKey}
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={pagination}
        locale={{
          emptyText: <EmptyState title={emptyText || '暂无数据'} />,
        }}
        {...restProps}
      />
    </div>
  );
}

export type { DataTableProps };
