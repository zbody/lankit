import { useState } from 'react';
import { Card, Table, Button, Modal, Select, message, Space, Tag } from 'antd';
import { DownloadOutlined, CodeOutlined } from '@ant-design/icons';
import { trpc } from '../trpc/client';

export default function CodeGeneratorPage() {
  const [page] = useState(1);
  const { data, isLoading } = trpc.user.list.useQuery({ page, pageSize: 20 });
  const [genType, setGenType] = useState('ts');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  const generateCode = async () => {
    // 模拟生成代码 — 实际场景可扩展为读取 Prisma schema 生成模板
    const code = `// 自动生成的 ${genType} 代码
// 生成时间: ${new Date().toLocaleString('zh-CN')}

export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string', format: 'email' },
    name: { type: 'string' },
    roles: { type: 'array', items: { type: 'string' } },
  },
  required: ['id', 'email', 'name'],
};`;
    setGeneratedCode(code);
    setPreviewOpen(true);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    message.success('已复制到剪贴板');
  };

  return (
    <Card title="代码生成器" extra={
      <Space>
        <Select value={genType} onChange={setGenType} style={{ width: 120 }}>
          <Select.Option value="ts">TypeScript</Select.Option>
          <Select.Option value="py">Python</Select.Option>
          <Select.Option value="java">Java</Select.Option>
        </Select>
        <Button type="primary" icon={<CodeOutlined />} onClick={generateCode}>生成代码</Button>
      </Space>
    }>
      <Table dataSource={data?.items} columns={[
        { title: '表名', dataIndex: 'id', key: 'id', render: (_: string, r: any) => <Tag color="blue">{r.email?.split('@')[0]}</Tag> },
        { title: '描述', dataIndex: 'email', key: 'email' },
        { title: '生成模板', key: 'template', render: () => <Tag>CRUD + 页面</Tag> },
      ]} rowKey="id" loading={isLoading} pagination={false} />

      <Modal title="代码预览" open={previewOpen} onCancel={() => setPreviewOpen(false)}
        footer={<Button type="primary" icon={<DownloadOutlined />} onClick={copyCode}>复制代码</Button>}
        width={700}
      >
        <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: 16, borderRadius: 6, overflow: 'auto', maxHeight: 400 }}>
          <code>{generatedCode}</code>
        </pre>
      </Modal>
    </Card>
  );
}
