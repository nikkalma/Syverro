// src/components/Admin/AdminLayout.tsx

import { ReactNode, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAdminTheme } from '../../store/adminStore';
import { ADMIN_ROLES } from '../../types/admin';
import { Sun, Moon, Menu, X } from 'lucide-react';
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
        <h1 style={{ fontSize: '24px', fontWeight: '400' }}>Доступ запрещён</h1>
        <p style={{ color: 'var(--text-secondary)' }}>У вас нет прав для доступа к административной панели.</p>
        <button
          onClick={() => navigate('/')}
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

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg)', 
      display: 'flex', 
      color: 'var(--text-primary)',
    }}>
      {/* ===== БОКОВОЕ МЕНЮ ===== */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`} style={{
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
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-soft)',
          fontSize: '20px',
          fontWeight: '600',
          color: 'var(--text-primary)',
          fontFamily: "'Playfair Display', serif",
          letterSpacing: '4px',
        }}>
          Syverro
          <span style={{ fontSize: '12px', color: 'var(--primary)', marginLeft: '8px', letterSpacing: '0' }}>
            Admin
          </span>
        </div>

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
            style={{
              padding: '8px 16px',
              background: 'rgba(239, 83, 80, 0.1)',
              border: '1px solid rgba(239, 83, 80, 0.2)',
              borderRadius: '8px',
              color: 'var(--error)',
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
      <div className="admin-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border-soft)',
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
                color: 'var(--text-secondary)',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px',
                display: 'none',
              }}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <span style={{ fontSize: '18px', fontWeight: '300', color: 'var(--text-secondary)' }}>
              {navItems.find(item => isActive(item.path))?.label || 'Dashboard'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={toggleTheme}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

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
          className="admin-overlay"
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