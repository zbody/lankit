import { useEffect } from 'react';
import { Card, Form, Input, Select, Button, message, Switch, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { trpc } from '../trpc/client';

function buildPasswordRules(settings?: { key: string; value: string }[]): Record<string, unknown>[] {
  const rules: Record<string, unknown>[] = [{ required: true, message: '请输入密码' }];
  if (!settings) return rules;

  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const minLength = parseInt(map['password.minLength'] ?? '8', 10);
  const requireUppercase = map['password.requireUppercase'] === 'true';
  const requireLowercase = map['password.requireLowercase'] === 'true';
  const requireNumbers = map['password.requireNumbers'] === 'true';
  const requireSpecialChars = map['password.requireSpecialChars'] === 'true';

  rules.push({ min: minLength, message: `密码长度不能小于 ${minLength} 位` });
  if (requireUppercase) {
    rules.push({ pattern: /[A-Z]/, message: '密码必须包含大写字母' });
  }
  if (requireLowercase) {
    rules.push({ pattern: /[a-z]/, message: '密码必须包含小写字母' });
  }
  if (requireNumbers) {
    rules.push({ pattern: /[0-9]/, message: '密码必须包含数字' });
  }
  if (requireSpecialChars) {
    rules.push({ pattern: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, message: '密码必须包含特殊字符' });
  }
  return rules;
}

export default function UserFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [form] = Form.useForm();

  const { data: item, isLoading: itemLoading } = trpc.user.byId.useQuery(id ?? '', { enabled: isEdit });
  const { data: orgList } = trpc.org.list.useQuery({ page: 1, pageSize: 100 });
  const { data: roleList } = trpc.role.listAll.useQuery();
  const { data: systemSettings } = trpc.systemSettings.getAll.useQuery();

  const utils = trpc.useUtils();

  const createMutation = trpc.user.create.useMutation({
    onSuccess: () => {
      message.success('创建成功');
      utils.user.list.invalidate();
      navigate('/users');
    },
    onError: (err) => message.error(err.message),
  });
  const updateMutation = trpc.user.update.useMutation({
    onSuccess: () => {
      message.success('更新成功');
      utils.user.list.invalidate();
      utils.user.byId.invalidate(id!);
      navigate('/users');
    },
    onError: (err) => message.error(err.message),
  });

  useEffect(() => {
    if (item) {
      form.setFieldsValue({
        ...item,
        organizationId: (item as { organization?: { id: string } }).organization?.id ?? undefined,
        roleIds: (item as { roles?: { id: string }[] }).roles?.map((r) => r.id) ?? [],
      });
    }
  }, [item, form]);

  const handleSubmit = (values: {
    email?: string;
    name: string;
    password?: string;
    organizationId?: string | null;
    roleIds?: string[];
    isActive?: boolean;
  }) => {
    if (isEdit) {
      const { email, password, ...rest } = values;
      updateMutation.mutate({ id: id!, data: rest });
    } else {
      createMutation.mutate(values as { email: string; name: string; password: string; organizationId?: string | null; roleIds?: string[] });
    }
  };

  if (isEdit && itemLoading) return <Spin style={{ display: 'block', margin: '48px auto' }} />;

  return (
    <Card title={isEdit ? '编辑用户' : '新建用户'}>
      <Form form={form} onFinish={handleSubmit} layout="vertical" style={{ maxWidth: 600 }}>
        {!isEdit && (
          <>
            <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email', message: '请输入正确的邮箱' }]}>
              <Input placeholder="user@example.com" />
            </Form.Item>
            <Form.Item name="password" label="密码" rules={buildPasswordRules(systemSettings)}>
              <Input.Password placeholder="输入密码" />
            </Form.Item>
          </>
        )}
        <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
          <Input placeholder="用户名称" />
        </Form.Item>
        <Form.Item name="organizationId" label="所属组织">
          <Select
            allowClear
            placeholder="选择组织"
            options={(orgList?.items ?? []).map((o) => ({ label: o.name, value: o.id }))}
          />
        </Form.Item>
        <Form.Item name="roleIds" label="角色">
          <Select
            mode="multiple"
            placeholder="选择角色"
            options={(roleList ?? []).map((r) => ({ label: r.name, value: r.id }))}
          />
        </Form.Item>
        {isEdit && (
          <Form.Item name="isActive" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        )}
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={createMutation.isLoading || updateMutation.isLoading}>
            {isEdit ? '更新' : '创建'}
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={() => navigate('/users')}>
            取消
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
