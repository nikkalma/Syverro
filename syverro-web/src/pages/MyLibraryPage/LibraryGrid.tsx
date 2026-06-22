// src/pages/MyLibraryPage/LibraryGrid.tsx
import { EnrichedBook } from '../../types/book';
import { UserBook } from '../../types/userBook';
import { statusLabels, UserBookStatus } from '../../types/userBook';
import { useLibraryStore } from '../../store/libraryStore';

interface LibraryGridProps {
  books: EnrichedBook[];
  onBookClick: (bookId: string) => void;
}

export default function LibraryGrid({ books, onBookClick }: LibraryGridProps) {
  const userBooks = useLibraryStore((state: { userBooks: UserBook[] }) => state.userBooks);
  const userBookMap = new Map(userBooks.map((ub: UserBook) => [ub.bookId, ub]));

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '20px',
      }}
    >
      {books.map((book: EnrichedBook) => {
        const userBook = userBookMap.get(book.id);
        if (!userBook) return null;

        const progress = book.totalPages > 0
          ? Math.round((userBook.currentPage / book.totalPages) * 100)
          : 0;

        return (
          <div
            key={book.id}
            onClick={() => onBookClick(book.id)}
            style={{
              background: 'rgba(18, 28, 36, 0.6)',
              backdropFilter: 'blur(8px)',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.06)',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div
              style={{
                width: '100%',
                aspectRatio: '2/3',
                background: 'linear-gradient(135deg, rgba(26,40,50,0.8), rgba(15,26,34,0.8))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {book.cover ? (
                <img
                  src={book.cover}
                  alt={book.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '48px', opacity: 0.3 }}>📖</span>
              )}

              <span
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  padding: '2px 10px',
                  fontSize: '10px',
                  borderRadius: '12px',
                  background: 'rgba(0,0,0,0.7)',
                  backdropFilter: 'blur(4px)',
                  color: '#E6EDF3',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {statusLabels[userBook.status as UserBookStatus]}
              </span>

              {userBook.status === 'reading' && progress > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'rgba(255,255,255,0.1)',
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: '#5B86A1',
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
              )}
            </div>

            <div style={{ padding: '12px' }}>
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
            </div>
          </div>
        );
      })}
    </div>
  );
}