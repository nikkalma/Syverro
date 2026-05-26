// EVEBRARY-CHALLENGES-001
export const CHALLENGES_LIST = [
  {
    id: '3_books_month',
    title: '3 книги за месяц',
    description: 'Прочитай 3 книги за один календарный месяц',
    icon: '📚',
    target: 3,
    unit: 'books',
    period: 'monthly',
  },
  {
    id: '10_days_streak',
    title: '10 дней подряд',
    description: 'Читай каждый день в течение 10 дней подряд',
    icon: '🔥',
    target: 10,
    unit: 'days',
    period: 'streak',
  },
  {
    id: '500_pages_month',
    title: '500 страниц за месяц',
    description: 'Прочитай 500 страниц за один календарный месяц',
    icon: '📖',
    target: 500,
    unit: 'pages',
    period: 'monthly',
  },
  {
    id: 'different_genres',
    title: 'Жанровый экспансионизм',
    description: 'Прочитай книги из 3 разных жанров',
    icon: '🎭',
    target: 3,
    unit: 'genres',
    period: 'once',
  },
];

export function checkChallenges(books, currentChallenges) {
  // Создаём карту текущих челленджей для быстрого доступа
  const challengesMap = {};
  currentChallenges.forEach(ch => {
    challengesMap[ch.id] = { ...ch };
  });

  // Получаем текущий месяц и год
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Фильтруем finished книги
  const finishedBooks = books.filter(b => b.status === 'finished');

  // --- 1. Челлендж: 3 книги за месяц ---
  if (challengesMap['3_books_month']) {
    const booksThisMonth = finishedBooks.filter(book => {
      if (!book.endDate) return false;
      const endDate = new Date(book.endDate);
      return endDate.getMonth() === currentMonth && endDate.getFullYear() === currentYear;
    });
    const progress = Math.min(booksThisMonth.length, 3);
    challengesMap['3_books_month'].progress = progress;
    challengesMap['3_books_month'].status = progress >= 3 ? 'completed' : 'active';
  }

  // --- 2. Челлендж: 10 дней подряд (простая версия) ---
  if (challengesMap['10_days_streak']) {
    // Сортируем книги по дате окончания
    const dates = finishedBooks
      .filter(b => b.endDate)
      .map(b => new Date(b.endDate))
      .sort((a, b) => a - b);
    
    let longestStreak = 0;
    let currentStreak = 0;
    let lastDate = null;
    
    for (const date of dates) {
      if (lastDate) {
        const diffDays = Math.ceil((date - lastDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak++;
        } else if (diffDays === 0) {
          // Та же дата — игнорируем
          continue;
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      longestStreak = Math.max(longestStreak, currentStreak);
      lastDate = date;
    }
    
    const progress = Math.min(longestStreak, 10);
    challengesMap['10_days_streak'].progress = progress;
    challengesMap['10_days_streak'].status = progress >= 10 ? 'completed' : 'active';
  }

  // --- 3. Челлендж: 500 страниц за месяц ---
  if (challengesMap['500_pages_month']) {
    const pagesThisMonth = finishedBooks
      .filter(book => {
        if (!book.endDate || !book.pages) return false;
        const endDate = new Date(book.endDate);
        return endDate.getMonth() === currentMonth && endDate.getFullYear() === currentYear;
      })
      .reduce((sum, book) => sum + (book.pages || 0), 0);
    
    const progress = Math.min(pagesThisMonth, 500);
    challengesMap['500_pages_month'].progress = progress;
    challengesMap['500_pages_month'].status = progress >= 500 ? 'completed' : 'active';
  }

  // --- 4. Челлендж: разные жанры ---
  if (challengesMap['different_genres']) {
    const uniqueGenres = new Set();
    finishedBooks.forEach(book => {
      (book.genres || []).forEach(genre => uniqueGenres.add(genre));
    });
    const progress = Math.min(uniqueGenres.size, 3);
    challengesMap['different_genres'].progress = progress;
    challengesMap['different_genres'].status = progress >= 3 ? 'completed' : 'active';
  }

  // Преобразуем карту обратно в массив
  const updatedChallenges = Object.values(challengesMap);
  
  return updatedChallenges;
}