import { create } from 'zustand'
import { bookRepository } from '../db/bookRepository'
import { bookService } from '../services/bookService'

type Book = any // TODO: импортировать нормальный тип

type Store = {
  books: Book[]
  isLoading: boolean
  error: string | null
  
  // ✅ Добавляем loadBooks
  loadBooks: () => Promise<void>
  addBook: (book: any) => Promise<void>
  updateBook: (id: string, updates: any) => Promise<void>
  deleteBook: (id: string) => Promise<void>
}

export const useStore = create<Store>((set, get) => ({
  books: [],
  isLoading: false,
  error: null,

  // ✅ Реализация loadBooks
  loadBooks: async () => {
    set({ isLoading: true, error: null })
    try {
      const books = await bookRepository.getAll()
      set({ books, isLoading: false })
    } catch (error) {
      set({ error: String(error), isLoading: false })
    }
  },

  addBook: async (book) => {
    await bookService.createBook(book)
    await get().loadBooks()
  },

  updateBook: async (id, updates) => {
    await bookService.updateBook(id, updates)
    await get().loadBooks()
  },

  deleteBook: async (id) => {
    await bookService.deleteBook(id)
    await get().loadBooks()
  },
}))