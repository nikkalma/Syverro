import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, PenLine, ShieldAlert, ScrollText, Settings } from 'lucide-react';
import type { LocaleData } from '../../../locales';
import { studioPath } from '../../../shared/utils/studioRoutes';
import { ACTIVE_STUDIO_LAUNCHER_MODULES } from '../../../components/Studio/studioNavigation';

interface ModuleCard {
  path: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}

const MODULE_ICONS = {
  users: <Users size={20} />,
  books: <BookOpen size={20} />,
  authors: <PenLine size={20} />,
  moderation: <ShieldAlert size={20} />,
  logs: <ScrollText size={20} />,
  settings: <Settings size={20} />,
};

export const getDashboardModules = (t: LocaleData): ModuleCard[] =>
  ACTIVE_STUDIO_LAUNCHER_MODULES
    .map((key) => ({
      path: studioPath(key),
      icon: MODULE_ICONS[key],
      label: t.admin.nav[key],
      description: t.admin.dashboard.modules[key].description,
    }));

interface Props {
  t: LocaleData;
}

export default function DashboardModuleCards({ t }: Props) {
  const navigate = useNavigate();
  const items = getDashboardModules(t);

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
            e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-soft)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              color: 'var(--primary)',
              background: 'var(--primary-soft)',
              border: '1px solid var(--primary)',
            }}>{mod.icon}</span>
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
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--primary)'; }}
          >
            {t.admin.dashboard.modules.open} →
          </div>
        </div>
      ))}
    </div>
  );
}
