import { useEffect, useState } from 'react';
import type { EnrichedBook, BookStatus } from '../../../entities/book/book.types';
import mockBooks from '../../../data/books.json';

export function useLibrary() {
  const [books, setBooks] = useState<EnrichedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const data = mockBooks as EnrichedBook[];
      setBooks(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const addBook = async (bookData: {
    title: string;
    author: string;
    status: BookStatus;
  }) => {
    setIsAdding(true);
    try {
      const newBook: EnrichedBook = {
        id: Date.now().toString(),
        title: bookData.title,
        author: bookData.author,
        cover: null,
        genres: [],
        total_pages: null,
        description: null,
        series: null,
        series_position: null,
        isbn: null,
        published_year: null,
        status: 'approved',
        created_by: 'local',
        created_at: new Date().toISOString(),
        updated_at: null,
        userData: {
          user_book_id: Date.now().toString(),
          status: bookData.status,
          current_page: 0,
          rating: null,
          is_favorite: false,
          notes: null,
        },
      };
      setBooks((prev) => [...prev, newBook]);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setIsAdding(false);
    }
  };

  const addToMyLibrary = async (bookId: string, status: BookStatus): Promise<void> => {
    setBooks((prev) =>
      prev.map((book) =>
        book.id === bookId && !book.userData
          ? {
              ...book,
              userData: {
                user_book_id: Date.now().toString(),
                status,
                current_page: 0,
                rating: null,
                is_favorite: false,
                notes: null,
              },
            }
          : book
      )
    );
  };

  const updateStatus = async (bookId: string, status: BookStatus): Promise<void> => {
    setBooks((prev) =>
      prev.map((book) =>
        book.id === bookId && book.userData
          ? {
              ...book,
              userData: {
                ...book.userData,
                status,
              },
            }
          : book
      )
    );
  };

  const toggleFavorite = async (bookId: string): Promise<void> => {
    setBooks((prev) =>
      prev.map((book) =>
        book.id === bookId && book.userData
          ? {
              ...book,
              userData: {
                ...book.userData,
                is_favorite: !book.userData.is_favorite,
              },
            }
          : book
      )
    );
  };

  return {
    books,
    loading,
    error,
    isAdding,
    addBook,
    addToMyLibrary,
    updateStatus,
    toggleFavorite,
    loadBooks,
  };
}