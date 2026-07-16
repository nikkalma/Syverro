// src/store/libraryStore.ts
import { create } from 'zustand';
import { PersonalBook, PersonalBookStatus } from '../types/personalBook';
import { EnrichedBook } from '../types/globalBook';
import { storageService } from '../services/storageService';
import { storageService } from '../services/storageService';

const CURRENT_USER_ID = 'user_1';

interface LibraryState {
  // Данные
  books: EnrichedBook[];
  personalBooks: PersonalBook[];
  loading: boolean;
  error: string | null;

  // Фильтры
  searchQuery: string;
  statusFilters: PersonalBookStatus[];
  genreFilters: string[];
  authorFilters: string[];

  // UI
  viewMode: 'grid' | 'list';
  selectedBookId: string | null;

  // Actions
  loadLibrary: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  toggleStatusFilter: (status: PersonalBookStatus) => void;
  toggleGenreFilter: (genre: string) => void;
  toggleAuthorFilter: (author: string) => void;
  clearFilters: () => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  selectBook: (bookId: string | null) => void;

  // CRUD (optimistic)
  updateBookStatus: (bookId: string, status: PersonalBookStatus) => void;
  updateProgress: (bookId: string, progress: number) => void;
  removeFromLibrary: (bookId: string) => void;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  // Начальное состояние
  books: [],
  personalBooks: [],
  loading: false,
  error: null,
  searchQuery: '',
  statusFilters: [],
  genreFilters: [],
  authorFilters: [],
  viewMode: 'grid',
  selectedBookId: null,

  // Загрузка
  loadLibrary: async () => {
    if (get().books.length > 0 && get().personalBooks.length > 0) {
      return;
    }
    set({ loading: true, error: null });
    try {
      const books = storageService.getEnrichedBooks(CURRENT_USER_ID);
      const personalBooks = storageService.getByUser(CURRENT_USER_ID);
      set({ books, personalBooks, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // Поиск
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Фильтры
  toggleStatusFilter: (status) => {
    const { statusFilters } = get();
    set({
      statusFilters: statusFilters.includes(status)
        ? statusFilters.filter((s) => s !== status)
        : [...statusFilters, status],
    });
  },

  toggleGenreFilter: (genre) => {
    const { genreFilters } = get();
    set({
      genreFilters: genreFilters.includes(genre)
        ? genreFilters.filter((g) => g !== genre)
        : [...genreFilters, genre],
    });
  },

  toggleAuthorFilter: (author) => {
    const { authorFilters } = get();
    set({
      authorFilters: authorFilters.includes(author)
        ? authorFilters.filter((a) => a !== author)
        : [...authorFilters, author],
    });
  },

  clearFilters: () => {
    set({
      searchQuery: '',
      statusFilters: [],
      genreFilters: [],
      authorFilters: [],
    });
  },

  // UI
  setViewMode: (mode) => set({ viewMode: mode }),
  selectBook: (bookId) => set({ selectedBookId: bookId }),

  // CRUD с optimistic updates
  updateBookStatus: (bookId, status) => {
    const prev = get().personalBooks;

    set({
      personalBooks: prev.map((ub) =>
        ub.bookId === bookId ? { ...ub, status } : ub
      ),
    });

    const updated = storageService.update(CURRENT_USER_ID, bookId, { status });
    if (!updated) {
      set({ personalBooks: prev });
    }
  },

  updateProgress: (bookId, progress) => {
    const prev = get().personalBooks;

    set({
      personalBooks: prev.map((ub) =>
        ub.bookId === bookId ? { ...ub, currentPage: progress } : ub
      ),
    });

    const updated = storageService.update(CURRENT_USER_ID, bookId, { currentPage: progress });
    if (!updated) {
      set({ personalBooks: prev });
    }
  },

  removeFromLibrary: (bookId) => {
    const prev = get().personalBooks;

    set({
      personalBooks: prev.filter((ub) => ub.bookId !== bookId),
    });

    storageService.remove(CURRENT_USER_ID, bookId);
  },
}));
