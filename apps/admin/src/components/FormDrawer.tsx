import { Drawer, Form, Button, Spin } from 'antd';
import type { FormInstance, FormProps } from 'antd';

interface FormDrawerProps<T = Record<string, unknown>> {
  open: boolean;
  title: string;
  width?: number;
  loading?: boolean;
  submitting?: boolean;
  form: FormInstance<T>;
  children: React.ReactNode;
  onClose: () => void;
  onSubmit: (values: T) => void | Promise<void>;
  /** 底部自定义操作按钮，不传则显示默认的 取消+提交 */
  footer?: React.ReactNode;
  /** Form 额外属性透传 */
  formProps?: Partial<FormProps<T>>;
}

/**
 * FormDrawer - 侧滑表单组件
 *
 * 基于 Ant Design Drawer + Form，适用于编辑/创建表单的侧栏展示。
 * 支持 loading、submitting、自定义 footer。
 */
export default function FormDrawer<T = Record<string, unknown>>({
  open,
  title,
  width = 520,
  loading = false,
  submitting = false,
  form,
  children,
  onClose,
  onSubmit,
  footer,
  formProps,
}: FormDrawerProps<T>) {
  return (
    <Drawer
      title={title}
      open={open}
      width={width}
      onClose={onClose}
      destroyOnClose
      maskClosable
      styles={{ body: { padding: 0 } }}
      footer={
        footer ?? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={onClose} disabled={submitting}>
              取消
            </Button>
            <Button type="primary" loading={submitting} onClick={() => form.submit()}>
              提交
            </Button>
          </div>
        )
      }
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <Spin />
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={onSubmit}
          style={{ padding: 24 }}
          {...formProps}
        >
          {children}
        </Form>
      )}
    </Drawer>
  );
}
