import type {
  GlobalBook,
  NewGlobalBook,
  EnrichedBook,
} from '@/types/globalBook';

import type {
  PersonalBook,
} from '@/types/personalBook';


import { apiClient } from '@/shared/api/client';


export const bookApi = {

  getAll: async (): Promise<GlobalBook[]> => {
    const response = await apiClient.get('/books');
    return response.data;
  },


  getBySlugOrId: async (slugOrId: string): Promise<EnrichedBook> => {
    const response = await apiClient.get(`/books/${slugOrId}`);
    return response.data;
  },


  create: async (
    data: NewGlobalBook
  ): Promise<GlobalBook> => {

    const response = await apiClient.post(
      '/books',
      data
    );

    return response.data;
  },


  suggestEdit: async (
    id: string,
    data: Partial<NewGlobalBook>
  ): Promise<void> => {

    await apiClient.post(
      `/books/${id}/edit`,
      data
    );

  },


  addToLibrary: async (
    data: PersonalBook
  ): Promise<PersonalBook> => {

    const response = await apiClient.post(
      '/library',
      data
    );

    return response.data;
  },


};
