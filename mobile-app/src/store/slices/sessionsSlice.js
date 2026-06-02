// src/store/slices/sessionsSlice.js

export const createSessionsSlice = (set, get) => ({
  sessions: [],
  activeSession: null,

  startSession: (bookId, startPage = 0) => {
    const { activeSession, books } = get();
    if (activeSession) return null;
    
    const book = books.find(b => b.id === bookId);
    if (!book) return null;

    const newSession = {
      id: Date.now().toString(),
      bookId,
      bookTitle: book.title,
      bookAuthor: book.author,
      startTime: Date.now(),
      startPage: startPage || book.currentPage || 0,
      endPage: null,
      pagesRead: 0,
      duration: 0,
      status: 'active',
    };
    set({ activeSession: newSession });
    return newSession;
  },

  updateSessionPage: (page) => {
    const { activeSession } = get();
    if (!activeSession || activeSession.status !== 'active') return;
    set({
      activeSession: {
        ...activeSession,
        endPage: page,
        pagesRead: Math.max(0, page - activeSession.startPage),
      }
    });
  },

  endSession: (endPage) => {
    const { activeSession, sessions } = get();
    if (!activeSession || activeSession.status !== 'active') return null;

    const now = Date.now();
    const durationSeconds = Math.floor((now - activeSession.startTime) / 1000);
    const finalEndPage = endPage !== undefined ? endPage : activeSession.endPage || activeSession.startPage;
    const pagesRead = Math.max(0, finalEndPage - activeSession.startPage);

    const completedSession = {
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

    // Обновляем прогресс книги
    const { books, updateBookProgress } = get();
    const book = books.find(b => b.id === activeSession.bookId);
    if (book && pagesRead > 0) {
      const currentPages = (book.currentPage || 0) + pagesRead;
      if (updateBookProgress) {
        updateBookProgress(activeSession.bookId, {
          currentPage: currentPages,
          lastRead: now,
        });
      }
    }
    return completedSession;
  },

  cancelSession: () => {
    const { activeSession } = get();
    if (!activeSession) return;
    set({ activeSession: null });
  },

  getBookSessions: (bookId) => {
    const { sessions, activeSession } = get();
    const bookSessions = sessions.filter(s => s.bookId === bookId);
    if (activeSession && activeSession.bookId === bookId) {
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
});