import BookCard from './BookCard';
import type { EnrichedBook } from '../entities/book/book.types';
import type { BookStatus } from '../entities/book/book.types';

interface BookGridProps {
  books: EnrichedBook[];
  onAddToMyLibrary?: (bookId: string, status: BookStatus) => Promise<void>;
  onUpdateStatus?: (bookId: string, status: BookStatus) => Promise<void>;
  onToggleFavorite?: (bookId: string) => Promise<void>;
}

export default function BookGrid({ 
  books, 
  onAddToMyLibrary, 
  onUpdateStatus, 
  onToggleFavorite 
}: BookGridProps) {
  if (books.length === 0) {
    return (
      <div className="text-center py-20 text-[#97A6BA]">
        Книг не найдено
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onAddToMyLibrary={onAddToMyLibrary}
          onUpdateStatus={onUpdateStatus}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}