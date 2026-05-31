export default {
  app: { title: 'Syverro' },
  buttons: { addBook: '+ Додати книгу', save: 'Зберегти', cancel: 'Скасувати' },
  theme: { title: 'Тема', light: 'Світла', dark: 'Темна', system: 'Система' },
  language: { title: 'Мова' },
  import: { button: '📥 Імпорт', alertTitle: 'Імпорт', alertLoading: 'Завантажую книги...', alertSuccess: 'Готово!', alertError: 'Помилка' },
  books: { count: 'книг' },
  screens: { details: 'Деталі книги', back: 'Назад' },
  menu: {
    profile: 'Мій профіль',
    stats: 'Статистика',
    theme: 'Темна',
    language: 'Українська',
    about: 'Про застосунок',
  },
  placeholders: {
    title: 'Назва', author: 'Автор', section: 'Розділ (Країна, століття)',
    genres: 'Жанри через кому', pages: 'Кількість сторінок',
    startDate: 'Дата початку (ДД.ММ.РРРР)', endDate: 'Дата закінчення (ДД.ММ.РРРР)',
    notes: 'Нотатки / відгук', search: 'Пошук за назвою, автором, жанром...'
  },
  fields: {
    author: 'Автор', status: 'Статус', rating: 'Оцінка', section: 'Розділ',
    genres: 'Жанри', pages: 'Сторінок', startDate: 'Дата початку', endDate: 'Дата закінчення',
    notes: 'Нотатки', languages: 'Мова прочитання', review: 'Рецензія',
    authorCountry: 'Країна автора', series: 'Серія', seriesPosition: 'Номер у серії', originalYear: 'Рік оригіналу',
  },
  status: {
    planned: 'у планах', reading: 'читаю', finished: 'прочитано',
    postponed: 'відкладено', abandoned: 'кинуто', rereading: 'перечитую',
  },
  errors: { emptyFields: 'Будь ласка, заповніть обов\'язкові поля' },
  filters: { all: 'Всі', finished: 'Прочитано', reading: 'Читаю', planned: 'В планах' },
  sort: { button: 'Сортувати', title: 'Сортувати за', byDate: 'За датою додавання', byTitle: 'За назвою', byAuthor: 'За автором', byRating: 'За оцінкою' },
  empty: { title: '📭 Немає книг', subtitle: 'Натисніть ➕, щоб додати' },
  counters: { total: 'Всього', finished: 'Прочитано', reading: 'Читаю', planned: 'В планах' },
  actions: { deleteTitle: 'Видалення книги', deleteConfirm: 'Точно видалити', delete: 'Видалити', cancel: 'Скасувати' },
  stats: {
    title: 'Статистика', progress: 'Прогрес читання', finished: 'Прочитано', total: 'Всього',
    topGenres: 'Топ-3 жанри', noGenreData: 'Немає даних', books: 'кн.',
    addFirstBook: 'Додайте першу книгу', justStarted: 'Ви тільки почали',
    goodStart: 'Чудовий старт', bookworm: 'Книжковий черв\'як', bookKing: 'Книжковий король',
  },
  
};