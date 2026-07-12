import { StateCreator } from 'zustand';

export interface Quote {
  id: string;
  text: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  sessionId: string | null;
  sessionTime: number | null;
  page: number | null;
  note: string | null;
  createdAt: number;
}

export interface QuotesSlice {
  quotes: Quote[];
  addQuote: (quote: Omit<Quote, 'id' | 'createdAt'>) => void;
  deleteQuote: (quoteId: string) => void;
  getQuotesByBook: (bookId: string) => Quote[];
  updateQuoteNote: (quoteId: string, note: string) => void;
  getRandomQuote: () => Quote | null;
  getUnseenQuotes: () => Quote[];
  markQuoteAsSeen: (quoteId: string) => void;
  resetSeenQuotes: () => void;
}

// Хранилище для отслеживания просмотренных цитат (Цитата дня)
let seenQuotesCache: string[] = [];

export const createQuotesSlice: StateCreator<QuotesSlice> = (set, get) => ({
  quotes: [],

  addQuote: (quote) => {
    const newQuote: Quote = {
      ...quote,
      id: Date.now().toString() + '-' + Math.random().toString(36).substring(2, 8),
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
    // Удаляем из кэша просмотренных
    seenQuotesCache = seenQuotesCache.filter(id => id !== quoteId);
  },

  getQuotesByBook: (bookId) => {
    const { quotes } = get();
    return quotes.filter(q => q.bookId === bookId).sort((a, b) => b.createdAt - a.createdAt);
  },

  updateQuoteNote: (quoteId, note) => {
    set((state) => ({
      quotes: state.quotes.map((q) =>
        q.id === quoteId ? { ...q, note: note || null } : q
      )
    }));
  },

  getRandomQuote: () => {
    const { quotes } = get();
    if (quotes.length === 0) return null;
    
    // Фильтруем непросмотренные
    const unseenQuotes = quotes.filter(q => !seenQuotesCache.includes(q.id));
    
    if (unseenQuotes.length === 0) {
      // Если все просмотрены — сбрасываем и показываем случайную
      seenQuotesCache = [];
      const randomIndex = Math.floor(Math.random() * quotes.length);
      const quote = quotes[randomIndex];
      seenQuotesCache.push(quote.id);
      return quote;
    }
    
    const randomIndex = Math.floor(Math.random() * unseenQuotes.length);
    const quote = unseenQuotes[randomIndex];
    seenQuotesCache.push(quote.id);
    return quote;
  },

  getUnseenQuotes: () => {
    const { quotes } = get();
    return quotes.filter(q => !seenQuotesCache.includes(q.id));
  },

  markQuoteAsSeen: (quoteId) => {
    if (!seenQuotesCache.includes(quoteId)) {
      seenQuotesCache.push(quoteId);
    }
  },

  resetSeenQuotes: () => {
    seenQuotesCache = [];
  },
});