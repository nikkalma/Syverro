import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBooksSlice, BooksSlice } from './slices/booksSlice';
import { createSessionsSlice, SessionsSlice } from './slices/sessionsSlice';
import { createQuotesSlice, QuotesSlice } from './slices/quotesSlice';
import { createProfileSlice, ProfileSlice } from './slices/profileSlice';

export type StoreState = {
  books: any[];
  activeBookId: string | null;
  sessions: any[];
  activeSession: any | null;
  quotes: any[];
  profile: any;
};

export type StoreActions = BooksSlice & SessionsSlice & QuotesSlice & ProfileSlice;
export type Store = StoreState & StoreActions;

export const useStore = create<Store>()(
  persist(
    (set, get, store) => ({
      ...createBooksSlice(set, get, store),
      ...createSessionsSlice(set, get, store),
      ...createQuotesSlice(set, get, store),
      ...createProfileSlice(set, get, store),
    }) as any,
    {
      name: 'syverro-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      partialize: (state: any) => ({
        books: state.books,
        activeBookId: state.activeBookId,
        sessions: state.sessions,
        quotes: state.quotes,
        profile: state.profile,
      }),
    }
  )
);