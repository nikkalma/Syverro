// src/components/Layout.tsx
import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B1220',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* ===== ХЕДЕР — ТОТ САМЫЙ, ЧТО РАБОТАЛ ===== */}
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
        <div
          onClick={() => navigate('/')}
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '28px',
            fontWeight: '600',
            color: '#E6EDF3',
            letterSpacing: '6px', // увеличенное расстояние между буквами
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          Syverro
        </div>

        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
          fontSize: '15px',
          flexWrap: 'nowrap',
        }}>
          {navItems.map((item) => (
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
          ))}
        </nav>

        <div style={{ width: '120px' }} />
      </header>

      {/* ===== КОНТЕНТ ===== */}
      <div style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  );
}