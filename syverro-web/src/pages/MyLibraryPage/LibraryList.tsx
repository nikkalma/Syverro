// src/pages/MyLibraryPage/LibraryList.tsx
import { EnrichedBook } from '../../types/book';
import { UserBook } from '../../types/userBook';
import { statusLabels, UserBookStatus } from '../../types/userBook';
import { useLibraryStore } from '../../store/libraryStore';

interface LibraryListProps {
  books: EnrichedBook[];
  onBookClick: (bookId: string) => void;
}

export default function LibraryList({ books, onBookClick }: LibraryListProps) {
  const userBooks = useLibraryStore((state: { userBooks: UserBook[] }) => state.userBooks);
  const userBookMap = new Map(userBooks.map((ub: UserBook) => [ub.bookId, ub]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '12px 16px',
              background: 'rgba(18, 28, 36, 0.4)',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.04)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(18, 28, 36, 0.7)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(18, 28, 36, 0.4)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
            }}
          >
            <div
              style={{
                width: '40px',
                height: '60px',
                flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(26,40,50,0.8), rgba(15,26,34,0.8))',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                opacity: 0.5,
              }}
            >
              📖
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '15px',
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

            <span
              style={{
                padding: '2px 12px',
                fontSize: '12px',
                borderRadius: '12px',
                background: 'rgba(91, 134, 161, 0.15)',
                color: '#5B86A1',
                flexShrink: 0,
              }}
            >
              {statusLabels[userBook.status as UserBookStatus]}
            </span>

            {userBook.status === 'reading' && progress > 0 && (
              <span
                style={{
                  fontSize: '12px',
                  color: '#5B86A1',
                  flexShrink: 0,
                  minWidth: '40px',
                  textAlign: 'right',
                }}
              >
                {progress}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}