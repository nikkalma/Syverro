// src/pages/BookPage/BookHeader.tsx
import { EnrichedBook } from '../../types/book';

interface BookHeaderProps {
  book: EnrichedBook;
  isInLibrary: boolean;
  onAddClick: () => void;
  onEditClick: () => void;
}

export function BookHeader({ book, isInLibrary, onAddClick, onEditClick }: BookHeaderProps) {
  return (
    <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
      {/* Обложка */}
      <div style={{ flexShrink: 0 }}>
        <div
          style={{
            width: '200px',
            aspectRatio: '2/3',
            background: 'linear-gradient(135deg, #1A2832, #0F1A22)',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {book.cover ? (
            <img src={book.cover} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '64px',
                opacity: 0.3,
              }}
            >
              📖
            </div>
          )}
        </div>

        {/* Кнопки под обложкой */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          {!isInLibrary ? (
            <button
              onClick={onAddClick}
              style={{
                flex: 1,
                padding: '8px 16px',
                background: '#5B86A1',
                border: 'none',
                borderRadius: '8px',
                color: '#0A1118',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                width: 'auto',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#4A7590')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#5B86A1')}
            >
              + В библиотеку
            </button>
          ) : (
            <span
              style={{
                flex: 1,
                padding: '8px 16px',
                background: 'rgba(91, 134, 161, 0.15)',
                borderRadius: '8px',
                color: '#5B86A1',
                fontSize: '13px',
                textAlign: 'center',
              }}
            >
              ✓ В библиотеке
            </span>
          )}
          <button
            onClick={onEditClick}
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              color: '#97A6BA',
              fontSize: '13px',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              width: 'auto',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = '#E6EDF3';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = '#97A6BA';
            }}
          >
            ✏️
          </button>
        </div>
      </div>

      {/* Основная информация */}
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: '32px', fontWeight: '300', color: '#E6EDF3', marginBottom: '4px' }}>
          {book.title}
        </h1>
        {book.subtitle && (
          <h2 style={{ fontSize: '20px', fontWeight: '300', color: '#97A6BA', marginBottom: '8px' }}>
            {book.subtitle}
          </h2>
        )}
        <p style={{ fontSize: '18px', color: '#97A6BA', marginBottom: '16px' }}>{book.author}</p>
      </div>
    </div>
  );
}