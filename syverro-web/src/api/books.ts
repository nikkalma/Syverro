import { apiClient } from '../shared/api/client'

export const booksApi = {
  getUserBooks: async () => {
    const response = await apiClient.get('/books/')
    return response.data
  },

  addBook: async (bookData: { title: string; author: string }) => {
    const response = await apiClient.post('/books/', bookData)
    return response.data
  },
}