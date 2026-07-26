import { NavLink } from 'react-router-dom';

interface Section {
  path: string;
  label: string;
}

interface Props {
  sections: Section[];
  basePath: string;
}

const linkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '10px 20px',
  fontSize: '13px',
  fontWeight: isActive ? '600' : '400',
  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
  background: isActive ? 'var(--glass-bg)' : 'transparent',
  borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
  borderRadius: '4px 4px 0 0',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  transition: 'color 0.2s, background 0.2s, border-color 0.2s',
  marginBottom: '-1px',
});

export default function EditorSectionNav({ sections, basePath }: Props) {
  return (
    <div style={{
      display: 'flex',
      gap: '2px',
      overflowX: 'auto',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      borderBottom: '1px solid var(--border-soft)',
      background: 'var(--surface)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      scrollbarWidth: 'thin',
      WebkitOverflowScrolling: 'touch',
    }}>
      {sections.map((s) => (
        <NavLink key={s.path} to={`${basePath}/${s.path}`} style={linkStyle} end={s.path === 'overview'}>
          {s.label}
        </NavLink>
      ))}
    </div>
  );
}
