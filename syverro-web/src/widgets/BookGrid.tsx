// src/widgets/BookGrid.tsx
import BookCard from './BookCard';
import type { EnrichedBook } from '../types/book';

interface BookGridProps {
  books: EnrichedBook[];
  onBookClick?: (bookId: string) => void;
}

export default function BookGrid({ books, onBookClick }: BookGridProps) {
  if (books.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: '#97A6BA' }}>
        Книг не найдено
      </div>
    );
  }

  return (
    <div className="book-grid" style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(4, 1fr)', 
      gap: '20px',
    }}>
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onClick={() => onBookClick?.(book.id)}
        />
      ))}
    </div>
  );
}