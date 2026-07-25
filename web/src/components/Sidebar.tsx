import { NavLink } from 'react-router-dom';
import {
  BookOpen,
  Users,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

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

const navItems: NavItem[] = [
  { to: '/', label: 'Библиотека', icon: BookOpen },
  { to: '/authors', label: 'Авторы', icon: Users },
];

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
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          style={({ isActive }) => isActive ? activeStyle : linkStyle}
        >
          <item.icon size={18} />
          {item.label}
        </NavLink>
      )}
    </nav>
  );
}
