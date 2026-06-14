import type { Book } from '../entities/book/book.types';
import BookCard from './BookCard';

interface BookGridProps {
  books: Book[];
  onBookPress?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  showFavorite?: boolean;
  columns?: 3 | 4 | 5;
}

export default function BookGrid({ 
  books, 
  onBookPress, 
  onToggleFavorite, 
  showFavorite = true,
  columns = 4 
}: BookGridProps) {
  const gridCols = {
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  }[columns];

  return (
    <div className={`grid ${gridCols} gap-6`}>
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onPress={onBookPress}
          onToggleFavorite={onToggleFavorite}
          showFavorite={showFavorite}
        />
      ))}
    </div>
  );
}