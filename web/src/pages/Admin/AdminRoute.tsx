// src/pages/Admin/AdminRoute.tsx

import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getLocaleData, getBrowserLocale } from '../../locales';
import AdminLayout from '../../components/Admin/AdminLayout';

interface AdminRouteProps {
  children: ReactNode;
  requiredRole?: 'owner' | 'admin' | 'moderator';
}

export default function AdminRoute({ children, requiredRole = 'moderator' }: AdminRouteProps) {
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const location = useLocation();
  const locale = getBrowserLocale();
  const t = getLocaleData(locale);

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
          <div>{t.admin.common.loading}</div>
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
        <h1 style={{ fontSize: '24px', fontWeight: '400' }}>{t.admin.access.denied}</h1>
        <p style={{ color: '#97A6BA', maxWidth: '400px' }}>
          {t.admin.access.noPermission}
          <br />
          <span style={{ fontSize: '13px', color: '#5B86A1' }}>
            {t.admin.access.yourRole} <strong>{userRole}</strong> · {t.admin.access.required} <strong>{requiredRole}</strong>
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
          {t.admin.access.returnHome}
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
