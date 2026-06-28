// src/pages/Admin/AdminRoute.tsx

import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ADMIN_ROLES } from '../../types/admin';
import AdminLayout from '../../components/Admin/AdminLayout';

interface AdminRouteProps {
  children: ReactNode;
  requiredRole?: 'owner' | 'admin' | 'moderator';
}

export default function AdminRoute({ children, requiredRole = 'moderator' }: AdminRouteProps) {
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  // Не авторизован — редирект на логин
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Загрузка (если пользователь ещё не загружен)
  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0B1220',
        color: '#E6EDF3',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <div>Загрузка...</div>
        </div>
      </div>
    );
  }

  // Проверка роли
  const userRole = user.role || 'user';
  const roleHierarchy: Record<string, number> = {
    owner: 4,
    admin: 3,
    moderator: 2,
    user: 1,
  };

  const requiredLevel = roleHierarchy[requiredRole] || 2;
  const userLevel = roleHierarchy[userRole] || 1;

  if (userLevel < requiredLevel) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0B1220',
        color: '#E6EDF3',
        flexDirection: 'column',
        gap: '16px',
        textAlign: 'center',
        padding: '20px',
      }}>
        <div style={{ fontSize: '64px' }}>🚫</div>
        <h1 style={{ fontSize: '24px', fontWeight: '400' }}>Доступ запрещён</h1>
        <p style={{ color: '#97A6BA', maxWidth: '400px' }}>
          У вас недостаточно прав для доступа к этому разделу.
          <br />
          <span style={{ fontSize: '13px', color: '#5B86A1' }}>
            Ваша роль: <strong>{userRole}</strong> · Требуется: <strong>{requiredRole}</strong>
          </span>
        </p>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            padding: '10px 24px',
            background: '#5B86A1',
            border: 'none',
            borderRadius: '8px',
            color: '#0A1118',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Вернуться на главную
        </button>
      </div>
    );
  }

  return <AdminLayout>{children}</AdminLayout>;
}

// ============================================================
// ХЕЛПЕРЫ ДЛЯ КОНКРЕТНЫХ РОЛЕЙ
// ============================================================

export const AdminOwnerRoute = ({ children }: { children: ReactNode }) => (
  <AdminRoute requiredRole="owner">{children}</AdminRoute>
);

export const AdminAdminRoute = ({ children }: { children: ReactNode }) => (
  <AdminRoute requiredRole="admin">{children}</AdminRoute>
);

export const AdminModeratorRoute = ({ children }: { children: ReactNode }) => (
  <AdminRoute requiredRole="moderator">{children}</AdminRoute>
);