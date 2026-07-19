// src/store/libraryStore.ts
import { create } from 'zustand';
import { PersonalBook, PersonalBookStatus } from '../types/personalBook';
import { EnrichedBook } from '../types/globalBook';
import { bookApi } from '../shared/api/bookApi';

interface LibraryState {
  books: EnrichedBook[];
  personalBooks: PersonalBook[];
  loading: boolean;
  error: string | null;

  searchQuery: string;
  statusFilters: PersonalBookStatus[];
  genreFilters: string[];
  authorFilters: string[];

  viewMode: 'grid' | 'list';
  selectedBookId: string | null;

  loadLibrary: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  toggleStatusFilter: (status: PersonalBookStatus) => void;
  toggleGenreFilter: (genre: string) => void;
  toggleAuthorFilter: (author: string) => void;
  clearFilters: () => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  selectBook: (bookId: string | null) => void;

  updateBookStatus: (bookId: string, status: PersonalBookStatus) => void;
  updateProgress: (bookId: string, progress: number) => void;
  removeFromLibrary: (bookId: string) => void;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
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

  loadLibrary: async () => {
    if (get().books.length > 0 && get().personalBooks.length > 0) {
      return;
    }
    set({ loading: true, error: null });
    try {
      const [enrichedResult, personalResult] = await Promise.allSettled([
        bookApi.getEnrichedBooks(),
        bookApi.getUserBooks(),
      ]);

      const enrichedBooks = enrichedResult.status === 'fulfilled' ? enrichedResult.value : [];
      const personalBooks = personalResult.status === 'fulfilled' ? personalResult.value : [];

      set({ books: enrichedBooks, personalBooks, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

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

  setViewMode: (mode) => set({ viewMode: mode }),
  selectBook: (bookId) => set({ selectedBookId: bookId }),

  updateBookStatus: async (bookId, status) => {
    const prev = get().personalBooks;

    set({
      personalBooks: prev.map((ub) =>
        ub.bookId === bookId ? { ...ub, status } : ub
      ),
    });

    try {
      await bookApi.updateStatus(bookId, status);
    } catch {
      set({ personalBooks: prev });
    }
  },

  updateProgress: async (bookId, progress) => {
    const prev = get().personalBooks;

    set({
      personalBooks: prev.map((ub) =>
        ub.bookId === bookId ? { ...ub, currentPage: progress } : ub
      ),
    });

    // No backend endpoint for progress yet — revert on failure
    set({ personalBooks: prev });
  },

  removeFromLibrary: async (bookId) => {
    const prev = get().personalBooks;

    set({
      personalBooks: prev.filter((ub) => ub.bookId !== bookId),
    });

    // No backend endpoint for removing from library yet — revert on failure
    set({ personalBooks: prev });
  },
}));
