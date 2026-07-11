import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { GlobalBook } from '../types/globalBook'

interface GlobalBookState {
  books: GlobalBook[]
  loading: boolean
  setGlobalBooks: (books: GlobalBook[]) => void
  addGlobalBook: (book: GlobalBook) => void
  updateGlobalBook: (id: string, updates: Partial<GlobalBook>) => void
  setLoading: (loading: boolean) => void
}

export const useGlobalBookStore = create<GlobalBookState>()(
  persist(
    (set) => ({
      books: [],
      loading: false,
      setGlobalBooks: (books) => set({ books }),
      addGlobalBook: (book) => set((state) => ({ books: [...state.books, book] })),
      updateGlobalBook: (id, updates) =>
        set((state) => ({
          books: state.books.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        })),
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'book-storage',
    }
  )
)
