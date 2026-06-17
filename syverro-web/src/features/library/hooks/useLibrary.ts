import { useEffect, useState } from 'react';
import { bookApi } from '../../../entities/book/book.api';
import type { Book } from '../../../entities/book/book.types';

export function useLibrary() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔥 useLibrary mounted, fetching books...');
    bookApi.getAll()
      .then((data) => {
        console.log('🔥 books loaded:', data);
        setBooks(data);
      })
      .catch((err) => {
        console.error('❌ failed to load books:', err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
        console.log('🔥 loading finished');
      });
  }, []); // ✅ Добавлен useEffect

  const toggleFavorite = (bookId: string) => {
    setBooks((prev) =>
      prev.map((book) =>
        book.id === bookId ? { ...book, favorite: !book.favorite } : book
      )
    );
  };

  return { books, loading, error, toggleFavorite };
}