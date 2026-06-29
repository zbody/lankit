import { useState } from 'react';
import { Row, Col, Button, Input, Select, DatePicker, Space } from 'antd';
import { SearchOutlined, ReloadOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;

export interface SearchField {
  name: string;
  label: string;
  type: 'input' | 'select' | 'dateRange';
  placeholder?: string;
  /** select 类型时的选项 */
  options?: { label: string; value: string }[];
  span?: number;
}

export interface SearchFormProps {
  fields: SearchField[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  onSearch: () => void;
  onReset: () => void;
  loading?: boolean;
  /** 显示的字段数，超出折叠 */
  visibleCount?: number;
}

/**
 * SearchForm - 通用筛选栏组件
 *
 * 用法：
 * ```tsx
 * const [filters, setFilters] = useState({ name: '', status: '', dateRange: null });
 * <SearchForm
 *   fields={[
 *     { name: 'name', label: '名称', type: 'input' },
 *     { name: 'status', label: '状态', type: 'select', options: [...], },
 *     { name: 'dateRange', label: '时间范围', type: 'dateRange' },
 *   ]}
 *   values={filters}
 *   onChange={setFilters}
 *   onSearch={handleSearch}
 *   onReset={() => setFilters({ name: '', status: '', dateRange: null })}
 * />
 * ```
 */
export default function SearchForm({
  fields,
  values,
  onChange,
  onSearch,
  onReset,
  loading = false,
  visibleCount = 3,
}: SearchFormProps) {
  const [collapsed, setCollapsed] = useState(true);
  const visibleFields = collapsed ? fields.slice(0, visibleCount) : fields;
  const hasMore = fields.length > visibleCount;

  const renderField = (field: SearchField) => {
    const value = values[field.name];

    switch (field.type) {
      case 'input':
        return (
          <Input
            allowClear
            placeholder={field.placeholder || `请输入${field.label}`}
            value={value || ''}
            onChange={(e) => onChange({ ...values, [field.name]: e.target.value })}
          />
        );
      case 'select':
        return (
          <Select
            allowClear
            style={{ width: '100%' }}
            placeholder={field.placeholder || `请选择${field.label}`}
            value={value || undefined}
            onChange={(v) => onChange({ ...values, [field.name]: v })}
            options={field.options}
          />
        );
      case 'dateRange':
        return (
          <RangePicker
            style={{ width: '100%' }}
            value={value}
            onChange={(dates) => onChange({ ...values, [field.name]: dates })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <Row gutter={[12, 12]}>
        {visibleFields.map((field) => (
          <Col key={field.name} span={field.span ?? 6}>
            {renderField(field)}
          </Col>
        ))}
        <Col span={6}>
          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={onSearch} loading={loading}>
              查询
            </Button>
            <Button icon={<ReloadOutlined />} onClick={onReset}>
              重置
            </Button>
            {hasMore && (
              <Button type="link" onClick={() => setCollapsed(!collapsed)}>
                {collapsed ? <><DownOutlined /> 展开</> : <><UpOutlined /> 收起</>}
              </Button>
            )}
          </Space>
        </Col>
      </Row>
    </div>
  );
}
