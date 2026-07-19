// src/features/library/hooks/useLibrary.ts
import { useEffect, useState, useCallback } from 'react';
import { bookApi } from '../shared/api/bookApi';
import type { EnrichedBook, NewGlobalBook } from '../types/globalBook';
import type { PersonalBookStatus } from '../types/personalBook';

export function useLibrary() {
  const [books, setBooks] = useState<EnrichedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await bookApi.getEnrichedBooks();
      setBooks(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const addGlobalBook = async (data: NewGlobalBook) => {
    setIsAdding(true);
    try {
      await bookApi.addToLibrary(data.title, data.author);
      await loadBooks();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setIsAdding(false);
    }
  };

  const addToMyLibrary = async (bookId: string, status: PersonalBookStatus) => {
    const book = books.find((b) => b.id === bookId);
    if (!book) return;
    await bookApi.addToLibrary(book.title, book.author, status);
    await loadBooks();
  };

  const updateStatus = async (bookId: string, status: PersonalBookStatus) => {
    await bookApi.updateStatus(bookId, status);
    await loadBooks();
  };

  const updateProgress = async (_bookId: string, _currentPage: number) => {
    // No backend endpoint for progress updates yet
    await loadBooks();
  };

  const toggleFavorite = async (_bookId: string) => {
    // No backend endpoint for favorite toggle yet
    await loadBooks();
  };

  const removeFromMyLibrary = async (_bookId: string) => {
    // No backend endpoint for removing from library yet
    await loadBooks();
  };

  return {
    books,
    loading,
    error,
    isAdding,
    addGlobalBook,
    addToMyLibrary,
    updateStatus,
    updateProgress,
    toggleFavorite,
    removeFromMyLibrary,
    loadBooks,
  };
}
