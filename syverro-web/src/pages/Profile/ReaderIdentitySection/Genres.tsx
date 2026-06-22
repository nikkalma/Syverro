// src/pages/Profile/ReaderIdentitySection/Genres.tsx
import { LocaleData } from '../../../locales';

interface GenresProps {
  profile: any;
  t: LocaleData;
}

export function Genres({ profile, t }: GenresProps) {
  const genres = profile.favoriteGenres || [];

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
        Жанры
      </div>

      {genres.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px 8px',
            fontSize: '13px',
            color: '#E6EDF3',
          }}
        >
          {genres.map((g: string) => (
            <span key={g}>{g}</span>
          ))}
        </div>
      ) : (
        <div style={{ color: '#5B86A1', fontSize: '12px' }}>Не заполнено</div>
      )}
    </div>
  );
}