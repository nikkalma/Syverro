// src/components/Layout.tsx

import { ReactNode, useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  BookOpen, 
  Globe, 
  User, 
  Settings, 
  LogOut, 
  Shield, 
  Sun, 
  Moon,
  Menu,
  LayoutDashboard,
  Sparkles,
  UserCircle,
  Crown
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('syverro_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('syverro_theme', theme);
  }, [theme]);

  const isAdmin = user?.role === 'owner' || user?.role === 'admin' || user?.role === 'moderator';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const isProfileActive = location.pathname === '/profile' || location.pathname === '/settings';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      color: 'var(--text-primary)',
    }}>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid var(--border-soft)',
        background: 'var(--surface)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        flexShrink: 0,
      }}>
        <div
          onClick={() => navigate('/')}
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '28px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            letterSpacing: '6px',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <BookOpen size={28} color="var(--primary)" />
          Syverro
        </div>

        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
          fontSize: '15px',
          flexWrap: 'nowrap',
        }}>
          <span
            onClick={() => navigate('/insights')}
            style={{
              color: location.pathname === '/insights' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'color 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={18} />
            Инсайты
          </span>
          <span
            onClick={() => navigate('/worldmap')}
            style={{
              color: location.pathname === '/worldmap' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'color 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Globe size={18} />
            Карта миров
          </span>
        </nav>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          minWidth: '120px',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px 8px',
              transition: 'color 0.2s',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {user ? (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <span
                onClick={toggleDropdown}
                style={{
                  color: isProfileActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '15px',
                  transition: 'color 0.2s',
                }}
              >
                <User size={18} />
                Профиль ▾
              </span>

              {isDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: 'var(--surface)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-soft)',
                  padding: '8px 0',
                  minWidth: '200px',
                  boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
                  zIndex: 100,
                }}>
                  <div
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate('/profile');
                    }}
                    style={{
                      padding: '10px 20px',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <UserCircle size={18} />
                    Мой мир
                  </div>

                  {isAdmin && (
                    <div
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate('/admin');
                      }}
                      style={{
                        padding: '10px 20px',
                        color: 'var(--primary)',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(91,134,161,0.1)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Crown size={18} />
                      Админка
                    </div>
                  )}

                  <div
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate('/settings');
                    }}
                    style={{
                      padding: '10px 20px',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Settings size={18} />
                    Настройки
                  </div>

                  <div style={{ height: '1px', background: 'var(--border-soft)', margin: '4px 12px' }} />

                  <div
                    onClick={handleLogout}
                    style={{
                      padding: '10px 20px',
                      color: 'var(--error)',
                      fontSize: '14px',
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,83,80,0.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <LogOut size={18} />
                    Выйти
                  </div>
                </div>
              )}
            </div>
          ) : (
            <span
              onClick={() => navigate('/login')}
              style={{
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '15px',
                fontFamily: 'Inter, sans-serif',
                transition: 'color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <User size={18} />
              Начать путь
            </span>
          )}
        </div>
      </header>
      <div style={{ flex: 1, background: 'var(--bg)' }}>{children}</div>
    </div>
  );
}