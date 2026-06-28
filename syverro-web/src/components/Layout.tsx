// src/components/Layout.tsx

import { ReactNode, useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
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
    <div style={{ minHeight: '100vh', background: '#0B1220', display: 'flex', flexDirection: 'column' }}>
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

        {/* ===== НАВИГАЦИЯ (ТОЛЬКО ИНСАЙТЫ И КАРТА МИРОВ) ===== */}
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
              color: location.pathname === '/insights' ? '#E6EDF3' : '#97A6BA',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'color 0.2s',
            }}
          >
            Инсайты
          </span>
          <span
            onClick={() => navigate('/worldmap')}
            style={{
              color: location.pathname === '/worldmap' ? '#E6EDF3' : '#97A6BA',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'color 0.2s',
            }}
          >
            Карта миров
          </span>
        </nav>

        {/* ===== ПРАВАЯ ЧАСТЬ ===== */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          minWidth: '120px',
          justifyContent: 'flex-end',
        }}>
          {user ? (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <span
                onClick={toggleDropdown}
                style={{
                  color: isProfileActive ? '#E6EDF3' : '#97A6BA',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '15px',
                  transition: 'color 0.2s',
                }}
              >
                Профиль ▾
              </span>

              {isDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: 'rgba(18, 28, 36, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '8px 0',
                  minWidth: '180px',
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
                      color: '#E6EDF3',
                      fontSize: '14px',
                      cursor: 'pointer',
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
                      fontFamily: 'Inter, sans-serif',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    ⚙️ Настройки
                  </div>
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 12px' }} />
                  <div
                    onClick={handleLogout}
                    style={{
                      padding: '10px 20px',
                      color: '#EF5350',
                      fontSize: '14px',
                      cursor: 'pointer',
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
          ) : (
            <span
              onClick={() => navigate('/login')}
              style={{
                color: '#97A6BA',
                cursor: 'pointer',
                fontSize: '15px',
                fontFamily: 'Inter, sans-serif',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#E6EDF3'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#97A6BA'; }}
            >
              Начать путь
            </span>
          )}
        </div>
      </header>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}