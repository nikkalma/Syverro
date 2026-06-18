import { useEffect, useState } from 'react';
import { bookApi } from '../../../entities/book/book.api';
import type { EnrichedBook, BookStatus } from '../../../entities/book/book.types';

export function useLibrary() {
  const [books, setBooks] = useState<EnrichedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const [allBooks, userBooks] = await Promise.all([
        bookApi.getAll(),
        bookApi.getUserBooks(),
      ]);

      const enriched: EnrichedBook[] = allBooks.map((book) => {
        const userBook = userBooks.find((ub) => ub.book_id === book.id);
        return {
          ...book,
          userData: userBook
            ? {
                user_book_id: userBook.id,
                status: userBook.status,
                current_page: userBook.current_page,
                rating: userBook.rating,
                is_favorite: userBook.is_favorite,
                notes: userBook.notes,
              }
            : null,
        };
      });

      setBooks(enriched);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  // ------------------------------------------------------------
  // 1. addBook — для модалки, возвращает { success, error }
  //    Эту функцию НЕ передаём в BookGrid, только в LibraryPage.
  // ------------------------------------------------------------
  const addBook = async (bookData: {
    title: string;
    author: string;
    status: BookStatus;
    description?: string;
    series?: string;
    total_pages?: number;
  }) => {
    setIsAdding(true);
    try {
      const newBook = await bookApi.create({
        title: bookData.title,
        author: bookData.author,
        description: bookData.description || null,
        series: bookData.series || null,
        total_pages: bookData.total_pages || null,
        genres: [],
        cover: null,
      });

      await bookApi.addToLibrary({
        book_id: newBook.id,
        status: bookData.status,
        current_page: 0,
      });

      await loadBooks();
      return { success: true, book: newBook };
    } catch (err: any) {
      console.error('Add error:', err);
      return { success: false, error: err.message };
    } finally {
      setIsAdding(false);
    }
  };

  // ------------------------------------------------------------
  // 2. Функции для BookGrid — все возвращают Promise<void>
  // ------------------------------------------------------------

  const addToMyLibrary = async (bookId: string, status: BookStatus): Promise<void> => {
    try {
      await bookApi.addToLibrary({
        book_id: bookId,
        status,
        current_page: 0,
      });
      await loadBooks();
    } catch (err) {
      console.error('Add to library error:', err);
      throw err;
    }
  };

  const updateStatus = async (bookId: string, status: BookStatus): Promise<void> => {
    try {
      await bookApi.updateStatus(bookId, status);
      await loadBooks();
    } catch (err) {
      console.error('Update status error:', err);
      throw err;
    }
  };

  const toggleFavorite = async (bookId: string): Promise<void> => {
    try {
      await bookApi.toggleFavorite(bookId);
      await loadBooks();
    } catch (err) {
      console.error('Toggle favorite error:', err);
      throw err;
    }
  };

  // Дополнительно (если понадобятся)
  const updateProgress = async (bookId: string, page: number): Promise<void> => {
    try {
      await bookApi.updateProgress(bookId, page);
      await loadBooks();
    } catch (err) {
      console.error('Update progress error:', err);
      throw err;
    }
  };

  const removeFromLibrary = async (bookId: string): Promise<void> => {
    try {
      await bookApi.removeFromLibrary(bookId);
      await loadBooks();
    } catch (err) {
      console.error('Remove error:', err);
      throw err;
    }
  };

  // ------------------------------------------------------------
  // 3. Возвращаем всё
  // ------------------------------------------------------------
  return {
    books,
    loading,
    error,
    isAdding,
    addBook,               // для модалки
    addToMyLibrary,        // для BookGrid (Promise<void>)
    updateStatus,          // для BookGrid (Promise<void>)
    toggleFavorite,        // для BookGrid (Promise<void>)
    updateProgress,        // запас
    removeFromLibrary,     // запас
    loadBooks,
  };
}