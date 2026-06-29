import { Typography, Button } from 'antd';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  className?: string;
}

export { EmptyState, LoadingSkeleton, type EmptyStateProps };

function EmptyState({
  title = '暂无数据',
  description = '当前暂无相关内容',
  action,
  icon,
  className = '',
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center py-12 ${className}`}
    >
      <div className="text-6xl mb-6">{icon || '📭'}</div>
      <Title level={4} className="mb-2">
        {title}
      </Title>
      {description && (
        <Text type="secondary" className="mb-6">
          {description}
        </Text>
      )}
      {action && (
        <Button type="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}

function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
    </div>
  );
}