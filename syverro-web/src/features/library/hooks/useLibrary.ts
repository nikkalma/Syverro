import { useEffect, useState } from 'react';
import { bookApi } from '../../../entities/book/book.api';
import type { Book } from '../../../entities/book/book.types';

export function useLibrary() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await bookApi.getAll();
      setBooks(data || []);
    } catch (err: any) {
      console.error('Ошибка загрузки книг:', err);
      setError(err.message || 'Не удалось загрузить книги');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const toggleFavorite = (bookId: string) => {
    setBooks((prev) =>
      prev.map((book) =>
        book.id === bookId ? { ...book, favorite: !book.favorite } : book
      )
    );
  };

  return {
    books,
    loading,
    error,
    loadBooks,
    toggleFavorite,
  };
}