// src/pages/BookPage/BookMeta.tsx
import { EnrichedBook } from '../../types/book';
import { getLocaleData, getBrowserLocale } from '../../locales';

interface BookMetaProps {
  book: EnrichedBook;
}

const translateKey = (key: string, dict: Record<string, string>): string => {
  return dict[key] || key;
};

export function BookMeta({ book }: BookMetaProps) {
  const locale = getBrowserLocale();
  const t = getLocaleData(locale);

  return (
    <>
      {/* Жанры */}
      {book.genres && book.genres.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {book.genres.map((genre) => (
            <span
              key={genre}
              style={{
                padding: '4px 12px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '20px',
                fontSize: '13px',
                color: '#97A6BA',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {genre}
            </span>
          ))}
        </div>
      )}

      {/* Метаданные */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        {book.authorCountry && (
          <span
            style={{
              padding: '4px 12px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              fontSize: '13px',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#97A6BA',
            }}
          >
            🌍 {book.authorCountry}
          </span>
        )}
        {book.originalYear && (
          <span
            style={{
              padding: '4px 12px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              fontSize: '13px',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#97A6BA',
            }}
          >
            📅 {book.originalYear}
          </span>
        )}
        {book.totalPages && (
          <span
            style={{
              padding: '4px 12px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              fontSize: '13px',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#97A6BA',
            }}
          >
            📖 {book.totalPages} стр.
          </span>
        )}
        {book.originalLanguage && (
          <span
            style={{
              padding: '4px 12px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              fontSize: '13px',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#97A6BA',
            }}
          >
            🌐 {book.originalLanguage}
          </span>
        )}
      </div>

      {/* Поджанры — с переводом */}
      {book.subgenres && book.subgenres.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h3 style={{ fontSize: '14px', color: '#5B86A1', marginBottom: '8px' }}>🏷️ Поджанры</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {book.subgenres.map((subgenre) => (
              <span
                key={subgenre}
                style={{
                  padding: '2px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '16px',
                  fontSize: '12px',
                  color: '#97A6BA',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {translateKey(subgenre, t.taxonomy.vibe) || subgenre}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Вайб */}
      {book.vibe && book.vibe.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h3 style={{ fontSize: '14px', color: '#5B86A1', marginBottom: '8px' }}>🌊 Вайб</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {book.vibe.map((vibeKey) => (
              <span
                key={vibeKey}
                style={{
                  padding: '2px 12px',
                  background: 'rgba(91, 134, 161, 0.1)',
                  borderRadius: '16px',
                  fontSize: '12px',
                  color: '#5B86A1',
                  border: '1px solid rgba(91, 134, 161, 0.15)',
                }}
              >
                {translateKey(vibeKey, t.taxonomy.vibe)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Темы */}
      {book.themes && book.themes.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h3 style={{ fontSize: '14px', color: '#5B86A1', marginBottom: '8px' }}>💭 Темы</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {book.themes.map((themeKey) => (
              <span
                key={themeKey}
                style={{
                  padding: '2px 12px',
                  background: 'rgba(251, 191, 36, 0.08)',
                  borderRadius: '16px',
                  fontSize: '12px',
                  color: '#FBBF24',
                  border: '1px solid rgba(251, 191, 36, 0.15)',
                }}
              >
                {translateKey(themeKey, t.taxonomy.theme)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Мотивы */}
      {book.motifs && book.motifs.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h3 style={{ fontSize: '14px', color: '#5B86A1', marginBottom: '8px' }}>🌀 Мотивы</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {book.motifs.map((motifKey) => (
              <span
                key={motifKey}
                style={{
                  padding: '2px 12px',
                  background: 'rgba(236, 72, 153, 0.08)',
                  borderRadius: '16px',
                  fontSize: '12px',
                  color: '#EC4899',
                  border: '1px solid rgba(236, 72, 153, 0.15)',
                }}
              >
                {translateKey(motifKey, t.taxonomy.motif)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Настроение */}
      {book.mood && book.mood.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h3 style={{ fontSize: '14px', color: '#5B86A1', marginBottom: '8px' }}>🎭 Настроение</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {book.mood.map((moodKey) => (
              <span
                key={moodKey}
                style={{
                  padding: '2px 12px',
                  background: 'rgba(168, 85, 247, 0.08)',
                  borderRadius: '16px',
                  fontSize: '12px',
                  color: '#A855F7',
                  border: '1px solid rgba(168, 85, 247, 0.15)',
                }}
              >
                {translateKey(moodKey, t.taxonomy.mood)}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}