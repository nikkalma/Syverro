import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', label: 'Библиотека', icon: '📚' },
  { path: '/insights', label: 'Инсайты', icon: '💡' },
  { path: '/worldmap', label: 'Карта миров', icon: '🗺️' },
  { path: '/profile', label: 'Профиль', icon: '👤' },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0A1118',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Хедер */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '64px',
          background: 'rgba(10, 17, 24, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #2A4B60',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          zIndex: 100,
        }}
      >
        <div>
          <h1 style={{ color: '#E6EDF3', fontSize: '1.5rem', margin: 0 }}>Syverro</h1>
        </div>
        <nav style={{ display: 'flex', gap: '24px' }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: location.pathname === item.path ? '#5B86A1' : '#97A6BA',
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: '12px',
                background: location.pathname === item.path ? 'rgba(90, 134, 161, 0.15)' : 'transparent',
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </header>

      {/* Основной контент — растягиваем на всю ширину */}
      <main style={{ 
        paddingTop: '80px',
        paddingLeft: '32px',
        paddingRight: '32px',
        paddingBottom: '40px',
        width: '100%',
        maxWidth: '1440px',
        margin: '0 auto',
        flex: 1,
      }}>
        {children}
      </main>
    </div>
  );
}