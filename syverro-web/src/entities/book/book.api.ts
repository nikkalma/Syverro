import { apiClient } from '../../shared/api/client';
import type { Book, BookCreate, UserBook, UserBookCreate, EnrichedBook } from './book.types';

export const bookApi = {
  // ============================================
  // GLOBAL LIBRARY (Books)
  // ============================================
  
  // Получить все одобренные книги (публичный каталог)
  getAll: async (): Promise<Book[]> => {
    const response = await apiClient.get('/books/');
    return response.data;
  },

  // Получить книгу по ID
  getById: async (id: string): Promise<Book> => {
    const response = await apiClient.get(`/books/${id}`);
    return response.data;
  },

  // Создать новую книгу (создатель + модерация)
  create: async (data: BookCreate): Promise<Book> => {
    const response = await apiClient.post('/books/', data);
    return response.data;
  },

  // Предложить правку книги
  suggestEdit: async (id: string, data: Partial<BookCreate>): Promise<void> => {
    await apiClient.patch(`/books/${id}/suggest`, data);
  },

  // ============================================
  // USER LIBRARY (UserBooks)
  // ============================================
  
  // Получить все книги пользователя с прогрессом
  getUserBooks: async (): Promise<UserBook[]> => {
    const response = await apiClient.get('/books/user-books/');
    return response.data;
  },

  // Добавить книгу в личную библиотеку
  addToLibrary: async (data: UserBookCreate): Promise<UserBook> => {
    const response = await apiClient.post('/books/user-books/', data);
    return response.data;
  },

  // Обновить статус книги
  updateStatus: async (bookId: string, status: string): Promise<void> => {
    await apiClient.put(`/books/${bookId}/status?status_value=${status}`);
  },

  // Обновить прогресс
  updateProgress: async (bookId: string, page: number): Promise<void> => {
    await apiClient.patch(`/books/${bookId}/progress`, { current_page: page });
  },

  // Обновить рейтинг
  updateRating: async (bookId: string, rating: number): Promise<void> => {
    await apiClient.patch(`/books/${bookId}/rating`, { rating });
  },

  // Переключить избранное
  toggleFavorite: async (bookId: string): Promise<void> => {
    await apiClient.patch(`/books/${bookId}/favorite`);
  },

  // Удалить из личной библиотеки
  removeFromLibrary: async (bookId: string): Promise<void> => {
    await apiClient.delete(`/books/user-books/${bookId}`);
  },
};