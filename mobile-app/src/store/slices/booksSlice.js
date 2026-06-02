// src/store/slices/booksSlice.js

export const createBooksSlice = (set, get) => ({
  books: [],
  activeBookId: null,

  addBook: async (book) => {
    set((state) => ({
      books: [...state.books, { ...book, id: book.id || Date.now().toString() }]
    }));
  },

  updateBook: (id, updatedBook) => {
    set((state) => ({
      books: state.books.map((b) => b.id === id ? updatedBook : b)
    }));
    const { activeBookId } = get();
    if (activeBookId === id && updatedBook.status === 'completed') {
      set({ activeBookId: null });
    }
  },

  updateBookProgress: (id, { currentPage, lastRead }) => {
    set((state) => ({
      books: state.books.map((b) =>
        b.id === id
          ? { ...b, currentPage: currentPage ?? b.currentPage, lastRead: lastRead ?? b.lastRead }
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
      books: state.books.map((b) => b.id === id ? { ...b, favorite: !b.favorite } : b)
    }));
  },

  setActiveBook: (id) => {
    const { books } = get();
    if (id === null) {
      set({ activeBookId: null });
      return;
    }
    const book = books.find(b => b.id === id);
    if (book && book.status === 'reading') {
      set({ activeBookId: id });
    }
  },

  getActiveBook: () => {
    const { books, activeBookId } = get();
    return books.find(b => b.id === activeBookId && b.status === 'reading') || null;
  },

  setBooks: (books) => {
    set({ books });
  },

  importBooksFromSheets: async () => {
    console.log('Импорт пока не реализован в этом слайсе');
  },

  migrateFromactiveBookId: () => {
    const { books, activeBookId } = get();
    if (activeBookId !== null) return false;
    const activeBook = books.find(b => b.activeBookId === true);
    if (activeBook && activeBook.status === 'reading') {
      set({ activeBookId: activeBook.id });
    }
    set((state) => ({
      books: state.books.map(({ activeBookId, ...book }) => book)
    }));
    return true;
  },
});