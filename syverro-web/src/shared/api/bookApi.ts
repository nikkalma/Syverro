// src/shared/api/bookApi.ts

import { apiClient } from './client';

import type {
  GlobalBook,
  NewGlobalBook,
} from '../../types/globalBook';

import type {
  PersonalBook,
  PersonalBookStatus,
} from '../../types/personalBook';


// ============================================
// TYPES
// ============================================

export interface AddPersonalBookRequest {
  bookId: string;
  status?: PersonalBookStatus;
}


// ============================================
// BOOK API
// ============================================

export const bookApi = {

  // --------------------------------------------
  // GLOBAL LIBRARY
  // --------------------------------------------

  async getAll(): Promise<GlobalBook[]> {
    const response = await apiClient.get('/books/');
    return response.data;
  },


  async getById(
    id: string
  ): Promise<GlobalBook> {

    const response = await apiClient.get(
      `/books/${id}`
    );

    return response.data;
  },


  async create(
    data: NewGlobalBook
  ): Promise<GlobalBook> {

    const response = await apiClient.post(
      '/books/',
      data
    );

    return response.data;
  },


  async update(
    id: string,
    data: Partial<NewGlobalBook>
  ): Promise<GlobalBook> {

    const response = await apiClient.patch(
      `/books/${id}`,
      data
    );

    return response.data;
  },


  async delete(
    id: string
  ): Promise<void> {

    await apiClient.delete(
      `/books/${id}`
    );
  },


  // --------------------------------------------
  // PERSONAL LIBRARY
  // --------------------------------------------


  async getPersonalBooks(): Promise<PersonalBook[]> {

    const response = await apiClient.get(
      '/books/user-books/'
    );

    return response.data;
  },


  async addToLibrary(
    data: AddPersonalBookRequest
  ): Promise<PersonalBook> {

    const response = await apiClient.post(
      '/books/user-books/',
      data
    );

    return response.data;
  },


  async removeFromLibrary(
    bookId: string
  ): Promise<void> {

    await apiClient.delete(
      `/books/user-books/${bookId}`
    );
  },


  async updateStatus(
    bookId: string,
    status: PersonalBookStatus
  ): Promise<void> {

    await apiClient.patch(
      `/books/${bookId}/status`,
      {
        status,
      }
    );
  },


  async updateProgress(
    bookId: string,
    currentPage: number
  ): Promise<void> {

    await apiClient.patch(
      `/books/${bookId}/progress`,
      {
        currentPage,
      }
    );
  },


  async toggleFavorite(
    bookId: string
  ): Promise<void> {

    await apiClient.patch(
      `/books/${bookId}/favorite`
    );
  },


  async updatePersonalBook(
    bookId: string,
    data: Partial<PersonalBook>
  ): Promise<void> {

    await apiClient.patch(
      `/books/user-books/${bookId}`,
      data
    );
  },


};