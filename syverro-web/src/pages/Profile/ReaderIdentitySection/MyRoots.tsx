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
        background: 'rgba(18, 28, 36, 0.5)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '16px 20px',
        height: '100%',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          color: '#5B86A1',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '12px',
        }}
      >
        Мои корни
        <span style={{ fontSize: '10px', color: '#2A4B60', marginLeft: '6px' }}>
          (века, авторы)
        </span>
      </div>

      {hasData ? (
        <div style={{ fontSize: '13px', color: '#E6EDF3' }}>
          {profile.favoriteEras?.length > 0 && (
            <div style={{ marginBottom: '4px' }}>
              {profile.favoriteEras
                .map((era: string) => t.taxonomy.eras?.[era] || era)
                .join(' • ')}
            </div>
          )}
          {profile.favoriteAuthors?.length > 0 && (
            <div style={{ color: '#97A6BA', fontSize: '12px' }}>
              {profile.favoriteAuthors.join(' • ')}
            </div>
          )}
        </div>
      ) : (
        <div style={{ color: '#5B86A1', fontSize: '12px' }}>Не заполнено</div>
      )}
    </div>
  );
}