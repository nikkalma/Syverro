import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api/client';
import { Book } from '../types/book';
import { ReadingSession } from '../types/session.types';
import { Quote } from '../types/quote.types';
import { useStore } from '../store';

interface SyncItem {
  id: string;
  updated_at: string;
  data: any;
}

interface SyncRequest {
  last_sync?: string;
  books: SyncItem[];
  sessions: SyncItem[];
  quotes: SyncItem[];
}

export const syncService = {
  async sync(books: Book[], sessions: ReadingSession[], quotes: Quote[]) {
    try {
      // Получаем время последней синхронизации
      const lastSync = await AsyncStorage.getItem('@last_sync');
      
      const payload: SyncRequest = {
        last_sync: lastSync || undefined,
        books: books.map(book => ({
          id: book.id,
          updated_at: new Date(book.updatedAt || book.createdAt || Date.now()).toISOString(),
          data: {
            title: book.title,
            author: book.author,
            genres: book.genres,
            totalPages: book.totalPages,
            cover: book.cover,
            status: book.status,
            currentPage: book.currentPage,
            favorite: book.favorite,
            notes: book.notes,
            review: book.review,
          },
        })),
        sessions: sessions.map(session => ({
          id: session.id,
          updated_at: new Date(session.updatedAt || session.startTime).toISOString(),
          data: {
            bookId: session.bookId,
            startPage: session.startPage,
            endPage: session.endPage,
            pagesRead: session.pagesRead,
            durationSeconds: session.duration,
            startTime: session.startTime,
            endTime: session.endTime,
            date: session.date,
          },
        })),
        quotes: quotes.map(quote => ({
          id: quote.id,
          updated_at: new Date(quote.updatedAt || quote.createdAt).toISOString(),
          data: {
            bookId: quote.bookId,
            text: quote.text,
            page: quote.page,
            note: quote.note,
          },
        })),
      };

      const response = await apiClient.post('/api/v1/sync', payload);
      
      // Сохраняем время синхронизации
      if (response.data.server_time) {
        await AsyncStorage.setItem('@last_sync', response.data.server_time);
      }
      
      // Применяем изменения с сервера
      if (response.data) {
        const store = useStore.getState();
        
        // Обновляем книги
        if (response.data.books?.length) {
          store.mergeBooks(response.data.books);
        }
        
        // Обновляем сессии
        if (response.data.sessions?.length) {
          store.mergeSessions(response.data.sessions);
        }
        
        // Обновляем цитаты
        if (response.data.quotes?.length) {
          store.mergeQuotes(response.data.quotes);
        }
      }
      
      console.log('✅ Sync completed at:', response.data.server_time);
      return response.data;
      
    } catch (error) {
      console.error('❌ Sync failed:', error);
      throw error;
    }
  },
  
  // Принудительная синхронизация (игнорирует last_sync)
  async forceSync(books: Book[], sessions: ReadingSession[], quotes: Quote[]) {
    await AsyncStorage.removeItem('@last_sync');
    return this.sync(books, sessions, quotes);
  },
};