import { NavLink, useLocation } from 'react-router-dom';
import { getLocaleData, getBrowserLocale } from '../../../../locales';

type Group = { key: string; label: string; sections: readonly string[] };

const GROUPS: Group[] = [
  { key: 'author-data', label: 'Author data', sections: ['overview', 'identity', 'biography', 'timeline', 'works', 'publications', 'quotes', 'media', 'seo'] },
  { key: 'research', label: 'Research & SyvAI', sections: ['research', 'discovery', 'sources', 'fill', 'proposals'] },
  { key: 'readiness', label: 'Readiness', sections: ['readiness'] },
];

const OPERATOR_LABELS: Record<string, string> = {
  works: 'Linked books', seo: 'Links & SEO', research: 'Overview', discovery: 'Find sources',
  sources: 'Sources', fill: 'Fill', proposals: 'Proposals & history', readiness: 'Publication status',
};

const navLink = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  padding: '8px 14px', borderRadius: '8px', textDecoration: 'none', whiteSpace: 'nowrap',
  fontSize: '13px', fontWeight: isActive ? 600 : 400,
  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
  background: isActive ? 'var(--glass-bg)' : 'transparent',
  border: `1px solid ${isActive ? 'var(--border-soft)' : 'transparent'}`,
});

export default function AuthorEditorNavigation({ basePath }: { basePath: string }) {
  const location = useLocation();
  const t = getLocaleData(getBrowserLocale());
  const current = location.pathname.split('/').filter(Boolean).at(-1) || 'overview';
  const normalizedCurrent = current === 'ai' ? 'proposals' : current;
  const activeGroup = GROUPS.find((group) => group.sections.includes(normalizedCurrent)) || GROUPS[0];
  const labels = t.admin.authors.editor.sections as Record<string, string>;

  return (
    <nav aria-label="Author editor workflow" style={{ position: 'sticky', top: 0, zIndex: 30, background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div aria-label="Author editor groups" style={{ display: 'flex', gap: '6px', padding: '10px clamp(16px, 3vw, 28px)', overflowX: 'auto' }}>
        {GROUPS.map((group) => (
          <NavLink key={group.key} to={`${basePath}/${group.sections[0]}`} style={() => navLink({ isActive: group.key === activeGroup.key })}>
            {group.label}
          </NavLink>
        ))}
      </div>
      <div aria-label={`${activeGroup.label} sections`} style={{ display: 'flex', gap: '4px', padding: '0 clamp(16px, 3vw, 28px) 10px', overflowX: 'auto' }}>
        {activeGroup.sections.map((section) => (
          <NavLink key={section} to={`${basePath}/${section}`} style={navLink}>
            {OPERATOR_LABELS[section] || labels[section] || section}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
