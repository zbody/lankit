import { Breadcrumb, Typography } from 'antd';

const { Title } = Typography;

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbItems?: { title: string; path?: string }[];
  extra?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  description,
  breadcrumbItems,
  extra,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`mb-6 ${className}`}> 
      {/* 面包屑导航 */}
      {breadcrumbItems && breadcrumbItems.length > 0 && (
        <div className="mb-2">
          <Breadcrumb separator=">">
            {breadcrumbItems.map((item, index) => (
              <Breadcrumb.Item key={index}>
                {item.path ? (
                  <a href={item.path}>{item.title}</a>
                ) : (
                  item.title
                )}
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        </div>
      )}

      {/* 标题区域 */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <Title level={2} style={{ margin: 0 }} className="font-semibold text-gray-800">
            {title}
          </Title>
          {description && (
            <p className="text-gray-600 mt-1 text-sm">{description}</p>
          )}
        </div>
        
        {extra && (
          <div className="flex-shrink-0">
            {extra}
          </div>
        )}
      </div>
    </div>
  );
}