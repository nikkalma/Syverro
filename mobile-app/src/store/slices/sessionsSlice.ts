// src/store/slices/sessionsSlice.ts
import { StateCreator } from 'zustand';
import { ReadingSession, NewSession } from '../../types/session.types';

export interface SessionsSlice {
  sessions: ReadingSession[];
  activeSession: ReadingSession | null;
  
  addSession: (session: NewSession) => void;
  startSession: (bookId: string, startPage?: number) => ReadingSession | null;
  updateSessionPage: (page: number) => void;
  endSession: (endPage?: number) => ReadingSession | null;
  cancelSession: () => void;
  getBookSessions: (bookId: string) => ReadingSession[];
  getBookStats: (bookId: string) => {
    totalSessions: number;
    totalPagesRead: number;
    totalTimeSeconds: number;
    lastSession: number | null;
  };
  getTotalStats: () => {
    totalSessions: number;
    totalPagesRead: number;
    totalTimeSeconds: number;
  };
  deleteSession: (sessionId: string) => void;
  deleteSessionsByBook: (bookId: string) => void;
  deleteAllSessions: () => void;
}

export const createSessionsSlice: StateCreator<SessionsSlice> = (set, get) => ({
  sessions: [],
  activeSession: null,

  addSession: (session) => {
    const newSession: ReadingSession = {
      ...session,
      id: Date.now().toString(),
    };
    set((state) => ({
      sessions: [newSession, ...state.sessions]
    }));
  },

  startSession: (bookId, startPage = 0) => {
    const { activeSession, books } = get() as any;
    if (activeSession) return null;
    
    const book = books.find((b: any) => b.id === bookId);
    if (!book) return null;

    const newSession: ReadingSession = {
      id: Date.now().toString(),
      bookId,
      bookTitle: book.title,
      bookAuthor: book.author,
      startTime: Date.now(),
      startPage: startPage || book.currentPage || 0,
      endPage: startPage || book.currentPage || 0,
      pagesRead: 0,
      duration: 0,
      date: new Date().toISOString(),
      status: 'active',
      endTime: null,
    };
    
    set({ activeSession: newSession });
    return newSession;
  },

  updateSessionPage: (page) => {
    const { activeSession } = get();
    if (!activeSession || activeSession.status !== 'active') return;
    
    const pagesRead = Math.max(0, page - activeSession.startPage);
    set({
      activeSession: {
        ...activeSession,
        endPage: page,
        pagesRead,
      }
    });
  },

  endSession: (endPage) => {
    const { activeSession, sessions, books, updateBookProgress } = get() as any;
    if (!activeSession || activeSession.status !== 'active') return null;

    const now = Date.now();
    const durationSeconds = Math.floor((now - activeSession.startTime) / 1000);
    const finalEndPage = endPage !== undefined ? endPage : activeSession.endPage || activeSession.startPage;
    const pagesRead = Math.max(0, finalEndPage - activeSession.startPage);

    const completedSession: ReadingSession = {
      ...activeSession,
      endTime: now,
      endPage: finalEndPage,
      pagesRead,
      duration: durationSeconds,
      status: 'completed',
    };

    set({
      activeSession: null,
      sessions: [completedSession, ...sessions],
    });

    const book = books.find((b: any) => b.id === activeSession.bookId);
    if (book && pagesRead > 0 && updateBookProgress) {
      updateBookProgress(activeSession.bookId, {
        currentPage: finalEndPage,
        lastRead: now.toString(),
      });
    }
    
    return completedSession;
  },

  cancelSession: () => {
    set({ activeSession: null });
  },

  getBookSessions: (bookId) => {
    const { sessions, activeSession } = get();
    const bookSessions = sessions.filter(s => s.bookId === bookId && s.status === 'completed');
    if (activeSession && activeSession.bookId === bookId && activeSession.status === 'active') {
      return [activeSession, ...bookSessions];
    }
    return bookSessions;
  },

  getBookStats: (bookId) => {
    const sessions = get().getBookSessions(bookId);
    const completedSessions = sessions.filter(s => s.status === 'completed');
    return {
      totalSessions: completedSessions.length,
      totalPagesRead: completedSessions.reduce((sum, s) => sum + (s.pagesRead || 0), 0),
      totalTimeSeconds: completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0),
      lastSession: completedSessions[0]?.endTime || null,
    };
  },

  getTotalStats: () => {
    const { sessions } = get();
    const completedSessions = sessions.filter(s => s.status === 'completed');
    return {
      totalSessions: completedSessions.length,
      totalPagesRead: completedSessions.reduce((sum, s) => sum + (s.pagesRead || 0), 0),
      totalTimeSeconds: completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0),
    };
  },

  deleteSession: (sessionId) => {
    set((state) => ({
      sessions: state.sessions.filter(s => s.id !== sessionId)
    }));
  },

  deleteSessionsByBook: (bookId) => {
    set((state) => ({
      sessions: state.sessions.filter(s => s.bookId !== bookId)
    }));
  },

  deleteAllSessions: () => {
    set({ sessions: [] });
  },
});