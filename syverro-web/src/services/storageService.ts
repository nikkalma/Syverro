// src/services/storageService.ts
import type {
  GlobalBook,
  PersonalBook,
  EnrichedBook,
  NewGlobalBook,
  BookStatus,
  EditProposal,
} from '../types/book';
import type { ReaderProfile } from '../types/reader';
import initialBooksData from '../data/books.json';

const STORAGE_KEYS = {
  GLOBAL_BOOKS: 'syverro_global_books',
  PERSONAL_BOOKS: 'syverro_personal_books',
  EDIT_PROPOSALS: 'syverro_edit_proposals',
  READER_PROFILE: 'syverro_reader_profile',
};

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

const getGlobalBooks = (): GlobalBook[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.GLOBAL_BOOKS);
  if (stored) {
    try {
      return JSON.parse(stored) as GlobalBook[];
    } catch {
      return [];
    }
  }
  try {
    const initial = initialBooksData as GlobalBook[];
    localStorage.setItem(STORAGE_KEYS.GLOBAL_BOOKS, JSON.stringify(initial));
    return initial;
  } catch (error) {
    console.error('Не удалось загрузить данные:', error);
    return [];
  }
};

const saveGlobalBooks = (books: GlobalBook[]): void => {
  localStorage.setItem(STORAGE_KEYS.GLOBAL_BOOKS, JSON.stringify(books));
};

const getPersonalBooks = (userId: string): PersonalBook[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.PERSONAL_BOOKS);
  if (!stored) return [];
  try {
    const all = JSON.parse(stored) as Record<string, PersonalBook>;
    return Object.values(all).filter((p: PersonalBook) => p.userId === userId);
  } catch {
    return [];
  }
};

const getPersonalBook = (userId: string, bookId: string): PersonalBook | null => {
  const stored = localStorage.getItem(STORAGE_KEYS.PERSONAL_BOOKS);
  if (!stored) return null;
  try {
    const all = JSON.parse(stored) as Record<string, PersonalBook>;
    return all[`${userId}_${bookId}`] || null;
  } catch {
    return null;
  }
};

const savePersonalBook = (userId: string, bookId: string, data: PersonalBook): void => {
  const stored = localStorage.getItem(STORAGE_KEYS.PERSONAL_BOOKS);
  const all = stored ? (JSON.parse(stored) as Record<string, PersonalBook>) : {};
  all[`${userId}_${bookId}`] = data;
  localStorage.setItem(STORAGE_KEYS.PERSONAL_BOOKS, JSON.stringify(all));
};

const deletePersonalBook = (userId: string, bookId: string): void => {
  const stored = localStorage.getItem(STORAGE_KEYS.PERSONAL_BOOKS);
  if (!stored) return;
  const all = JSON.parse(stored) as Record<string, PersonalBook>;
  delete all[`${userId}_${bookId}`];
  localStorage.setItem(STORAGE_KEYS.PERSONAL_BOOKS, JSON.stringify(all));
};

// ============================================
// EDIT PROPOSALS
// ============================================

const getEditProposals = (): EditProposal[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.EDIT_PROPOSALS);
  if (stored) {
    try {
      return JSON.parse(stored) as EditProposal[];
    } catch {
      return [];
    }
  }
  return [];
};

const saveEditProposals = (proposals: EditProposal[]): void => {
  localStorage.setItem(STORAGE_KEYS.EDIT_PROPOSALS, JSON.stringify(proposals));
};

// ============================================
// ПУБЛИЧНЫЙ API
// ============================================

// ---- ПЕРСОНАЛЬНЫЕ ПЛАШКИ ----
const DEMIURGE_EMAILS = ['syverro.ris@gmail.com'];

