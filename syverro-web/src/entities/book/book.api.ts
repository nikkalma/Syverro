// src/entities/book/book.api.ts

import { apiClient } from '../../shared/api/client';
import type { Book, NewBook } from './book.types';

export const bookApi = {
  // GET /books — глобальная библиотека
  getAll: async (): Promise<Book[]> => {
    const response = await apiClient.get('/books/');
    return response.data;
  },

  // GET /books/:id
  getById: async (id: string): Promise<Book> => {
    const response = await apiClient.get(`/books/${id}`);
    return response.data;
  },

  // POST /books (админка, пока не нужна)
  create: async (data: NewBook): Promise<Book> => {
    const response = await apiClient.post('/books/', data);
    return response.data;
  },

  // GET /books/search?q=...
  search: async (query: string): Promise<Book[]> => {
    const response = await apiClient.get(`/books/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};