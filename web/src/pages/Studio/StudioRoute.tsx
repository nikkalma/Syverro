import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getLocaleData, getBrowserLocale } from '../../locales';
import StudioLayout from '../../components/Studio/StudioLayout';

interface AdminRouteProps {
  requiredRole?: 'owner' | 'admin' | 'moderator';
}

export default function StudioRoute({ requiredRole = 'moderator' }: AdminRouteProps) {
  const { user, isAuthenticated, restoreSession } = useAuthStore();
  const [sessionChecked, setSessionChecked] = useState(false);
  const location = useLocation();
  const locale = getBrowserLocale();
  const t = getLocaleData(locale);

  useEffect(() => {
    void restoreSession().finally(() => setSessionChecked(true));
  }, [restoreSession]);

  if (!sessionChecked) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div>{t.admin.common.loading}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnTo = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`);
    window.location.replace(`https://syverro.com/login?returnTo=studio&studioPath=${returnTo}`);
    return null;
  }

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        color: 'var(--text-primary)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <div>{t.admin.common.loading}</div>
        </div>
      </div>
    );
  }

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
        background: 'var(--bg)',
        color: 'var(--text-primary)',
        flexDirection: 'column',
        gap: '16px',
        textAlign: 'center',
        padding: '20px',
      }}>
        <div style={{ display: 'inline-flex', color: 'var(--error)', opacity: 0.8 }}><ShieldAlert size={40} /></div>
        <h1 style={{ fontSize: '24px', fontWeight: '400' }}>{t.admin.access.denied}</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
          {t.admin.access.noPermission}
          <br />
          <span style={{ fontSize: '13px', color: 'var(--primary)' }}>
            {t.admin.access.yourRole} <strong>{userRole}</strong> · {t.admin.access.required} <strong>{requiredRole}</strong>
          </span>
        </p>
        <button
          onClick={() => window.location.href = 'https://syverro.com'}
          style={{
            padding: '10px 24px',
            background: 'var(--primary)',
            border: 'none',
            borderRadius: '8px',
            color: '#FFFFFF',
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

  return <StudioLayout><Outlet /></StudioLayout>;
}

export const StudioOwnerRoute = () => <StudioRoute requiredRole="owner" />;
export const StudioAdminRoute = () => <StudioRoute requiredRole="admin" />;
export const StudioModeratorRoute = () => <StudioRoute requiredRole="moderator" />;
