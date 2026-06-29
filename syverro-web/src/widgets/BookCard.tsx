// src/widgets/BookCard.tsx
import type { EnrichedBook } from '../types/book';
import type { UserBook } from '../types/userBook';
import { BookOpen, CheckCircle, RotateCcw } from 'lucide-react';

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
        background: 'var(--card)',
        borderRadius: '16px',
        border: '1px solid var(--border-soft)',
        transition: 'all 0.2s ease',
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
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
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <RotateCcw size={12} />
          Вернулся {rereadCount > 1 && `#${rereadCount}`}
        </div>
      )}

      <div
        style={{
          width: '100%',
          aspectRatio: '2/3',
          background: 'linear-gradient(135deg, var(--surface-alt), var(--bg))',
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
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px' }}>
            <BookOpen size={48} style={{ opacity: 0.4, marginBottom: '8px' }} />
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{book.title}</div>
          </div>
        )}
      </div>

      <div style={{ padding: '12px 14px' }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--text-primary)',
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
            color: 'var(--text-secondary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {book.author}
        </div>

        {userBook?.status === 'reading' && progress > 0 && (
          <div style={{ marginTop: '6px' }}>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--primary)',
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
                  background: 'var(--primary)',
                  borderRadius: '4px',
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        )}

        {userBook?.status === 'completed' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '6px',
              fontSize: '11px',
              color: 'var(--success)',
            }}
          >
            <CheckCircle size={14} />
            Прочитано
          </div>
        )}
      </div>
    </div>
  );
}