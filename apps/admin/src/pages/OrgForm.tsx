import { useEffect } from 'react';
import { Card, Form, Input, InputNumber, Select, Button, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { trpc } from '../trpc/client';

/** 递归检查 childId 是否是 parentId 的后代节点 */
function isDescendant(childId: string, parentId: string, items: { id: string; parentId: string | null }[]): boolean {
  for (const o of items) {
    if (o.parentId === parentId) {
      if (o.id === childId) return true;
      if (isDescendant(childId, o.id, items)) return true;
    }
  }
  return false;
}

export default function OrgFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [form] = Form.useForm();

  const { data: item } = trpc.org.byId.useQuery(id ?? '', { enabled: isEdit });
  const { data: orgList } = trpc.org.list.useQuery({ page: 1, pageSize: 100 });

  const utils = trpc.useUtils();

  const createMutation = trpc.org.create.useMutation({
    onSuccess: () => {
      message.success('创建成功');
      utils.org.list.invalidate();
      navigate('/orgs');
    },
    onError: (err) => message.error(err.message),
  });
  const updateMutation = trpc.org.update.useMutation({
    onSuccess: () => {
      message.success('更新成功');
      utils.org.list.invalidate();
      utils.org.byId.invalidate(id);
      navigate('/orgs');
    },
    onError: (err) => message.error(err.message),
  });

  useEffect(() => {
    if (item) form.setFieldsValue(item);
  }, [item, form]);

  const handleSubmit = (values: { name: string; parentId?: string; sort: number }) => {
    if (isEdit) {
      updateMutation.mutate({ id: id!, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <Card title={isEdit ? '编辑组织' : '新建组织'}>
      <Form form={form} onFinish={handleSubmit} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
          <Input placeholder="组织名称" />
        </Form.Item>
        <Form.Item name="parentId" label="上级组织" tooltip="留空则为根级组织">
          <Select
            allowClear
            placeholder="留空则为根级组织"
            options={(orgList?.items ?? [])
              .filter((o) => {
                if (o.id === id) return false; // 不能选自己
                if (id && o.parentId === id) return false; // 不能选直属子组织
                // 不能选间接子组织（递归排除所有后代）
                if (id && isDescendant(o.id, id, orgList?.items ?? [])) return false;
                return true;
              })
              .map((o) => ({ label: o.name, value: o.id }))}
          />
        </Form.Item>
        <Form.Item name="sort" label="排序">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={createMutation.isLoading || updateMutation.isLoading}>
            {isEdit ? '更新' : '创建'}
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={() => navigate('/orgs')}>
            取消
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
