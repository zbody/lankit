import { useState, useEffect, useMemo } from 'react';
import { Modal, Input, TreeSelect, Table, Spin, Empty } from 'antd';
import type { TreeSelectProps } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { trpc } from '../trpc/client';

/* ======================== UserPicker ======================== */

interface UserPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (userIds: string[]) => void;
  multiple?: boolean;
  selectedIds?: string[];
  title?: string;
}

/** 用户选择器 - Modal + 搜索 + 表格 */
export function UserPicker({
  open,
  onClose,
  onSelect,
  multiple = false,
  selectedIds = [],
  title = '选择用户',
}: UserPickerProps) {
  const [search, setSearch] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>(selectedIds);
  const { data, isLoading } = trpc.user.list.useQuery({ page: 1, pageSize: 200 });

  useEffect(() => {
    if (open) setSelectedRowKeys(selectedIds);
  }, [open, selectedIds]);

  // 客户端搜索过滤
  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    if (!search) return data.items;
    const q = search.toLowerCase();
    return data.items.filter(
      (item: any) =>
        item.name?.toLowerCase().includes(q) || item.email?.toLowerCase().includes(q),
    );
  }, [data?.items, search]);

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name', width: 120 },
    { title: '邮箱', dataIndex: 'email', key: 'email', width: 200 },
    {
      title: '组织',
      dataIndex: 'organization',
      key: 'organization',
      render: (org: { name: string } | null) => org?.name ?? '-',
    },
  ];

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      width={640}
      onOk={() => { onSelect(selectedRowKeys); onClose(); }}
      destroyOnClose
    >
      <Input
        prefix={<SearchOutlined />}
        placeholder="搜索用户名称或邮箱"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
        allowClear
      />
      <Table
        size="small"
        rowKey="id"
        columns={columns}
        dataSource={filteredItems}
        loading={isLoading}
        pagination={false}
        scroll={{ y: 360 }}
        rowSelection={
          multiple
            ? {
                type: 'checkbox',
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys as string[]),
              }
            : {
                type: 'radio',
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys as string[]),
              }
        }
        locale={{ emptyText: <Empty description="无匹配用户" /> }}
      />
    </Modal>
  );
}

/* ======================== RolePicker ======================== */

interface RolePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (roleIds: string[]) => void;
  multiple?: boolean;
  selectedIds?: string[];
  title?: string;
}

/** 角色选择器 - Modal + 表格 */
export function RolePicker({
  open,
  onClose,
  onSelect,
  multiple = false,
  selectedIds = [],
  title = '选择角色',
}: RolePickerProps) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>(selectedIds);
  const { data, isLoading } = trpc.role.list.useQuery({ page: 1, pageSize: 100 });

  useEffect(() => {
    if (open) setSelectedRowKeys(selectedIds);
  }, [open, selectedIds]);

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name', width: 120 },
    { title: '编码', dataIndex: 'code', key: 'code', width: 120 },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
  ];

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      width={560}
      onOk={() => { onSelect(selectedRowKeys); onClose(); }}
      destroyOnClose
    >
      <Table
        size="small"
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isLoading}
        pagination={false}
        scroll={{ y: 360 }}
        rowSelection={
          multiple
            ? {
                type: 'checkbox',
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys as string[]),
              }
            : {
                type: 'radio',
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys as string[]),
              }
        }
        locale={{ emptyText: <Empty description="无角色数据" /> }}
      />
    </Modal>
  );
}

/* ======================== OrgPicker ======================== */

interface OrgPickerProps {
  open?: boolean;
  onClose?: () => void;
  onSelect?: (orgIds: string[]) => void;
  multiple?: boolean;
  selectedIds?: string[];
  title?: string;
  /** 是否使用 TreeSelect 模式（行内下拉），默认 Modal 模式 */
  mode?: 'modal' | 'treeSelect';
  /** TreeSelect 模式下受控值 */
  value?: string | string[];
  /** TreeSelect 模式下的 onChange */
  onChange?: (value: any) => void;
}

/** 组织选择器 - 支持 Modal 表格模式 和 TreeSelect 行内模式 */
export function OrgPicker({
  open = false,
  onClose = () => {},
  onSelect = () => {},
  multiple = false,
  selectedIds = [],
  title = '选择组织',
  mode = 'modal',
  value,
  onChange,
}: OrgPickerProps) {
  const { data: treeData, isLoading } = trpc.org.tree.useQuery();

  /* ---- 构建 TreeSelect 树形数据 ---- */
  const treeSelectData: TreeSelectProps['treeData'] = buildTreeSelectData(treeData ?? []);

  /* ---- TreeSelect 模式 ---- */
  if (mode === 'treeSelect') {
    return (
      <TreeSelect
        style={{ width: '100%' }}
        value={value}
        onChange={onChange}
        treeData={treeSelectData}
        placeholder="请选择组织"
        allowClear
        treeDefaultExpandAll
        multiple={multiple}
        treeNodeFilterProp="title"
        showSearch
      />
    );
  }

  /* ---- Modal 模式 ---- */
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>(selectedIds);

  useEffect(() => {
    if (open) setSelectedRowKeys(selectedIds);
  }, [open, selectedIds]);

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name', width: 150 },
    { title: '编码', dataIndex: 'code', key: 'code', width: 120 },
  ];

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      width={560}
      onOk={() => { onSelect(selectedRowKeys); onClose(); }}
      destroyOnClose
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
      ) : (
        <Table
          size="small"
          rowKey="id"
          columns={columns}
          dataSource={treeData ?? []}
          pagination={false}
          scroll={{ y: 360 }}
          rowSelection={
            multiple
              ? {
                  type: 'checkbox',
                  selectedRowKeys,
                  onChange: (keys) => setSelectedRowKeys(keys as string[]),
                }
              : {
                  type: 'radio',
                  selectedRowKeys,
                  onChange: (keys) => setSelectedRowKeys(keys as string[]),
                }
          }
          expandable={{
            defaultExpandAllRows: true,
            childrenColumnName: 'children',
            rowExpandable: (record) => !!(record as any).children?.length,
          }}
          locale={{ emptyText: <Empty description="无组织数据" /> }}
        />
      )}
    </Modal>
  );
}

/** 将平铺组织列表转为 TreeSelect 需要的树形结构 */
function buildTreeSelectData(
  items: any[],
): { title: string; value: string; key: string; children?: any[] }[] {
  if (!items?.length) return [];
  return items.map((item) => ({
    title: item.name,
    value: item.id,
    key: item.id,
    children: item.children ? buildTreeSelectData(item.children) : undefined,
  }));
}
