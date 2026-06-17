import { apiClient } from '../../shared/api/client';
import type { Book, NewBook } from './book.types';

export const bookApi = {
  getAll: async (): Promise<Book[]> => {
    const response = await apiClient.get('/books/');  // ← убрал /catalog/
    return response.data;
  },

  getById: async (id: string): Promise<Book> => {
    const response = await apiClient.get(`/books/${id}`);
    return response.data;
  },

  create: async (data: NewBook): Promise<Book> => {
    const response = await apiClient.post('/books/', data);
    return response.data;
  },

  getUserBooks: async (): Promise<any[]> => {
    const response = await apiClient.get('/books/user-books/');
    return response.data;
  },

  updateStatus: async (bookId: string, status: string): Promise<void> => {
    await apiClient.put(`/books/${bookId}/status?status_value=${status}`);
  },
};