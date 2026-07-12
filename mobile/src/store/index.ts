// ============================================
// SYVERRO — ZUSTAND STORE (UI Cache)
// SQLite = единственный источник правды
// Store = кэш для UI
// ============================================

import { create } from 'zustand'
import { bookRepository } from '../db/bookRepository'
import { bookService } from '../services/bookService'

// ✅ Правильный импорт типа Book
import type { Book } from '../types/book.types'

// ============================================
// ВРЕМЕННЫЕ ТИПЫ (пока нет соответствующих файлов)
// TODO: перенести в types/ когда будут созданы
// ============================================
type ReadingSession = any
type Quote = any
type Profile = any

// ============================================
// STORE STATE
// ============================================
type Store = {
  // --- КНИГИ ---
  books: Book[]
  isLoading: boolean
  error: string | null

  // --- СЕССИИ ---
  sessions: ReadingSession[]
  quotes: Quote[]
  profile: Profile | null
  activeBookId: string | null

  // --- МЕТОДЫ КНИГ ---
  loadBooks: () => Promise<void>
  addBook: (book: any) => Promise<void>
  updateBook: (id: string, updates: any) => Promise<void>
  deleteBook: (id: string) => Promise<void>

  // --- МЕТОДЫ СЕССИЙ ---
  loadSessions: () => Promise<void>
  addSession: (session: any) => Promise<void>
  deleteSession: (id: string) => Promise<void>
  deleteSessionsByBook: (bookId: string) => Promise<void>
  deleteAllSessions: () => Promise<void>

  // --- МЕТОДЫ ЦИТАТ ---
  loadQuotes: () => Promise<void>
  addQuote: (quote: any) => Promise<void>
  deleteQuote: (id: string) => Promise<void>
  updateQuoteNote: (id: string, note: string) => Promise<void>
  getQuotesByBook: (bookId: string) => Quote[]

  // --- МЕТОДЫ ПРОФИЛЯ ---
  loadProfile: () => Promise<void>
  updateProfile: (data: any) => Promise<void>

  // --- ДРУГИЕ МЕТОДЫ ---
  setActiveBook: (id: string | null) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  updateBookProgress: (id: string, progress: any) => Promise<void>

  // --- ВСПОМОГАТЕЛЬНЫЕ ---
  getBook: (id: string) => Book | undefined
}

// ============================================
// СОЗДАНИЕ STORE
// ============================================
export const useStore = create<Store>((set, get) => ({
  // --- НАЧАЛЬНЫЕ ЗНАЧЕНИЯ ---
  books: [],
  sessions: [],
  quotes: [],
  profile: null,
  activeBookId: null,
  isLoading: false,
  error: null,

  // ==========================================
  // КНИГИ
  // ==========================================

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

  getBook: (id) => {
    return get().books.find((book) => book.id === id)
  },

  // ==========================================
  // СЕССИИ (заглушки)
  // ==========================================

  loadSessions: async () => {
    console.log('📚 loadSessions: not implemented yet')
  },

  addSession: async (session) => {
    console.log('📚 addSession: not implemented yet', session)
  },

  deleteSession: async (id) => {
    console.log('📚 deleteSession: not implemented yet', id)
  },

  deleteSessionsByBook: async (bookId) => {
    console.log('📚 deleteSessionsByBook: not implemented yet', bookId)
  },

  deleteAllSessions: async () => {
    console.log('📚 deleteAllSessions: not implemented yet')
  },

  // ==========================================
  // ЦИТАТЫ (заглушки)
  // ==========================================

  loadQuotes: async () => {
    console.log('📚 loadQuotes: not implemented yet')
  },

  addQuote: async (quote) => {
    console.log('📚 addQuote: not implemented yet', quote)
    set((state) => ({
      quotes: [...state.quotes, { ...quote, id: Date.now().toString() }],
    }))
  },

  deleteQuote: async (id) => {
    console.log('📚 deleteQuote: not implemented yet', id)
    set((state) => ({
      quotes: state.quotes.filter((q) => q.id !== id),
    }))
  },

  updateQuoteNote: async (id, note) => {
    console.log('📚 updateQuoteNote: not implemented yet', id, note)
    set((state) => ({
      quotes: state.quotes.map((q) =>
        q.id === id ? { ...q, note } : q
      ),
    }))
  },

  getQuotesByBook: (bookId) => {
    return get().quotes.filter((q) => q.bookId === bookId)
  },

  // ==========================================
  // ПРОФИЛЬ (заглушки)
  // ==========================================

  loadProfile: async () => {
    console.log('📚 loadProfile: not implemented yet')
  },

  updateProfile: async (data) => {
    console.log('📚 updateProfile: not implemented yet', data)
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...data } : data,
    }))
  },

  // ==========================================
  // ДРУГИЕ МЕТОДЫ
  // ==========================================

  setActiveBook: async (id) => {
    set({ activeBookId: id })
    console.log('📚 setActiveBook:', id)
  },

  toggleFavorite: async (id) => {
    const book = get().books.find((b) => b.id === id)
    if (book) {
      await get().updateBook(id, { favorite: !book.favorite })
    }
  },

  updateBookProgress: async (id, progress) => {
    await get().updateBook(id, progress)
  },
}))