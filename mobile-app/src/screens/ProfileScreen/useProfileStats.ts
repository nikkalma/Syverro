// src/screens/ProfileScreen/useProfileStats.ts
import { useStore } from '../../store';
import type { Book } from '../../types/book.types';

interface ProfileStats {
  books: Book[];
  totalBooks: number;
  finishedBooks: number;
  totalSessions: number;
  totalHours: number;
  totalPagesRead: number;
  averageRatingFinished: number;
  topGenres: [string, number][];
  weekdayActivity: number[];
  completionPercentage: number;
  favoriteCount: number;
}

export const useProfileStats = (): ProfileStats => {
  const { books, sessions } = useStore();
  
  // Базовая статистика
  const totalBooks = books.length;
  const finishedBooks = books.filter(b => b.status === 'finished').length;
  const favoriteCount = books.filter(b => b.favorite === true).length;
  const totalSessions = sessions.length;
  const totalHours = sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 3600;
  
  // Статистика по прочитанным книгам
  const finishedBooksList = books.filter(b => b.status === 'finished');
  const totalPagesRead = finishedBooksList.reduce((sum, b) => sum + (b.totalPages || 0), 0);
  const averageRatingFinished = finishedBooksList.length > 0
    ? finishedBooksList.reduce((sum, b) => sum + (b.rating || 0), 0) / finishedBooksList.length
    : 0;
  
  // Топ жанров (только finished, reading, rereading)
  const relevantStatuses = ['finished', 'reading', 'rereading'];
  const relevantBooks = books.filter(b => relevantStatuses.includes(b.status));
  
  const genreMap = new Map<string, number>();
  relevantBooks.forEach(book => {
    if (book.genres && Array.isArray(book.genres)) {
      book.genres.forEach((genre: string) => {  // ← добавить тип
  genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
});
    }
  });
  const topGenres = Array.from(genreMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  // Активность по дням недели (Пн=0, Вс=6)
  const weekdayActivity = [0, 0, 0, 0, 0, 0, 0];
  sessions.forEach(session => {
    if (session.startTime) {
      const day = new Date(session.startTime).getDay();
      const adjustedDay = day === 0 ? 6 : day - 1; // воскресенье → 6, понедельник → 0
      weekdayActivity[adjustedDay] += session.duration || 0;
    }
  });
  
  // Процент завершённых книг
  const completionPercentage = totalBooks > 0 ? (finishedBooks / totalBooks) * 100 : 0;
  
  return {
    books,
    totalBooks,
    finishedBooks,
    totalSessions,
    totalHours,
    totalPagesRead,
    averageRatingFinished,
    topGenres,
    weekdayActivity,
    completionPercentage,
    favoriteCount,
  };
};