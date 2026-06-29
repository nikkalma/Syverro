// src/widgets/BookGrid.tsx
import BookCard from './BookCard';
import type { EnrichedBook } from '../types/book';
import type { UserBook } from '../types/userBook';

interface BookGridProps {
  books: EnrichedBook[];
  userBooks?: UserBook[];
  onBookClick?: (bookId: string) => void;
}

export default function BookGrid({ books, userBooks = [], onBookClick }: BookGridProps) {
  const userBookMap = new Map(userBooks.map((ub) => [ub.bookId, ub]));

  if (books.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
        Книг не найдено
      </div>
    );
  }

  return (
    <div
      className="book-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '20px',
      }}
    >
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          userBook={userBookMap.get(book.id)}
          onClick={() => onBookClick?.(book.id)}
        />
      ))}
    </div>
  );
}