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
    <div className="min-h-screen bg-[#0A1118] flex flex-col">
      {/* Хедер */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#0A1118]/95 backdrop-blur-sm border-b border-[#2A4B60] flex items-center justify-between px-8 z-50">
        <h1 className="text-2xl font-light text-[#E6EDF3]">Syverro</h1>
        <nav className="flex gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
                location.pathname === item.path
                  ? 'bg-[#5B86A1]/20 text-[#5B86A1]'
                  : 'text-[#97A6BA] hover:text-[#E6EDF3] hover:bg-[#2A4B60]/30'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </header>

      {/* Основной контент */}
      <main className="flex-1 pt-20 px-8 pb-8 max-w-[1440px] mx-auto w-full">
        {children}
      </main>
    </div>
  );
}