// SYVERRO-ACHIEVEMENTS-FULL-001
export const ACHIEVEMENTS_LIST = [
  { id: 'first_book', title: 'Ну, началось', description: 'Добавить первую книгу', icon: '📖' },
  { id: 'first_finished', title: 'Читатель', description: 'Прочитать первую книгу', icon: '✅' },
  { id: 'gold_star', title: 'Золотая звезда', description: 'Поставить оценку 5', icon: '⭐' },
  { id: 'first_review', title: 'Критик с дивана', description: 'Написать первую рецензию', icon: '📝' },
  { id: 'bookworm_10', title: 'Уже не остановить', description: 'Прочитать 10 книг', icon: '🐛', progressMax: 10 },
  { id: 'bookworm_50', title: 'Пора лечиться', description: 'Прочитать 50 книг', icon: '📚', progressMax: 50 },
  { id: 'bookworm_100', title: 'Библиотекарь-самоучка', description: 'Прочитать 100 книг', icon: '🏛️', progressMax: 100 },
  { id: 'pages_500', title: 'Разогрев', description: 'Прочитать 500 страниц', icon: '📄', progressMax: 500 },
  { id: 'pages_1000', title: 'Многостраничник', description: 'Прочитать 1000 страниц', icon: '📖', progressMax: 1000 },
  { id: 'polyglot', title: 'Полиглот-недоучка', description: 'Книги на 3+ языках', icon: '🗣️' },
  { id: 'genre_mess', title: 'Жанровый хаос', description: '5+ жанров', icon: '🎭' },
  { id: 'devoted_reader', title: 'Преданный читатель', description: '3 книги одного автора', icon: '❤️' },
  { id: 'world_trip', title: 'Кругосветка за год', description: 'Авторы из 5+ стран', icon: '🌍' },
  { id: 'graphomaniac', title: 'Графоман', description: '5+ рецензий', icon: '✍️' },
  { id: 'gave_up', title: 'Бросил на середине', description: 'Книга со статусом "брошено"', icon: '😩' },
  { id: 'old_school', title: 'Олдскул', description: 'Книга XIX века', icon: '📜' },
  { id: 'zoomer', title: 'Зумер', description: 'Книга после 2000 года', icon: '📱' },
];

export function checkAchievements(books, currentUnlocked, currentProgress, previousUnlocked = null) {
  let unlocked = [...currentUnlocked];
  let progress = { ...currentProgress };
  let newlyUnlocked = null;

  const finishedBooks = books.filter(b => b.status === 'finished');
  const finishedCount = finishedBooks.length;
  const totalPages = finishedBooks.reduce((sum, b) => sum + (b.pages || 0), 0);
  const hasFiveStar = books.some(b => Number(b.rating) === 5);
  const hasReview = books.some(b => b.review && b.review.length > 50);
  const hasAbandoned = books.some(b => b.status === 'abandoned');
  
  const uniqueLanguages = new Set();
  books.forEach(b => (b.languages || []).forEach(lang => uniqueLanguages.add(lang)));
  const languagesCount = uniqueLanguages.size;
  
  const uniqueGenres = new Set();
  books.forEach(b => (b.genres || []).forEach(genre => uniqueGenres.add(genre)));
  const genresCount = uniqueGenres.size;
  
  const authorCounts = {};
  books.forEach(b => { if (b.author) authorCounts[b.author] = (authorCounts[b.author] || 0) + 1; });
  const hasThreeByOneAuthor = Object.values(authorCounts).some(count => count >= 3);
  
  const uniqueCountries = new Set();
  books.forEach(b => { if (b.authorCountry) uniqueCountries.add(b.authorCountry); });
  const countriesCount = uniqueCountries.size;
  
  const reviewsCount = books.filter(b => b.review && b.review.length > 50).length;
  const hasOldBook = books.some(b => b.originalYear && b.originalYear >= 1800 && b.originalYear <= 1899);
  const hasNewBook = books.some(b => b.originalYear && b.originalYear >= 2000);

  // Прогресс
  progress.bookworm_10 = finishedCount;
  progress.bookworm_50 = finishedCount;
  progress.bookworm_100 = finishedCount;
  progress.pages_500 = totalPages;
  progress.pages_1000 = totalPages;
  progress.polyglot = languagesCount;
  progress.genre_mess = genresCount;
  progress.world_trip = countriesCount;
  progress.graphomaniac = reviewsCount;

  // Проверка
  if (books.length >= 1 && !unlocked.includes('first_book')) unlocked.push('first_book');
  if (finishedCount >= 1 && !unlocked.includes('first_finished')) unlocked.push('first_finished');
  if (finishedCount >= 10 && !unlocked.includes('bookworm_10')) unlocked.push('bookworm_10');
  if (finishedCount >= 50 && !unlocked.includes('bookworm_50')) unlocked.push('bookworm_50');
  if (finishedCount >= 100 && !unlocked.includes('bookworm_100')) unlocked.push('bookworm_100');
  if (totalPages >= 500 && !unlocked.includes('pages_500')) unlocked.push('pages_500');
  if (totalPages >= 1000 && !unlocked.includes('pages_1000')) unlocked.push('pages_1000');
  if (hasFiveStar && !unlocked.includes('gold_star')) unlocked.push('gold_star');
  if (hasReview && !unlocked.includes('first_review')) unlocked.push('first_review');
  if (languagesCount >= 3 && !unlocked.includes('polyglot')) unlocked.push('polyglot');
  if (genresCount >= 5 && !unlocked.includes('genre_mess')) unlocked.push('genre_mess');
  if (hasThreeByOneAuthor && !unlocked.includes('devoted_reader')) unlocked.push('devoted_reader');
  if (countriesCount >= 5 && !unlocked.includes('world_trip')) unlocked.push('world_trip');
  if (reviewsCount >= 5 && !unlocked.includes('graphomaniac')) unlocked.push('graphomaniac');
  if (hasAbandoned && !unlocked.includes('gave_up')) unlocked.push('gave_up');
  if (hasOldBook && !unlocked.includes('old_school')) unlocked.push('old_school');
  if (hasNewBook && !unlocked.includes('zoomer')) unlocked.push('zoomer');

  // Определяем новую ачивку
  if (previousUnlocked && unlocked.length > previousUnlocked.length) {
    const newAchievement = unlocked.find(id => !previousUnlocked.includes(id));
    if (newAchievement) {
      newlyUnlocked = newAchievement;
    }
  }

  return { unlocked, progress, newlyUnlocked };
}