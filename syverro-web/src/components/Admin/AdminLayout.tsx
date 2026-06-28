// src/components/Admin/AdminLayout.tsx

import { ReactNode, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAdminTheme } from '../../store/adminStore';
import { ADMIN_ROLES } from '../../types/admin';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/admin', label: 'Dashboard', icon: '📊' },
  { path: '/admin/users', label: 'Пользователи', icon: '👥' },
  { path: '/admin/books', label: 'Книги', icon: '📚' },
  { path: '/admin/authors', label: 'Авторы', icon: '✍️' },
  { path: '/admin/genres', label: 'Жанры', icon: '🏷️' },
  { path: '/admin/logs', label: 'Логи', icon: '📋' },
  { path: '/admin/settings', label: 'Настройки', icon: '⚙️' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useAdminTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Проверка прав доступа к админке
  const userRole = user?.role || 'user';
  const hasAccess = ADMIN_ROLES.includes(userRole as any);

  if (!hasAccess) {
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
      }}>
        <div style={{ fontSize: '64px' }}>🚫</div>
        <h1 style={{ fontSize: '24px', fontWeight: '400' }}>Доступ запрещён</h1>
        <p style={{ color: '#97A6BA' }}>У вас нет прав для доступа к административной панели.</p>
        <button
          onClick={() => navigate('/')}
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path !== '/admin' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const bgColor = theme === 'dark' ? '#0B1220' : '#F5F5F5';
  const textColor = theme === 'dark' ? '#E6EDF3' : '#1A1A1A';
  const sidebarBg = theme === 'dark' ? '#121C24' : '#FFFFFF';
  const borderColor = theme === 'dark' ? '#1A2832' : '#E0E0E0';
  const hoverBg = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const activeBg = theme === 'dark' ? 'rgba(91, 134, 161, 0.2)' : 'rgba(91, 134, 161, 0.1)';

  return (
    <div style={{ minHeight: '100vh', background: bgColor, display: 'flex', color: textColor }}>
      {/* ===== БОКОВОЕ МЕНЮ ===== */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`} style={{
        width: '240px',
        background: sidebarBg,
        borderRight: `1px solid ${borderColor}`,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Логотип */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${borderColor}`,
          fontSize: '20px',
          fontWeight: '600',
          color: '#E6EDF3',
          fontFamily: "'Playfair Display', serif",
          letterSpacing: '4px',
        }}>
          Syverro
          <span style={{ fontSize: '12px', color: '#5B86A1', marginLeft: '8px', letterSpacing: '0' }}>Admin</span>
        </div>

        {/* Навигация */}
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
                color: isActive(item.path) ? '#E6EDF3' : '#97A6BA',
                background: isActive(item.path) ? activeBg : 'transparent',
                textDecoration: 'none',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.2s',
                marginBottom: '4px',
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.background = hoverBg;
                  e.currentTarget.style.color = '#E6EDF3';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#97A6BA';
                }
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Нижняя часть меню */}
        <div style={{
          padding: '16px 20px',
          borderTop: `1px solid ${borderColor}`,
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
              background: '#5B86A1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0A1118',
              fontSize: '14px',
              fontWeight: '600',
            }}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#E6EDF3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email || 'Пользователь'}
              </div>
              <div style={{ fontSize: '11px', color: '#5B86A1' }}>
                {user?.role || 'user'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              background: 'rgba(239, 83, 80, 0.1)',
              border: '1px solid rgba(239, 83, 80, 0.2)',
              borderRadius: '8px',
              color: '#EF5350',
              fontSize: '13px',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 83, 80, 0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239, 83, 80, 0.1)')}
          >
            🚪 Выйти
          </button>
        </div>
      </aside>

      {/* ===== ОСНОВНОЙ КОНТЕНТ ===== */}
      <div className="admin-content">
        {/* ===== ВЕРХНЯЯ ПАНЕЛЬ ===== */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          background: sidebarBg,
          borderBottom: `1px solid ${borderColor}`,
          position: 'sticky',
          top: 0,
          zIndex: 50,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              className="admin-hamburger"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: textColor,
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              ☰
            </button>
            <span style={{ fontSize: '18px', fontWeight: '300', color: '#97A6BA' }}>
              {navItems.find(item => isActive(item.path))?.label || 'Dashboard'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={toggleTheme}
              style={{
                background: 'none',
                border: 'none',
                color: '#97A6BA',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = textColor)}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#97A6BA')}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        {/* ===== КОНТЕНТ ===== */}
        <main style={{
          flex: 1,
          padding: '24px',
          overflowY: 'auto',
        }}>
          {children}
        </main>
      </div>

      {/* ===== МОБИЛЬНЫЙ ОВЕРЛЕЙ ===== */}
      {isMobileMenuOpen && (
        <div
          className="admin-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}