export const createQuotesSlice = (set, get) => ({
  quotes: [],

  addQuote: (bookId, text) => {
    if (!text.trim()) return;
    const newQuote = {
      id: Date.now().toString(),
      bookId,
      text: text.trim(),
      createdAt: Date.now(),
    };
    set((state) => ({
      quotes: [newQuote, ...state.quotes]
    }));
  },

  deleteQuote: (quoteId) => {
    set((state) => ({
      quotes: state.quotes.filter(q => q.id !== quoteId)
    }));
  },

  getQuotesByBook: (bookId) => {
    const { quotes } = get();
    return quotes.filter(q => q.bookId === bookId).sort((a, b) => b.createdAt - a.createdAt);
  },
});