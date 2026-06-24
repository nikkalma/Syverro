// src/components/Layout.tsx

import { ReactNode, useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/insights', label: 'Инсайты' },
  { path: '/worldmap', label: 'Карта миров' },
  { path: '/profile', label: 'Профиль' },
];

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore((state) => ({
    user: state.user,
    logout: state.logout,
  }));
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      background: '#0B1220',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid #1A2832',
        background: '#0B1220',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        flexShrink: 0,
      }}>
        {/* ЛОГО */}
        <div
          onClick={() => navigate('/')}
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '28px',
            fontWeight: '600',
            color: '#E6EDF3',
            letterSpacing: '6px',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          Syverro
        </div>

        {/* НАВИГАЦИЯ */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
          fontSize: '15px',
          flexWrap: 'nowrap',
          position: 'relative',
        }}>
          {navItems.map((item) => {
            // Для "Профиль" — делаем выпадающее меню
            if (item.path === '/profile') {
              return (
                <div
                  key={item.path}
                  ref={dropdownRef}
                  style={{ position: 'relative' }}
                >
                  <span
                    onClick={toggleDropdown}
                    style={{
                      color: isProfileActive ? '#E6EDF3' : '#97A6BA',
                      fontWeight: isProfileActive ? '500' : '400',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'color 0.2s',
                      fontFamily: 'Inter, sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    Профиль ▾
                  </span>

                  {isDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginTop: '8px',
                        background: 'rgba(18, 28, 36, 0.95)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        padding: '8px 0',
                        minWidth: '180px',
                        boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
                        zIndex: 100,
                      }}
                    >
                      <div
                        onClick={() => {
                          setIsDropdownOpen(false);
                          navigate('/profile');
                        }}
                        style={{
                          padding: '10px 20px',
                          color: '#E6EDF3',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                          fontFamily: 'Inter, sans-serif',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        🌍 Мой мир
                      </div>
                      <div
                        onClick={() => {
                          setIsDropdownOpen(false);
                          navigate('/settings');
                        }}
                        style={{
                          padding: '10px 20px',
                          color: '#E6EDF3',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                          fontFamily: 'Inter, sans-serif',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        ⚙️ Настройки
                      </div>
                      <div
                        style={{
                          height: '1px',
                          background: 'rgba(255,255,255,0.06)',
                          margin: '4px 12px',
                        }}
                      />
                      <div
                        onClick={handleLogout}
                        style={{
                          padding: '10px 20px',
                          color: '#EF5350',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                          fontFamily: 'Inter, sans-serif',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,83,80,0.1)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        🚪 Выйти
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // Остальные пункты
            return (
              <span
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  color: location.pathname === item.path ? '#E6EDF3' : '#97A6BA',
                  fontWeight: location.pathname === item.path ? '500' : '400',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.2s',
                  fontFamily: 'Inter, sans-serif',
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== item.path) {
                    e.currentTarget.style.color = '#E6EDF3';
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== item.path) {
                    e.currentTarget.style.color = '#97A6BA';
                  }
                }}
              >
                {item.label}
              </span>
            );
          })}
        </nav>

        {/* ===== ПРАВАЯ ЧАСТЬ: КНОПКА "НАЧАТЬ ПУТЬ" ===== */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          minWidth: '120px',
          justifyContent: 'flex-end',
        }}>
          {user ? (
            // Если пользователь авторизован — показываем email и кнопку выхода
            <>
              <span style={{
                color: '#97A6BA',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
              }}>
                {user.email}
              </span>
            </>
          ) : (
            // Если не авторизован — кнопка "Начать путь"
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '8px 20px',
                background: 'linear-gradient(135deg, #5B86A1, #4A6F8A)',
                border: 'none',
                borderRadius: '20px',
                color: '#0A1118',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'Inter, sans-serif',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(91, 134, 161, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              🚀 Начать путь
            </button>
          )}
        </div>
      </header>

      <div style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  );
}