// src/widgets/BookCard.tsx
import type { EnrichedBook } from '../types/book';
import type { UserBook } from '../types/userBook';

interface BookCardProps {
  book: EnrichedBook;
  userBook?: UserBook | null;
  onClick?: () => void;
}

export default function BookCard({ book, userBook, onClick }: BookCardProps) {
  const progress = userBook && book.totalPages > 0
    ? Math.round((userBook.currentPage / book.totalPages) * 100)
    : 0;

  const rereadCount = userBook?.rereadCount || 0;

  return (
    <div
      onClick={onClick}
      style={{
        background: '#121C24',
        borderRadius: '16px',
        border: '1px solid #2A4B60',
        transition: 'all 0.2s ease',
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = '#5B86A1';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(91, 134, 161, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#2A4B60';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Badge "Вернулся" для перечитывания */}
      {rereadCount > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            zIndex: 2,
            padding: '2px 10px',
            fontSize: '10px',
            fontWeight: '500',
            borderRadius: '10px',
            background: 'rgba(139, 92, 246, 0.9)',
            backdropFilter: 'blur(4px)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          Вернулся {rereadCount > 1 && `#${rereadCount}`}
        </div>
      )}

      {/* Обложка */}
      <div
        style={{
          width: '100%',
          aspectRatio: '2/3',
          background: 'linear-gradient(135deg, #1A2832, #0F1A22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {book.cover ? (
          <img
            src={book.cover}
            alt={book.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#5B86A1', padding: '16px' }}>
            <div style={{ fontSize: '48px', marginBottom: '8px', opacity: 0.4 }}>📖</div>
            <div style={{ fontSize: '14px', color: '#97A6BA' }}>{book.title}</div>
          </div>
        )}
      </div>

      {/* Информация */}
      <div style={{ padding: '12px 14px' }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#E6EDF3',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {book.title}
        </div>
        <div
          style={{
            fontSize: '13px',
            color: '#97A6BA',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {book.author}
        </div>

        {/* Прогресс (только для статуса "reading") */}
        {userBook?.status === 'reading' && progress > 0 && (
          <div style={{ marginTop: '6px' }}>
            <div
              style={{
                fontSize: '11px',
                color: '#5B86A1',
                marginBottom: '2px',
              }}
            >
              {progress}%
            </div>
            <div
              style={{
                width: '100%',
                height: '3px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: '#5B86A1',
                  borderRadius: '4px',
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}