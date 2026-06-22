import { StateCreator } from 'zustand';
import { Book, BookUpdate, NewBook } from '../../types/book';

export interface BooksSlice {
  books: Book[];
  activeBookId: string | null;
  
  addBook: (book: NewBook) => Promise<void>;
  updateBook: (id: string, updates: BookUpdate) => void;
  updateBookProgress: (id: string, progress: { currentPage?: number; lastRead?: string | null }) => void;
  deleteBook: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setActiveBook: (id: string | null) => void;
  getActiveBook: () => Book | null;
  setBooks: (books: Book[]) => void;
  importBooksFromSheets: () => Promise<{ success: boolean; count?: number; error?: string }>;
  migrateFromActiveBookId: () => boolean;
}

export const createBooksSlice: StateCreator<BooksSlice> = (set, get) => ({
  books: [],
  activeBookId: null,

  addBook: async (book) => {
    const newBook: Book = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substring(2, 8),
      title: book.title,
      author: book.author,
      status: book.status || 'planned',
      rating: book.rating ?? null,
      cover: book.cover ?? null,
      section: book.section ?? null,
      genres: book.genres || [],
      totalPages: book.totalPages || 0,
      currentPage: book.currentPage || 0,
      startDate: book.startDate ?? null,
      endDate: book.endDate ?? null,
      notes: book.notes || '',
      languages: book.languages || [],
      review: book.review || '',
      createdAt: Date.now(),
      favorite: book.favorite || false,
      authorCountry: book.authorCountry ?? null,
      series: book.series ?? null,
      seriesPosition: book.seriesPosition ?? null,
      originalYear: book.originalYear ?? null,
      readingFormat: book.readingFormat || 'reading',
      lastRead: null,
    };
    
    set((state) => ({
      books: [...state.books, newBook]
    }));
  },

  updateBook: (id, updates) => {
    set((state) => ({
      books: state.books.map((b) => 
        b.id === id ? { ...b, ...updates } : b
      )
    }));
    
    const { activeBookId } = get();
    if (activeBookId === id && updates.status === 'finished') {
      set({ activeBookId: null });
    }
  },

  updateBookProgress: (id, { currentPage, lastRead }) => {
    set((state) => ({
      books: state.books.map((b) =>
        b.id === id
          ? { 
              ...b, 
              currentPage: currentPage !== undefined ? currentPage : b.currentPage,
              lastRead: lastRead !== undefined ? lastRead : b.lastRead
            }
          : b
      ),
    }));
  },

  deleteBook: (id) => {
    set((state) => ({
      books: state.books.filter((b) => b.id !== id)
    }));
    
    const { activeBookId } = get();
    if (activeBookId === id) {
      set({ activeBookId: null });
    }
  },

  toggleFavorite: (id) => {
    set((state) => ({
      books: state.books.map((b) =>
        b.id === id ? { ...b, favorite: !b.favorite } : b
      )
    }));
  },

  setActiveBook: (id) => {
    
    if (id === null) {
      set({ activeBookId: null });
      return;
    }
    
    const { books } = get();
    const book = books.find(b => b.id === id);
        
    if (book && book.status === 'reading') {
      set({ activeBookId: id });
    } else {
      if (book) {
      }
    }
  },

  getActiveBook: () => {
    const { books, activeBookId } = get();
    if (!activeBookId) return null;
    const book = books.find(b => b.id === activeBookId);
    return book || null;
  },

  setBooks: (books) => {
    set({ books });
  },

  importBooksFromSheets: async () => {
    try {
      return { success: false, error: 'Импорт временно отключен при миграции на TS' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  },

  migrateFromActiveBookId: () => {
    const { books, activeBookId } = get();
    if (activeBookId !== null) return false;
    
    const activeBook = books.find((b: any) => b.activeBookId === true);
    if (activeBook && activeBook.status === 'reading') {
      set({ activeBookId: activeBook.id });
    }
    
    set((state) => ({
      books: state.books.map((book) => {
        const { activeBookId: _, ...cleanBook } = book as any;
        return cleanBook as Book;
      })
    }));
    
    return true;
  },
});