import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import AdminLayout from './layouts/AdminLayout';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardPage from './pages/Dashboard';
import UserListPage from './pages/UserList';
import UserFormPage from './pages/UserForm';
import OrgListPage from './pages/OrgList';
import OrgFormPage from './pages/OrgForm';
import RoleListPage from './pages/RoleList';
import RoleFormPage from './pages/RoleForm';
import MenuListPage from './pages/MenuList';
import MenuFormPage from './pages/MenuForm';
import AuditLogListPage from './pages/AuditLogList';
import NotificationCenterPage from './pages/NotificationCenter';
import SystemSettingsPage from './pages/SystemSettings';
import DictTypeListPage from './pages/DictTypeList';
import FileListPage from './pages/FileList';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  const { isAuthenticated, loading } = useAuth();

  if (!token) return <Navigate to="/login" replace />;
  if (loading) return <div style={{ padding: 48, textAlign: 'center' }}>加载中...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UserListPage />} />
        <Route path="users/new" element={<UserFormPage />} />
        <Route path="users/:id/edit" element={<UserFormPage />} />
        <Route path="orgs" element={<OrgListPage />} />
        <Route path="orgs/new" element={<OrgFormPage />} />
        <Route path="orgs/:id/edit" element={<OrgFormPage />} />
        <Route path="roles" element={<RoleListPage />} />
        <Route path="roles/new" element={<RoleFormPage />} />
        <Route path="roles/:id/edit" element={<RoleFormPage />} />
        <Route path="menus" element={<MenuListPage />} />
        <Route path="menus/new" element={<MenuFormPage />} />
        <Route path="menus/:id/edit" element={<MenuFormPage />} />
        <Route path="audit-logs" element={<AuditLogListPage />} />
        <Route path="notifications" element={<NotificationCenterPage />} />
        <Route path="settings" element={<SystemSettingsPage />} />
        <Route path="dict" element={<DictTypeListPage />} />
        <Route path="files" element={<FileListPage />} />
      </Route>
    </Routes>
  );
}