export const storageService = {
  // ---- ГЛОБАЛЬНЫЕ КНИГИ ----
  getAllBooks: (): GlobalBook[] => getGlobalBooks(),

  getBookById: (id: string): GlobalBook | null => {
    return getGlobalBooks().find((b: GlobalBook) => b.id === id) || null;
  },

  addGlobalBook: (data: NewGlobalBook): GlobalBook => {
    const books = getGlobalBooks();
    const newBook: GlobalBook = {
      ...data,
      id: Date.now().toString(),
      createdAt: Date.now(),
      averageRating: null,
      totalRatings: 0,
    };
    books.push(newBook);
    saveGlobalBooks(books);
    return newBook;
  },

  updateGlobalBook: (book: GlobalBook): void => {
    const books = getGlobalBooks();
    const index = books.findIndex((b: GlobalBook) => b.id === book.id);
    if (index !== -1) {
      books[index] = book;
      saveGlobalBooks(books);
    }
  },

  deleteGlobalBook: (id: string): void => {
    saveGlobalBooks(getGlobalBooks().filter((b: GlobalBook) => b.id !== id));
  },

  // ---- ЛИЧНЫЕ КНИГИ ----
  getPersonalBooks: (userId: string): PersonalBook[] => getPersonalBooks(userId),
  getPersonalBook: (userId: string, bookId: string): PersonalBook | null =>
    getPersonalBook(userId, bookId),

  addPersonalBook: (userId: string, bookId: string, status: BookStatus = 'want_to_read'): PersonalBook => {
    const now = Date.now();
    const personal: PersonalBook = {
      userId,
      bookId,
      status,
      currentPage: 0,
      rating: null,
      favorite: false,
      notes: '',
      quotes: [],
      addedAt: now,
      updatedAt: now,
    };
    savePersonalBook(userId, bookId, personal);
    return personal;
  },

  updatePersonalBook: (userId: string, bookId: string, updates: Partial<PersonalBook>): void => {
    const current = getPersonalBook(userId, bookId);
    if (!current) return;
    savePersonalBook(userId, bookId, { ...current, ...updates, updatedAt: Date.now() });
  },

  removePersonalBook: (userId: string, bookId: string): void => {
    deletePersonalBook(userId, bookId);
  },

  // ---- ОБОГАЩЁННЫЕ КНИГИ ----
  getEnrichedBooks: (userId: string): EnrichedBook[] => {
    const globalBooks = getGlobalBooks();
    const personalBooks = getPersonalBooks(userId);
    const personalMap: Record<string, PersonalBook> = {};
    personalBooks.forEach((p: PersonalBook) => {
      personalMap[p.bookId] = p;
    });
    return globalBooks.map((book: GlobalBook) => ({
      ...book,
      personal: personalMap[book.id] || null,
    }));
  },

  getEnrichedBook: (userId: string, bookId: string): EnrichedBook | null => {
    const global = getGlobalBooks().find((b: GlobalBook) => b.id === bookId);
    if (!global) return null;
    const personal = getPersonalBook(userId, bookId);
    return { ...global, personal: personal || null };
  },

  // ---- ЦИТАТЫ ----
  addQuote: (userId: string, bookId: string, text: string, page?: number, note?: string): void => {
    const personal = getPersonalBook(userId, bookId);
    if (!personal) return;
    personal.quotes.push({
      id: Date.now().toString(),
      text,
      page: page || null,
      note: note || null,
      createdAt: Date.now(),
    });
    personal.updatedAt = Date.now();
    savePersonalBook(userId, bookId, personal);
  },

  deleteQuote: (userId: string, bookId: string, quoteId: string): void => {
    const personal = getPersonalBook(userId, bookId);
    if (!personal) return;
    personal.quotes = personal.quotes.filter((q: { id: string }) => q.id !== quoteId);
    personal.updatedAt = Date.now();
    savePersonalBook(userId, bookId, personal);
  },

  // ---- EDIT PROPOSALS ----
  createEditProposal: (data: Omit<EditProposal, 'id' | 'status' | 'createdAt'>): EditProposal => {
    const proposals = getEditProposals();
    const newProposal: EditProposal = {
      ...data,
      id: `proposal_${Date.now()}`,
      status: 'pending',
      createdAt: Date.now(),
    };
    proposals.push(newProposal);
    saveEditProposals(proposals);
    return newProposal;
  },

  getEditProposalsByBook: (bookId: string): EditProposal[] => {
    return getEditProposals().filter((p: EditProposal) => p.bookId === bookId);
  },

  getEditProposalsByUser: (userId: string): EditProposal[] => {
    return getEditProposals().filter((p: EditProposal) => p.userId === userId);
  },

  getPendingEditProposals: (): EditProposal[] => {
    return getEditProposals().filter((p: EditProposal) => p.status === 'pending');
  },

  approveEditProposal: (proposalId: string, moderatorId: string, comment?: string): void => {
    const proposals = getEditProposals();
    const proposal = proposals.find((p: EditProposal) => p.id === proposalId);
    if (!proposal) return;
    proposal.status = 'approved';
    proposal.reviewedAt = Date.now();
    proposal.moderatorId = moderatorId;
    if (comment) proposal.moderatorComment = comment;
    saveEditProposals(proposals);

    const globalBooks = getGlobalBooks();
    const bookIndex = globalBooks.findIndex((b: GlobalBook) => b.id === proposal.bookId);
    if (bookIndex !== -1) {
      globalBooks[bookIndex] = { ...globalBooks[bookIndex], ...proposal.changedFields };
      saveGlobalBooks(globalBooks);
    }
  },

  rejectEditProposal: (proposalId: string, moderatorId: string, comment?: string): void => {
    const proposals = getEditProposals();
    const proposal = proposals.find((p: EditProposal) => p.id === proposalId);
    if (!proposal) return;
    proposal.status = 'rejected';
    proposal.reviewedAt = Date.now();
    proposal.moderatorId = moderatorId;
    if (comment) proposal.moderatorComment = comment;
    saveEditProposals(proposals);
  },

  // ---- READER PROFILE ----
  getReaderProfile: (): ReaderProfile => {
    const stored = localStorage.getItem(STORAGE_KEYS.READER_PROFILE);
    if (stored) {
      try {
        return JSON.parse(stored) as ReaderProfile;
      } catch {
        return {};
      }
    }
    return {};
  },

  saveReaderProfile: (profile: ReaderProfile): void => {
    localStorage.setItem(STORAGE_KEYS.READER_PROFILE, JSON.stringify(profile));
  },

  updateReaderProfile: (updates: Partial<ReaderProfile>): ReaderProfile => {
    const current = storageService.getReaderProfile();
    const updated = { ...current, ...updates };
    storageService.saveReaderProfile(updated);
    return updated;
  },
  
isDemiurge: (): boolean => {
  const userEmail = localStorage.getItem('user_email') || '';
  return DEMIURGE_EMAILS.includes(userEmail);
},
  // ---- ОЧИСТКА ----
  clearAll: (): void => {
    localStorage.removeItem(STORAGE_KEYS.GLOBAL_BOOKS);
    localStorage.removeItem(STORAGE_KEYS.PERSONAL_BOOKS);
    localStorage.removeItem(STORAGE_KEYS.EDIT_PROPOSALS);
    localStorage.removeItem(STORAGE_KEYS.READER_PROFILE);
  },
};