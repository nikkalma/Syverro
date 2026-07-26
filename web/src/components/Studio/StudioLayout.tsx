// src/components/Studio/StudioLayout.tsx

import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAdminTheme } from '../../store/adminStore';
import { ADMIN_ROLES } from '../../types/admin';
import { Menu, X } from 'lucide-react';
import { getLocaleData, getBrowserLocale } from '../../locales';
import type { LocaleData } from '../../locales';
import StudioHeader from './shared/StudioHeader';
import './StudioLayout.css';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

export default function StudioLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useAdminTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const locale = getBrowserLocale();
  const t = getLocaleData(locale);

  const getNavItems = (t: LocaleData): NavItem[] => [
    { path: '/studio', label: t.admin.nav.dashboard, icon: '📊' },
    { path: '/studio/users', label: t.admin.nav.users, icon: '👥' },
    { path: '/studio/books', label: t.admin.nav.books, icon: '📚' },
    { path: '/studio/authors', label: t.admin.nav.authors, icon: '✍️' },
    { path: '/studio/genres', label: t.admin.nav.genres, icon: '🏷️' },
    { path: '/studio/taxonomy', label: (t.admin.nav as any).taxonomy || 'Таксономия', icon: '🏛️' },
    { path: '/studio/moderation', label: t.admin.nav.moderation, icon: '🛡️' },
    { path: '/studio/metadata', label: t.admin.nav.metadata, icon: '📝' },
    { path: '/studio/logs', label: t.admin.nav.logs, icon: '📋' },
    { path: '/studio/settings', label: t.admin.nav.settings, icon: '⚙️' },
  ];

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const navItems = getNavItems(t);

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

  const showSidebar = location.pathname !== '/studio';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/studio' && location.pathname === '/studio') return true;
    if (path !== '/studio' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg)', 
      display: 'flex', 
      color: 'var(--text-primary)',
    }}>
      {showSidebar && (
        <aside className={`studio-sidebar ${isMobileMenuOpen ? 'open' : ''}`} style={{
        width: '240px',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border-soft)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
      }}>
        <Link to="/studio" style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-soft)',
          fontSize: '20px',
          fontWeight: '600',
          color: 'var(--text-primary)',
          fontFamily: "'Playfair Display', serif",
          letterSpacing: '4px',
          textDecoration: 'none',
          display: 'block',
        }}>
          {t.admin.siteName}
          <span style={{ fontSize: '12px', color: 'var(--primary)', marginLeft: '8px', letterSpacing: '0' }}>
            {t.admin.brand}
          </span>
        </Link>

        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 16px',
                borderRadius: '8px',
                color: isActive(item.path) ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive(item.path) ? 'var(--primary)' : 'transparent',
                textDecoration: 'none',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.2s',
                marginBottom: '4px',
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.background = 'var(--surface-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border-soft)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 0',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: '600',
            }}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email || 'Пользователь'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--primary)' }}>
                {user?.role || 'user'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="glass-button"
            style={{
              color: 'var(--error)',
              borderColor: 'rgba(239, 83, 80, 0.3)',
            }}
          >
            🚪 Выйти
          </button>
        </div>
        </aside>
      )}

      <div className="studio-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          {showSidebar && (
          <button
            className="studio-hamburger"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              background: 'var(--surface)',
              border: 'none',
              borderBottom: '1px solid var(--border-soft)',
              color: 'var(--text-secondary)',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '12px 16px',
              display: 'none',
            }}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          )}
          <StudioHeader
            moduleName={navItems.find(item => isActive(item.path))?.label || t.admin.nav.dashboard}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        </div>

        <main style={{
          flex: 1,
          padding: '24px',
          overflowY: 'auto',
          background: 'var(--bg)',
        }}>
          {children}
        </main>
      </div>

      {isMobileMenuOpen && (
        <div
          className="studio-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
          }}
        />
      )}
    </div>
  );
}
