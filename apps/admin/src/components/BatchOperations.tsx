import { useState } from 'react';
import { Button, Modal, Space, message } from 'antd';
import { DeleteOutlined, TeamOutlined, BankOutlined } from '@ant-design/icons';
import { trpc } from '../trpc/client';
import { RolePicker, OrgPicker } from './Picker';

/**
 * BatchOperations — admin toolbar that exposes bulk actions on top of an
 * antd `Table` whose rows are `User` records.
 *
 * Designed to be rendered directly above the Table in `UserList`. The owner
 * controls selection state and passes the currently-selected user ids plus a
 * `clearSelection` callback. When the selection is empty the toolbar hides
 * itself, so it never competes for layout when nothing is selected.
 *
 * Three actions, mirroring the three new tRPC procedures added in
 * `apps/bff/src/trpc/routers/user.ts`:
 *   - 批量删除      -> batchDelete (soft delete, recycle-bin recoverable)
 *   - 批量分配角色  -> batchAssignRoles (replaces the user's entire role set)
 *   - 批量调整组织  -> batchAdjustOrganization (organizationId: string | null)
 *
 * Visual conventions match the rest of admin pages (antd Space + Button,
 * `message.success` / `message.error` for feedback, `Modal.confirm` for the
 * destructive delete action).
 */
export interface BatchOperationsProps {
  selectedIds: string[];
  onCompleted: () => void;
}

export default function BatchOperations({ selectedIds, onCompleted }: BatchOperationsProps) {
  const utils = trpc.useUtils();

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignRoleIds, setAssignRoleIds] = useState<string[]>([]);

  const [orgOpen, setOrgOpen] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);

  const batchDelete = trpc.user.batchDelete.useMutation({
    onSuccess: (res) => {
      const m = res.missing.length;
      message.success(
        m > 0 ? `已删除 ${res.affected} 个用户，${m} 个不存在或已删除` : `已删除 ${res.affected} 个用户`,
      );
      utils.user.list.invalidate();
      utils.user.recycleBin.invalidate();
      onCompleted();
    },
    onError: (err) => message.error(err.message),
  });

  const batchAssignRoles = trpc.user.batchAssignRoles.useMutation({
    onSuccess: (res) => {
      const m = res.missing.length;
      message.success(
        m > 0 ? `已为 ${res.affected} 个用户更新角色，${m} 个不存在或已删除` : `已为 ${res.affected} 个用户更新角色`,
      );
      utils.user.list.invalidate();
      setAssignOpen(false);
      setAssignRoleIds([]);
      onCompleted();
    },
    onError: (err) => message.error(err.message),
  });

  const batchAdjustOrg = trpc.user.batchAdjustOrganization.useMutation({
    onSuccess: (res) => {
      const m = res.missing.length;
      message.success(
        m > 0 ? `已调整 ${res.affected} 个用户的组织，${m} 个不存在或已删除` : `已调整 ${res.affected} 个用户的组织`,
      );
      utils.user.list.invalidate();
      setOrgOpen(false);
      setOrgId(null);
      onCompleted();
    },
    onError: (err) => message.error(err.message),
  });

  const summary =
    selectedIds.length === 0 ? null : (
      <span style={{ color: '#1677ff' }}>已选 {selectedIds.length} 项</span>
    );

  const handleBatchDelete = () => {
    Modal.confirm({
      title: '确认批量删除',
      content: `将软删除选中的 ${selectedIds.length} 个用户，可在回收站恢复。是否继续？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => batchDelete.mutateAsync({ ids: selectedIds }),
    });
  };

  return (
    <>
      {summary && (
        <div
          style={{
            padding: '8px 12px',
            marginBottom: 12,
            background: '#f0f5ff',
            border: '1px solid #adc6ff',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {summary}
          <Space>
            <Button
              icon={<DeleteOutlined />}
              danger
              loading={batchDelete.isLoading}
              onClick={handleBatchDelete}
            >
              批量删除
            </Button>
            <Button
              icon={<TeamOutlined />}
              loading={batchAssignRoles.isLoading}
              onClick={() => setAssignOpen(true)}
            >
              批量分配角色
            </Button>
            <Button
              icon={<BankOutlined />}
              loading={batchAdjustOrg.isLoading}
              onClick={() => setOrgOpen(true)}
            >
              批量调整组织
            </Button>
            <Button type="link" onClick={onCompleted}>
              取消选择
            </Button>
          </Space>
        </div>
      )}

      <RolePicker
        open={assignOpen}
        title="批量分配角色"
        multiple
        selectedIds={assignRoleIds}
        onSelect={(ids) => {
          setAssignRoleIds(ids);
          batchAssignRoles.mutateAsync({ ids: selectedIds, roleIds: ids });
        }}
        onClose={() => {
          setAssignOpen(false);
          setAssignRoleIds([]);
        }}
      />

      <OrgPicker
        open={orgOpen}
        title="批量调整组织"
        selectedIds={orgId ? [orgId] : []}
        onSelect={(ids) => {
          const newOrgId = ids[0] ?? null;
          setOrgId(newOrgId);
          batchAdjustOrg.mutateAsync({ ids: selectedIds, organizationId: newOrgId });
        }}
        onClose={() => {
          setOrgOpen(false);
          setOrgId(null);
        }}
      />
    </>
  );
}
