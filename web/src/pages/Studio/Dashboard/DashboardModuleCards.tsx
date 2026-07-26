import { useNavigate } from 'react-router-dom';
import type { LocaleData } from '../../../locales';

interface ModuleCard {
  path: string;
  icon: string;
  label: string;
  description: string;
}

const modules = (t: LocaleData): ModuleCard[] => [
  { path: '/studio/users', icon: '👥', label: t.admin.nav.users, description: t.admin.dashboard.modules.users.description },
  { path: '/studio/books', icon: '📚', label: t.admin.nav.books, description: t.admin.dashboard.modules.books.description },
  { path: '/studio/authors', icon: '✍️', label: t.admin.nav.authors, description: t.admin.dashboard.modules.authors.description },
  { path: '/studio/genres', icon: '🏷️', label: t.admin.nav.genres, description: t.admin.dashboard.modules.genres.description },
  { path: '/studio/taxonomy', icon: '🏛️', label: 'Taxonomy', description: t.admin.dashboard.modules.taxonomy.description },
  { path: '/studio/moderation', icon: '🛡️', label: t.admin.nav.moderation, description: t.admin.dashboard.modules.moderation.description },
  { path: '/studio/metadata', icon: '📝', label: t.admin.nav.metadata, description: t.admin.dashboard.modules.metadata.description },
  { path: '/studio/logs', icon: '📋', label: t.admin.nav.logs, description: t.admin.dashboard.modules.logs.description },
  { path: '/studio/settings', icon: '⚙️', label: t.admin.nav.settings, description: t.admin.dashboard.modules.settings.description },
];

interface Props {
  t: LocaleData;
}

export default function DashboardModuleCards({ t }: Props) {
  const navigate = useNavigate();
  const items = modules(t);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '16px',
    }}>
      {items.map((mod) => (
        <div
          key={mod.path}
          onClick={() => navigate(mod.path)}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-soft)',
            borderRadius: '14px',
            padding: '24px',
            cursor: 'pointer',
            transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-soft)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>{mod.icon}</span>
            <span style={{
              fontSize: '16px',
              fontWeight: '500',
              color: 'var(--text-primary)',
            }}>
              {mod.label}
            </span>
          </div>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            margin: 0,
            lineHeight: 1.5,
            fontStyle: 'italic',
          }}>
            {mod.description}
          </p>
          <div style={{
            marginTop: 'auto',
            alignSelf: 'flex-start',
            padding: '6px 16px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            color: 'var(--primary)',
            border: '1px solid var(--primary)',
            background: 'transparent',
            transition: 'background 0.2s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#0A1118'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--primary)'; }}
          >
            {t.admin.dashboard.modules.open} →
          </div>
        </div>
      ))}
    </div>
  );
}
