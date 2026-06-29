// src/pages/Profile/ReaderIdentitySection/MyRoots.tsx
import { LocaleData } from '../../../locales';

interface MyRootsProps {
  profile: any;
  t: LocaleData;
}

export function MyRoots({ profile, t }: MyRootsProps) {
  const hasData = profile.favoriteEras?.length || profile.favoriteAuthors?.length;

  return (
    <div
      style={{
        background: 'var(--surface-alt)',
        borderRadius: '12px',
        border: '1px solid var(--border-soft)',
        padding: '16px 20px',
        height: '100%',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '12px',
        }}
      >
        Мои корни
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '6px' }}>
          (века, авторы)
        </span>
      </div>

      {hasData ? (
        <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
          {profile.favoriteEras?.length > 0 && (
            <div style={{ marginBottom: '4px' }}>
              {profile.favoriteEras
                .map((era: string) => t.taxonomy.eras?.[era] || era)
                .join(' • ')}
            </div>
          )}
          {profile.favoriteAuthors?.length > 0 && (
            <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
              {profile.favoriteAuthors.join(' • ')}
            </div>
          )}
        </div>
      ) : (
        <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Не заполнено</div>
      )}
    </div>
  );
}