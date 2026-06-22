// src/widgets/BookCard.tsx
import type { EnrichedBook } from '../types/book';

interface BookCardProps {
  book: EnrichedBook;
  onClick?: () => void;
}

export default function BookCard({ book, onClick }: BookCardProps) {
  return (
    <div 
      onClick={onClick}
      style={{ 
        background: '#121C24', 
        borderRadius: '16px', 
        border: '1px solid #2A4B60',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#5B86A1';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(91, 134, 161, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#2A4B60';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* ОБЛОЖКА — если есть cover, показываем картинку, иначе иконку */}
      <div style={{
        width: '100%',
        aspectRatio: '2/3',
        background: 'linear-gradient(135deg, #1A2832, #0F1A22)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
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

      {/* ИНФОРМАЦИЯ */}
      <div style={{ padding: '16px' }}>
        <div style={{ fontSize: '15px', fontWeight: '500', color: '#E6EDF3', marginBottom: '4px', lineHeight: '1.5' }}>
          {book.title}
        </div>
        <div style={{ fontSize: '14px', color: '#97A6BA', lineHeight: '1.5' }}>
          {book.author}
        </div>

        {book.averageRating && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#FBBF24', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>⭐</span>
            <span>{book.averageRating.toFixed(1)}</span>
            <span style={{ fontSize: '10px', color: '#5B86A1' }}>({book.totalRatings})</span>
          </div>
        )}

        {book.genres && book.genres.length > 0 && (
          <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {book.genres.slice(0, 3).map((genre) => (
              <span key={genre} style={{ fontSize: '11px', color: '#5B86A1', background: '#0A1118', padding: '2px 10px', borderRadius: '10px', border: '1px solid #1A2832' }}>
                {genre}
              </span>
            ))}
            {book.genres.length > 3 && (
              <span style={{ fontSize: '11px', color: '#5B86A1' }}>+{book.genres.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}