import { NavLink } from 'react-router-dom';
import {
  BookOpen,
  Users,
  Tags,
  Wind,
  UserCircle,
  Globe,
  Quote,
  Layers,
  StickyNote,
} from 'lucide-react';

const disabledStyle: React.CSSProperties = {
  ...linkStyle,
  opacity: 0.4,
  cursor: 'not-allowed',
  pointerEvents: 'none',
};

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Библиотека', icon: BookOpen },
  { to: '/authors', label: 'Авторы', icon: Users },
  { to: '/genres-themes', label: 'Жанры и темы', icon: Tags },
  { to: '/atmospheres', label: 'Атмосферы', icon: Wind },
  { to: '/characters', label: 'Персонажи', icon: UserCircle },
  { to: '/worldmap', label: 'Миры', icon: Globe },
  { to: '/quotes', label: 'Цитаты', icon: Quote },
  { to: '/collections', label: 'Коллекции', icon: Layers },
  { to: '/my-library', label: 'Мои заметки', icon: StickyNote, disabled: true },
];

const linkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '14px',
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  fontFamily: 'Inter, sans-serif',
  transition: 'background 0.2s, color 0.2s',
};

const activeStyle: React.CSSProperties = {
  ...linkStyle,
  color: 'var(--text-primary)',
  background: 'rgba(91,134,161,0.1)',
};

export default function Sidebar() {
  return (
    <nav style={{
      width: '220px',
      flexShrink: 0,
      padding: '20px 12px',
      borderRight: '1px solid var(--border-soft)',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      overflowY: 'auto',
    }}>
      {navItems.map((item) =>
        item.disabled ? (
          <div key={item.to} style={disabledStyle} title="Скоро">
            <item.icon size={18} />
            {item.label}
            <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-muted)' }}>скоро</span>
          </div>
        ) : (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => isActive ? activeStyle : linkStyle}
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        )
      )}
    </nav>
  );
}
