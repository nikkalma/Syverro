import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Book, BookStatus } from '../types/book'

interface BookState {
  books: Book[]
  loading: boolean
  setBooks: (books: Book[]) => void
  addBook: (book: Book) => void
  updateBook: (id: string, updates: Partial<Book>) => void
  toggleFavorite: (id: string) => void
  setLoading: (loading: boolean) => void
}

export const useBookStore = create<BookState>()(
  persist(
    (set) => ({
      books: [],
      loading: false,
      setBooks: (books) => set({ books }),
      addBook: (book) => set((state) => ({ books: [...state.books, book] })),
      updateBook: (id, updates) =>
        set((state) => ({
          books: state.books.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        })),
      toggleFavorite: (id) =>
        set((state) => ({
          books: state.books.map((b) =>
            b.id === id ? { ...b, favorite: !b.favorite } : b
          ),
        })),
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'book-storage',
    }
  )
)