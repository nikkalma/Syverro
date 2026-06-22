import { Tag } from './Tag';
import { LocaleData } from '../../../../locales';

interface LiteraryCardProps {
  profile: any;
  t: LocaleData;
}

export function LiteraryCard({ profile, t }: LiteraryCardProps) {
  const hasData = profile.favoriteGenres?.length || profile.favoriteThemes?.length ||
                  profile.favoriteVibes?.length || profile.favoriteAuthors?.length ||
                  profile.favoriteEras?.length || profile.favoriteLiteraryCountries?.length;

  if (!hasData) return null;

  const getLabel = (key: string, dict: Record<string, string>): string => {
    return dict[key] || key;
  };

  const hasVibes = profile.favoriteVibes?.length > 0;
  const hasGenres = profile.favoriteGenres?.length > 0;
  const hasThemes = profile.favoriteThemes?.length > 0;

  return (
    <div
      style={{
        background: 'rgba(18, 28, 36, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '20px',
      }}
    >
      <h3 style={{ fontSize: '13px', color: '#5B86A1', fontWeight: '500', marginBottom: '16px' }}>
        Reading Taste
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {hasVibes && (
          <div>
            <div style={{ fontSize: '11px', color: '#97A6BA', marginBottom: '6px' }}>{t.favoriteVibes}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {profile.favoriteVibes.map((key: string) => (
                <Tag key={key}>{getLabel(key, t.taxonomy.vibe)}</Tag>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {hasGenres && (
            <div>
              <div style={{ fontSize: '11px', color: '#97A6BA', marginBottom: '6px' }}>{t.favoriteGenres}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {profile.favoriteGenres.map((genre: string) => (
                  <Tag key={genre}>{genre}</Tag>
                ))}
              </div>
            </div>
          )}

          {hasThemes && (
            <div>
              <div style={{ fontSize: '11px', color: '#97A6BA', marginBottom: '6px' }}>{t.favoriteThemes}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {profile.favoriteThemes.map((key: string) => (
                  <Tag key={key}>{getLabel(key, t.taxonomy.theme)}</Tag>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '4px' }}>
          {profile.favoriteAuthors?.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', color: '#97A6BA', marginBottom: '4px' }}>{t.favoriteAuthors}</div>
              <div style={{ fontSize: '13px', color: '#E6EDF3' }}>
                {profile.favoriteAuthors.join(', ')}
              </div>
            </div>
          )}

          {profile.favoriteEras?.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', color: '#97A6BA', marginBottom: '4px' }}>{t.favoriteEras}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {profile.favoriteEras.map((era: string) => (
                  <Tag key={era}>{era}</Tag>
                ))}
              </div>
            </div>
          )}

          {profile.favoriteLiteraryCountries?.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', color: '#97A6BA', marginBottom: '4px' }}>{t.favoriteLiteraryCountries}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {profile.favoriteLiteraryCountries.map((country: string) => (
                 <Tag key={country}>
  {t.taxonomy.countries?.[country] || country}
</Tag>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}