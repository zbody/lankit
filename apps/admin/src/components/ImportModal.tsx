import { useState } from 'react';
import { Button, Modal, Upload, Table, message, Typography, Space, Collapse, Tag } from 'antd';
import { InboxOutlined, DownloadOutlined } from '@ant-design/icons';
import { trpc } from '../trpc/client';

const { Dragger } = Upload;
const { Text } = Typography;

interface ImportModalProps {
  visible: boolean;
  onClose: () => void;
  targetType: 'users' | 'orgs' | 'dicts';
  onSuccess: () => void;
}

export default function ImportModal({ visible, onClose, targetType }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[][] | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const templateMap = {
    users: 'downloadUserTemplate',
    orgs: 'downloadOrgTemplate',
    dicts: 'downloadDictTemplate',
  };

  const importMap = {
    users: 'importUsers',
    orgs: 'importOrgs',
    dicts: 'importDicts',
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const downloadTemplate = (trpc.import as any)[templateMap[targetType]].useMutation({
    onSuccess: (data: { filename: string; data: string }) => {
      const link = document.createElement('a');
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${data.data}`;
      link.download = data.filename;
      link.click();
      message.success('模板下载成功');
    },
    onError: (err: Error) => message.error(err.message),
  });

  const handleDownloadTemplate = () => {
    downloadTemplate.mutate();
  };

  const handleFileChange = (info: { file: { originFileObj?: File } }) => {
    const f = info.file.originFileObj;
    if (!f) return;

    setFile(f);

    // 读取文件预览前 10 行
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const buffer = Buffer.from(e.target?.result as ArrayBuffer);
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (workbook.xlsx as any).load(buffer);
        const ws = workbook.worksheets?.[0];
        if (!ws) return;

        const rows: any[][] = [];
        for (let i = 1; i <= Math.min(ws.rowCount, 11); i++) {
          const row = ws.getRow(i);
          const values: any[] = [];
          for (let j = 1; j <= row.cellCount; j++) {
            values.push(String(row.getCell(j).value ?? ''));
          }
          rows.push(values);
        }
        setPreviewData(rows);
      } catch {
        message.error('文件解析失败');
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = (e.target?.result as string)?.split(',')[1];
        if (!base64) return;
        const importFn = (trpc.import as any)[importMap[targetType]];
        const resp = await importFn.mutateAsync({
          filename: file.name,
          data: base64,
        });
        setResult(resp);
        message.success(`导入完成: 成功 ${resp.success} 条，失败 ${resp.failed} 条`);
      } catch (err: unknown) {
        message.error(err instanceof Error ? err.message : '导入失败');
      } finally {
        setImporting(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData(null);
    setResult(null);
    onClose();
  };

  const columns = previewData && previewData[0]
    ? previewData[0].map((_, i) => ({
        title: String(previewData[0]?.[i] ?? ''),
        dataIndex: i.toString(),
        key: i.toString(),
      }))
    : [];

  return (
    <Modal
      title={`导入 ${targetType === 'users' ? '用户' : targetType === 'orgs' ? '组织' : '字典'}数据`}
      open={visible}
      onCancel={handleClose}
      footer={
        result
          ? [
              <Button key="close" onClick={handleClose}>关闭</Button>,
            ]
          : [
              <Button key="cancel" onClick={handleClose}>取消</Button>,
              <Button
                key="import"
                type="primary"
                disabled={!file || !previewData || previewData.length <= 1}
                loading={importing}
                onClick={handleImport}
              >
                确认导入
              </Button>,
            ]
      }
      width={800}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 下载模板 */}
        <div>
          <Text strong>步骤 1: 下载模板</Text>
          <br />
          <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
            下载导入模板
          </Button>
        </div>

        {/* 上传文件 */}
        {!result && (
          <div>
            <Text strong>步骤 2: 上传文件</Text>
            <Dragger
              accept=".xlsx,.xls"
              multiple={false}
              customRequest={({ file: uploadFile }) => {
                handleFileChange({ file: { originFileObj: uploadFile as File } });
              }}
              style={{ marginTop: 8 }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域</p>
              <p className="ant-upload-hint">支持 .xlsx / .xls 格式</p>
            </Dragger>
          </div>
        )}

        {/* 预览数据 */}
        {previewData && previewData.length > 1 && (
          <div>
            <Text strong>步骤 3: 预览数据（前 10 行）</Text>
            <Collapse
              defaultActiveKey={['preview']}
              style={{ marginTop: 8 }}
              items={[
                {
                  key: 'preview',
                  label: `共 ${previewData.length - 1} 条数据`,
                  children: (
                    <Table
                      dataSource={previewData.slice(1).map((row, i) => ({ key: i, ...Object.fromEntries(row.map((v, j) => [j.toString(), v])) }))}
                      columns={columns}
                      scroll={{ x: 'max-content' }}
                      size="small"
                      pagination={false}
                    />
                  ),
                },
              ]}
            />
          </div>
        )}

        {/* 导入结果 */}
        {result && (
          <div>
            <Space>
              <Tag color="green">成功: {result.success}</Tag>
              {result.failed > 0 && <Tag color="red">失败: {result.failed}</Tag>}
            </Space>
            {result.errors.length > 0 && (
              <Collapse
                style={{ marginTop: 12 }}
                items={result.errors.map((err, i) => ({
                  key: i.toString(),
                  label: `错误 ${i + 1}`,
                  children: <Text type="danger">{err}</Text>,
                }))}
              />
            )}
          </div>
        )}
      </Space>
    </Modal>
  );
}
