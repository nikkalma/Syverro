import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBooksSlice } from './slices/booksSlice';
import { createSessionsSlice } from './slices/sessionsSlice';
import { createQuotesSlice } from './slices/quotesSlice';
import { createProfileSlice } from './slices/profileSlice';


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
      onRehydrateStorage: () => (state) => {
        console.log('🔄 1. Регидратация началась');
        if (state) {
          console.log('🔄 2. State загружен:', {
            books: state.books?.length,
            sessions: state.sessions?.length,
            quotes: state.quotes?.length,
            profile: state.profile?.name,
          });
          setTimeout(() => {
            if (state.migrateFromactiveBookId) {
              console.log('🔄 3. Запускаем миграцию');
              state.migrateFromactiveBookId();
            }
          }, 0);
        } else {
          console.log('🔄 2. State пустой');
        }
      },
    }
  )
);

export default useStore;