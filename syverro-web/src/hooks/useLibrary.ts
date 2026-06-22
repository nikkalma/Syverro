// src/features/library/hooks/useLibrary.ts
import { useEffect, useState } from 'react';
import { storageService } from '../services/storageService';
import type { EnrichedBook, BookStatus, NewGlobalBook } from '../types/book';

const CURRENT_USER_ID = 'user_1';

export function useLibrary() {
  const [books, setBooks] = useState<EnrichedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const loadBooks = async () => {
    try {
      setLoading(true);
      setBooks(storageService.getEnrichedBooks(CURRENT_USER_ID));
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const addGlobalBook = async (data: NewGlobalBook) => {
    setIsAdding(true);
    try {
      const newBook = storageService.addGlobalBook(data);
      setBooks(prev => [...prev, { ...newBook, personal: null }]);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setIsAdding(false);
    }
  };

  const addToMyLibrary = async (bookId: string, status: BookStatus) => {
    storageService.addPersonalBook(CURRENT_USER_ID, bookId, status);
    await loadBooks();
  };

  const updateStatus = async (bookId: string, status: BookStatus) => {
    storageService.updatePersonalBook(CURRENT_USER_ID, bookId, { status });
    await loadBooks();
  };

  const updateProgress = async (bookId: string, currentPage: number) => {
    storageService.updatePersonalBook(CURRENT_USER_ID, bookId, { currentPage });
    await loadBooks();
  };

  const toggleFavorite = async (bookId: string) => {
    const personal = storageService.getPersonalBook(CURRENT_USER_ID, bookId);
    if (personal) {
      storageService.updatePersonalBook(CURRENT_USER_ID, bookId, {
        favorite: !personal.favorite,
      });
      await loadBooks();
    }
  };

  const removeFromMyLibrary = async (bookId: string) => {
    storageService.removePersonalBook(CURRENT_USER_ID, bookId);
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