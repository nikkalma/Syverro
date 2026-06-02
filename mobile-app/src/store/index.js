import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBooksSlice } from './slices/booksSlice';
import { createSessionsSlice } from './slices/sessionsSlice';
import { createQuotesSlice } from './slices/quotesSlice';
import { createProfileSlice } from './slices/profileSlice';

// Функция миграции: конвертирует старый isActive в новый activeBookId
const migrateFromIsActive = (persistedState) => {
  if (!persistedState) return persistedState;
  
  const state = { ...persistedState };
  
  // Если есть книги с isActive, конвертируем в activeBookId
  if (state.books && Array.isArray(state.books)) {
    const activeBook = state.books.find(book => book.isActive === true);
    if (activeBook && !state.activeBookId) {
      state.activeBookId = activeBook.id;
      // Удаляем isActive из всех книг
      state.books = state.books.map(book => {
        const { isActive, ...rest } = book;
        return rest;
      });
      console.log('✅ Миграция: isActive → activeBookId, активная книга:', state.activeBookId);
    }
  }
  
  return state;
};

const useStore = create(
  persist(
    (set, get, store) => ({
      ...createBooksSlice(set, get, store),
      ...createSessionsSlice(set, get, store),
      ...createQuotesSlice(set, get, store),
      ...createProfileSlice(set, get, store),
    }),
    {
      name: 'syverro-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persistedState, version) => {
        console.log('🔄 Миграция с версии', version);
        if (version === 1) {
          return migrateFromIsActive(persistedState);
        }
        return persistedState;
      },
      // 🔥 ДОБАВЛЯЕМ partialize — явно указываем, что сохранять
      partialize: (state) => ({
        books: state.books,
        activeBookId: state.activeBookId,  // ← КЛЮЧЕВАЯ СТРОКА
        sessions: state.sessions,
        quotes: state.quotes,
        profile: state.profile,
      }),
      onRehydrateStorage: () => (state) => {
        console.log('🔄 Регидратация началась');
        if (state) {
          console.log('📚 Книг:', state.books?.length);
          console.log('📖 Сессий:', state.sessions?.length);
          console.log('💬 Цитат:', state.quotes?.length);
          console.log('👤 Профиль:', state.profile?.name);
          console.log('🎯 Активная книга:', state.activeBookId);
        }
      },
    }
  )
);

export { useStore };