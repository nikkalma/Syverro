// src/components/Studio/StudioLayout.tsx

import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAdminTheme } from '../../store/adminStore';
import { ADMIN_ROLES } from '../../types/admin';
import { getLocaleData, getBrowserLocale } from '../../locales';
import StudioHeader from './shared/StudioHeader';
import './StudioLayout.css';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function StudioLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useAdminTheme();
  const locale = getBrowserLocale();
  const t = getLocaleData(locale);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const userRole = user?.role || 'user';
  const hasAccess = ADMIN_ROLES.includes(userRole as any);

  if (!hasAccess) {
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
      }}>
        <div style={{ fontSize: '64px' }}>🚫</div>
        <h1 style={{ fontSize: '24px', fontWeight: '400' }}>{t.admin.access.denied}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{t.admin.access.noPermission}</p>
        <button
          onClick={() => navigate('/')}
          className="glass-button glass-button-primary"
        >
          {t.admin.access.returnHome}
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      color: 'var(--text-primary)',
    }}>
      <StudioHeader
        moduleName=""
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main style={{
        flex: 1,
        overflowY: 'auto',
        background: 'var(--bg)',
      }}>
        {children}
      </main>
    </div>
  );
}
