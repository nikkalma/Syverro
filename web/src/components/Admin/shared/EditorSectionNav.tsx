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
  padding: '8px 18px',
  fontSize: '13px',
  fontWeight: isActive ? '500' : '400',
  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
  borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  transition: 'color 0.2s, border-color 0.2s',
});

export default function EditorSectionNav({ sections, basePath }: Props) {
  return (
    <div style={{
      display: 'flex',
      gap: '2px',
      overflowX: 'auto',
      borderBottom: '1px solid var(--border-soft)',
      background: 'var(--surface)',
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
