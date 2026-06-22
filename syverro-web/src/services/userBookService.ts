// src/services/userBookService.ts
import type { UserBook, UserBookStatus } from '../types/userBook';

const STORAGE_KEY = 'syverro_user_books';

const getAll = (): UserBook[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as UserBook[];
    } catch {
      return [];
    }
  }
  return [];
};

const saveAll = (books: UserBook[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
};

export const userBookService = {
  getByUser: (userId: string): UserBook[] => {
    return getAll().filter((b) => b.userId === userId);
  },

  getByBook: (userId: string, bookId: string): UserBook | null => {
    return getAll().find((b) => b.userId === userId && b.bookId === bookId) || null;
  },

  add: (userId: string, bookId: string, status: UserBookStatus): UserBook => {
    const now = new Date().toISOString();
    const newBook: UserBook = {
      id: `ub_${Date.now()}`,
      userId,
      bookId,
      status,
      rereadCount: 0,
      currentPage: 0,
      addedAt: now,
      startedAt: status === 'reading' ? now : undefined,
    };
    const all = getAll();
    all.push(newBook);
    saveAll(all);
    return newBook;
  },

  update: (
    userId: string,
    bookId: string,
    updates: Partial<Omit<UserBook, 'id' | 'userId' | 'bookId' | 'addedAt'>>
  ): UserBook | null => {
    const all = getAll();
    const index = all.findIndex((b) => b.userId === userId && b.bookId === bookId);
    if (index === -1) return null;

    const current = all[index];
    const now = new Date().toISOString();

    let { status, rereadCount, startedAt, completedAt } = current;

    // ============================================
    // ЛОГИКА ПЕРЕЧИТЫВАНИЯ
    // ============================================
    if (updates.status) {
      const newStatus = updates.status;

      // finished → reading = начало перечитывания
      if (status === 'completed' && newStatus === 'reading') {
        rereadCount = (rereadCount || 0) + 1;
        startedAt = now;
        completedAt = undefined;
        status = newStatus;
      }
      // reading → finished = завершение чтения
      else if (status === 'reading' && newStatus === 'completed') {
        completedAt = now;
        status = newStatus;
      }
      // Любой другой переход
      else {
        status = newStatus;
        if (newStatus === 'reading' && !startedAt) {
          startedAt = now;
        }
        if (newStatus === 'completed' && !completedAt) {
          completedAt = now;
        }
      }
    }

    const updated: UserBook = {
      ...current,
      ...updates,
      status,
      rereadCount,
      startedAt,
      completedAt,
    };

    all[index] = updated;
    saveAll(all);
    return updated;
  },

  remove: (userId: string, bookId: string): void => {
    const all = getAll();
    saveAll(all.filter((b) => !(b.userId === userId && b.bookId === bookId)));
  },

  getWithProgress: (userId: string, bookId: string, totalPages?: number) => {
    const userBook = userBookService.getByBook(userId, bookId);
    if (!userBook) return null;

    const progress = totalPages && totalPages > 0
      ? Math.round((userBook.currentPage / totalPages) * 100)
      : 0;

    return {
      ...userBook,
      progress,
      totalPages: totalPages || 0,
    };
  },
};