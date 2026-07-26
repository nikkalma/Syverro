import { NavLink, Outlet } from 'react-router-dom';
import { getLocaleData, getBrowserLocale } from '../../../locales';

const tabStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  background: 'none',
  border: 'none',
  padding: '8px 20px',
  fontFamily: 'Inter, sans-serif',
  fontSize: '13px',
  fontWeight: isActive ? '500' : '400',
  letterSpacing: '0.02em',
  cursor: 'pointer',
  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
  borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
  textDecoration: 'none',
  transition: 'color 0.2s, border-color 0.2s',
  marginBottom: '-1px',
});

export default function AdminAuthorsLayout() {
  const t = getLocaleData(getBrowserLocale());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '1px solid var(--border-soft)',
      }}>
        <NavLink to="/admin/authors/list" style={tabStyle} end>
          {t.admin.authors.title}
        </NavLink>
        <NavLink to="/admin/authors/new" style={tabStyle}>
          {t.admin.authors.newAuthor}
        </NavLink>
      </div>
      <Outlet />
    </div>
  );
}
