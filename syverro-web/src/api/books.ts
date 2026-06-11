import { apiClient } from './client'

export const booksApi = {
  getUserBooks: async () => {
    const response = await apiClient.get('/api/v1/books/')
    return response.data
  },

  addBook: async (bookData: { title: string; author: string }) => {
    const response = await apiClient.post('/api/v1/books/', bookData)
    return response.data
  },
}