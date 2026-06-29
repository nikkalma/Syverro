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
        Жанры
      </div>

      {genres.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px 8px',
            fontSize: '13px',
            color: 'var(--text-primary)',
          }}
        >
          {genres.map((g: string) => (
            <span key={g}>{g}</span>
          ))}
        </div>
      ) : (
        <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Не заполнено</div>
      )}
    </div>
  );
}