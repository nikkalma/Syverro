import { create } from 'zustand'
import { Book, UserBook } from '../types/book'

interface BookState {
  books: Book[]
  userBooks: UserBook[]
  loading: boolean
  setBooks: (books: Book[]) => void
  setUserBooks: (userBooks: UserBook[]) => void
  addBook: (book: Book) => void
  updateBookStatus: (bookId: string, status: string) => void
  setLoading: (loading: boolean) => void
}

export const useBookStore = create<BookState>((set) => ({
  books: [],
  userBooks: [],
  loading: false,
  setBooks: (books) => set({ books }),
  setUserBooks: (userBooks) => set({ userBooks }),
  addBook: (book) => set((state) => ({ books: [...state.books, book] })),
  updateBookStatus: (bookId, status) =>
    set((state) => ({
      userBooks: state.userBooks.map((ub) =>
        ub.bookId === bookId ? { ...ub, status } : ub
      ),
    })),
  setLoading: (loading) => set({ loading }),
}))