import { Card, Form, Input, InputNumber, Select, Switch, Button, message, Typography, Space, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import * as AntdIcons from '@ant-design/icons';
import { trpc } from '../trpc/client';

const { Text } = Typography;

const typeHelp: Record<string, string> = {
  DIRECTORY: '左侧菜单分类（文件夹状，不可点击），需在下方配置子菜单',
  MENU: '可点击的菜单项，指向一个具体的页面',
  BUTTON: '页面内的操作权限（如"新增"、"删除"按钮），控制可见性',
};

/** 预定义的路由 → 组件映射 */
const ROUTE_OPTIONS = [
  { path: '/users', component: 'UserList', label: '用户管理' },
  { path: '/orgs', component: 'OrgList', label: '组织管理' },
  { path: '/roles', component: 'RoleList', label: '角色管理' },
  { path: '/menus', component: 'MenuList', label: '菜单管理' },
  { path: '/', component: 'Dashboard', label: '仪表盘' },
];

/** 常用图标列表 */
const COMMON_ICONS = [
  { icon: 'DashboardOutlined', label: '仪表盘' },
  { icon: 'UserOutlined', label: '用户' },
  { icon: 'TeamOutlined', label: '团队' },
  { icon: 'SafetyOutlined', label: '安全' },
  { icon: 'MenuOutlined', label: '菜单' },
  { icon: 'ApartmentOutlined', label: '组织' },
  { icon: 'SettingOutlined', label: '设置' },
  { icon: 'HomeOutlined', label: '首页' },
  { icon: 'FolderOutlined', label: '文件夹' },
  { icon: 'FileOutlined', label: '文件' },
  { icon: 'DatabaseOutlined', label: '数据库' },
  { icon: 'CloudOutlined', label: '云' },
  { icon: 'GlobalOutlined', label: '全球' },
  { icon: 'LockOutlined', label: '锁' },
  { icon: 'KeyOutlined', label: '密钥' },
  { icon: 'MailOutlined', label: '邮件' },
  { icon: 'MessageOutlined', label: '消息' },
  { icon: 'NotificationOutlined', label: '通知' },
  { icon: 'BellOutlined', label: '铃铛' },
  { icon: 'SearchOutlined', label: '搜索' },
  { icon: 'EditOutlined', label: '编辑' },
  { icon: 'DeleteOutlined', label: '删除' },
  { icon: 'PlusOutlined', label: '新增' },
  { icon: 'DownloadOutlined', label: '下载' },
  { icon: 'UploadOutlined', label: '上传' },
  { icon: 'EyeOutlined', label: '查看' },
  { icon: 'EyeInvisibleOutlined', label: '隐藏' },
  { icon: 'CheckCircleOutlined', label: '成功' },
  { icon: 'CloseCircleOutlined', label: '失败' },
  { icon: 'ExclamationCircleOutlined', label: '警告' },
  { icon: 'InfoCircleOutlined', label: '信息' },
  { icon: 'BarChartOutlined', label: '图表' },
  { icon: 'LineChartOutlined', label: '折线图' },
  { icon: 'PieChartOutlined', label: '饼图' },
  { icon: 'DesktopOutlined', label: '桌面' },
  { icon: 'ProfileOutlined', label: '档案' },
  { icon: 'CalendarOutlined', label: '日历' },
  { icon: 'ClockCircleOutlined', label: '时钟' },
  { icon: 'StarOutlined', label: '收藏' },
  { icon: 'HeartOutlined', label: '喜欢' },
  { icon: 'LikeOutlined', label: '赞' },
  { icon: 'ShareAltOutlined', label: '分享' },
  { icon: 'FilterOutlined', label: '筛选' },
  { icon: 'TagsOutlined', label: '标签' },
  { icon: 'ToolOutlined', label: '工具' },
  { icon: 'RocketOutlined', label: '火箭' },
  { icon: 'CrownOutlined', label: '皇冠' },
  { icon: 'MedalOutlined', label: '奖牌' },
  { icon: 'GiftOutlined', label: '礼物' },
  { icon: 'FireOutlined', label: '火焰' },
  { icon: 'ThunderboltOutlined', label: '闪电' },
  { icon: 'BugOutlined', label: '缺陷' },
  { icon: 'CodeOutlined', label: '代码' },
  { icon: 'ApiOutlined', label: 'API' },
  { icon: 'BranchesOutlined', label: '分支' },
];

/** 图标名字符串 → React 组件 */
function getIconComp(name?: string): React.ReactNode {
  if (!name) return null;
  const Comp = (AntdIcons as any)[name];
  return Comp ? <Comp /> : null;
}

/** 根据名称自动生成权限标识 */
function generatePermission(name: string, type: string): string {
  if (type === 'BUTTON') {
    const words = name.toLowerCase().replace(/[^\w\u4e00-\u9fff]/g, '');
    return `system:${words}:action`;
  }
  return '';
}

export default function MenuFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const watchType = Form.useWatch('type', form);

  const { data: item } = trpc.menu.byId.useQuery(id ?? '', { enabled: isEdit });
  const { data: menuList } = trpc.menu.list.useQuery({ page: 1, pageSize: 100 });

  const utils = trpc.useUtils();
  const createMutation = trpc.menu.create.useMutation({
    onSuccess: () => {
      message.success('创建成功');
      navigate('/menus');
    },
    onError: (err) => message.error(err.message),
  });
  const updateMutation = trpc.menu.update.useMutation({
    onSuccess: () => {
      message.success('更新成功');
      utils.menu.list.invalidate();
      utils.menu.byId.invalidate(id!);
      utils.menu.myMenus.invalidate();
      navigate('/menus');
    },
    onError: (err) => message.error(err.message),
  });

  // 选择路由路径时自动填充组件名
  const handlePathChange = (path: string) => {
    if (path) {
      const route = ROUTE_OPTIONS.find((r) => r.path === path);
      if (route && !form.getFieldValue('component')) {
        form.setFieldValue('component', route.component);
      }
    }
  };

  // 名称变化时自动生成权限标识（仅按钮类型）
  const handleNameChange = (name: string) => {
    const type = form.getFieldValue('type');
    if (type === 'BUTTON' && name) {
      const perm = generatePermission(name, type);
      if (!form.getFieldValue('permission')) {
        form.setFieldValue('permission', perm);
      }
    }
  };

  const handleSubmit = (values: {
    name: string;
    parentId?: string;
    path?: string;
    component?: string;
    icon?: string;
    type: 'DIRECTORY' | 'MENU' | 'BUTTON';
    permission?: string;
    sort: number;
    isVisible: boolean;
    isCache: boolean;
  }) => {
    if (isEdit) {
      updateMutation.mutate({ id: id!, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  // 上级菜单过滤：不能选自己和自己的子菜单
  const excludedIds = new Set<string>([...(id ? [id] : [])]);
  if (id && menuList?.items) {
    const findDescendants = (parentId: string): string[] => {
      const ids: string[] = [];
      for (const m of menuList.items) {
        if (m.parentId === parentId) {
          ids.push(m.id, ...findDescendants(m.id));
        }
      }
      return ids;
    };
    for (const eid of findDescendants(id)) excludedIds.add(eid);
  }

  // 图标选择器选项
  const iconOptions = COMMON_ICONS.map((i) => ({
    label: (
      <Space>
        {getIconComp(i.icon)}
        <span>{i.label}</span>
      </Space>
    ),
    value: i.icon,
  }));

  // 编辑模式下等待数据加载
  if (isEdit && !item) {
    return (
      <Card title="编辑菜单">
        <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>
      </Card>
    );
  }

  return (
    <Card title={isEdit ? '编辑菜单' : '新建菜单'}>
      <Form form={form} initialValues={item ?? undefined} onFinish={handleSubmit} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
          <Input
            placeholder="如：用户管理"
            onChange={(e) => handleNameChange(e.target.value)}
          />
        </Form.Item>

        <Form.Item name="parentId" label="上级菜单">
          <Select
            allowClear
            placeholder="留空则为一级菜单"
            options={(menuList?.items ?? [])
              .filter((m) => !excludedIds.has(m.id))
              .map((m) => ({ label: `${'─'.repeat(2)} ${m.name} (${m.type})`, value: m.id }))}
          />
        </Form.Item>

        <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
          <Select
            options={[
              { label: '目录 (Directory)', value: 'DIRECTORY' },
              { label: '菜单 (Menu)', value: 'MENU' },
              { label: '按钮 (Button)', value: 'BUTTON' },
            ]}
          />
        </Form.Item>
        {watchType && (
          <Text type="secondary" style={{ display: 'block', marginTop: -16, marginBottom: 16 }}>
            {typeHelp[watchType]}
          </Text>
        )}

        {/* 路由路径 - 下拉选择 */}
        <Form.Item
          name="path"
          label="路由路径"
          tooltip="选择已有的路由，或手动输入自定义路径"
        >
          <Select
            allowClear
            showSearch
            placeholder="选择路由路径"
            options={ROUTE_OPTIONS.map((r) => ({ label: `${r.path} → ${r.component}`, value: r.path }))}
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            onChange={handlePathChange}
          />
        </Form.Item>

        {/* 组件 - 自动填充 + 可覆盖 */}
        <Form.Item
          name="component"
          label="组件"
          tooltip="页面组件名，选择路由后自动填充"
        >
          <Select
            allowClear
            showSearch
            placeholder="自动填充"
            options={[
              { label: 'Dashboard', value: 'Dashboard' },
              { label: 'UserList', value: 'UserList' },
              { label: 'OrgList', value: 'OrgList' },
              { label: 'RoleList', value: 'RoleList' },
              { label: 'MenuList', value: 'MenuList' },
            ]}
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        {/* 图标 - 下拉选择 */}
        <Form.Item name="icon" label="图标" tooltip="选择图标">
          <Select
            allowClear
            showSearch
            placeholder="选择图标"
            options={iconOptions}
            filterOption={(input, option) =>
              String(option?.label ?? '').includes(input)
            }
          />
        </Form.Item>

        {/* 权限标识 - 仅按钮类型显示 */}
        {watchType === 'BUTTON' && (
          <Form.Item
            name="permission"
            label="权限标识"
            tooltip="按钮级权限的唯一标识，格式: 模块:功能:操作"
          >
            <Input placeholder="如：system:user:list" />
          </Form.Item>
        )}

        <Form.Item name="sort" label="排序" tooltip="值越小越靠前，支持 0-999 任意整数">
          <InputNumber min={0} max={999} style={{ width: 200 }} />
        </Form.Item>

        <Form.Item name="isVisible" label="可见" valuePropName="checked" tooltip={isEdit && item?.path === '/menus' ? '菜单管理不能关闭可见性' : '关闭后菜单在侧边栏隐藏'}>
          <Switch disabled={isEdit && item?.path === '/menus'} />
        </Form.Item>

        <Form.Item name="isCache" label="缓存" valuePropName="checked" tooltip="离开页面后是否保持状态">
          <Switch />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={createMutation.isLoading || updateMutation.isLoading}>
            {isEdit ? '更新' : '创建'}
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={() => navigate('/menus')}>
            取消
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
