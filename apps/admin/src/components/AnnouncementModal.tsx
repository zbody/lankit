import { Modal, Tag } from 'antd';
import { AlertOutlined, WarningOutlined, InfoCircleOutlined } from '@ant-design/icons';

type LevelCfg = { color: string; icon: React.ReactNode };

function getLevelCfg(level: string): LevelCfg {
  switch (level) {
    case 'INFO': return { color: 'blue', icon: <InfoCircleOutlined /> };
    case 'WARNING': return { color: 'orange', icon: <WarningOutlined /> };
    case 'IMPORTANT': return { color: 'red', icon: <AlertOutlined /> };
    default: return { color: 'blue', icon: <InfoCircleOutlined /> };
  }
}

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  level: string;
}

interface Props {
  announcements: AnnouncementItem[];
  open: boolean;
  onClose: () => void;
}

export default function AnnouncementModal({ announcements, open, onClose }: Props) {
  return (
    <Modal
      title="系统公告"
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
    >
      {announcements.map((a) => {
        const cfg = getLevelCfg(a.level);
        return (
          <div
            key={a.id}
            style={{
              marginBottom: 20,
              padding: 16,
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              background: '#fafafa',
            }}
          >
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tag color={cfg.color} icon={cfg.icon}>
                {a.level === 'IMPORTANT' ? '重要' : a.level === 'WARNING' ? '警告' : '通知'}
              </Tag>
              <strong>{a.title}</strong>
            </div>
            <div dangerouslySetInnerHTML={{ __html: a.content }} style={{ color: '#595959', lineHeight: 1.8 }} />
          </div>
        );
      })}
    </Modal>
  );
}
