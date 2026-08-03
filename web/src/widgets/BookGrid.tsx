// src/widgets/BookGrid.tsx
import BookCard from './BookCard';
import type { EnrichedBook } from '../types/globalBook';
import type { PersonalBook } from '../types/personalBook';

interface BookGridProps {
  books: EnrichedBook[];
  personalBooks?: PersonalBook[];
  onBookClick?: (book: EnrichedBook) => void;
}

export default function BookGrid({ books, personalBooks = [], onBookClick }: BookGridProps) {
  const personalBookMap = new Map(personalBooks.map((ub) => [ub.bookId, ub]));

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
          personalBook={personalBookMap.get(book.id)}
          onClick={() => onBookClick?.(book)}
        />
      ))}
    </div>
  );
}
