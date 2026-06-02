// src/screens/ProfileScreen/hooks/useProfileStats.js
import { useStore } from '../../store';

export const useProfileStats = () => {
  const { books, sessions } = useStore();
  
  const totalBooks = books.length;
  const finishedBooks = books.filter(b => b.status === 'finished').length;
  const totalSessions = sessions.length;
  const totalHours = sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 3600;
  
  // Только прочитанные книги
  const finishedBooksList = books.filter(b => b.status === 'finished');
  const totalPagesRead = finishedBooksList.reduce((sum, b) => sum + (b.totalPages || 0), 0);
  const averageRatingFinished = finishedBooksList.length > 0
    ? finishedBooksList.reduce((sum, b) => sum + (b.rating || 0), 0) / finishedBooksList.length
    : 0;
  
  // Топ жанров (только прочитанные)
  const genreMap = new Map();
  finishedBooksList.forEach(book => {
    if (book.genres && Array.isArray(book.genres)) {
      book.genres.forEach(genre => {
        genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
      });
    }
  });
  const topGenres = Array.from(genreMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  // Активность по дням
  const weekdayActivity = [0, 0, 0, 0, 0, 0, 0];
  sessions.forEach(session => {
    if (session.startTime) {
      const day = new Date(session.startTime).getDay();
      weekdayActivity[day] += session.duration || 0;
    }
  });
  
  // Прогресс для кольца
  const completionPercentage = totalBooks > 0 ? (finishedBooks / totalBooks) * 100 : 0;
  
  // Наблюдения
  const getObservations = (locale) => {
    const obs = [];
    if (locale === 'ru') {
      if (totalHours > 0 && totalHours < 10) obs.push("🌙 Вы только начинаете свой читательский путь");
      if (totalBooks > 50) obs.push("📚 Настоящий книжный червь! 50+ книг в библиотеке");
      if (averageRatingFinished > 4) obs.push("⭐ У вас отличный вкус в литературе");
      if (topGenres[0]) obs.push(`🎭 Ваш главный жанр: ${topGenres[0][0]}`);
    } else {
      if (totalHours > 0 && totalHours < 10) obs.push("🌙 You're just starting your reading journey");
      if (totalBooks > 50) obs.push("📚 A true bookworm! 50+ books in your library");
      if (averageRatingFinished > 4) obs.push("⭐ You have excellent taste in books");
      if (topGenres[0]) obs.push(`🎭 Your top genre: ${topGenres[0][0]}`);
    }
    return obs;
  };
  
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
    getObservations,
  };
};