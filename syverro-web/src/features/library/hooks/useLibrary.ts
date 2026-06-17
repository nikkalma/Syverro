import { useEffect, useState } from 'react';
import { bookApi } from '../../../entities/book/book.api';
import type { Book, BookStatus, NewBook } from '../../../entities/book/book.types';

export function useLibrary() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const data = await bookApi.getAll();
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

  const addBook = async (bookData: { title: string; author: string; status: BookStatus }) => {
    setIsAdding(true);
    try {
      const newBook = await bookApi.create({
        ...bookData,
        rating: null,
        cover: null,
        section: null,
        genres: [],
        totalPages: 0,
        currentPage: 0,
        startDate: null,
        endDate: null,
        notes: '',
        languages: [],
        review: '',
        favorite: false,
        authorCountry: null,
        series: null,
        seriesPosition: null,
        originalYear: null,
        readingFormat: 'reading' as const,
        lastRead: null,
      });
      setBooks((prev) => [...prev, newBook]);
      return { success: true };
    } catch (err: any) {
      console.error('Add error:', err);
      return { success: false, error: err.message };
    } finally {
      setIsAdding(false);
    }
  };

  const toggleFavorite = (bookId: string) => {
    setBooks((prev) =>
      prev.map((book) =>
        book.id === bookId ? { ...book, favorite: !book.favorite } : book
      )
    );
  };

  return { books, loading, error, isAdding, addBook, loadBooks, toggleFavorite };
}