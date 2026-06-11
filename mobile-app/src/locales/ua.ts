const ua = {
  // === НАВІГАЦІЯ ===
  tabs: {
    profile: 'Профіль',
    library: 'Бібліотека',
    session: 'Сесія',
    settings: 'Налаштування',
  },

  screens: {
    bookDetails: 'Про книгу',
    quotes: 'Цитати',
    favorites: 'Обране',
    about: 'Про додаток',
  },

  // === КАЛЕНДАР ===
  calendar: {
    mon: 'Пн',
    tue: 'Вт',
    wed: 'Ср',
    thu: 'Чт',
    fri: 'Пт',
    sat: 'Сб',
    sun: 'Нд',
    months: {
      january: 'Січень',
      february: 'Лютий',
      march: 'Березень',
      april: 'Квітень',
      may: 'Травень',
      june: 'Червень',
      july: 'Липень',
      august: 'Серпень',
      september: 'Вересень',
      october: 'Жовтень',
      november: 'Листопад',
      december: 'Грудень',
    },
  },

  // === ЗАГАЛЬНЕ ===
  common: {
    error: 'Помилка',
    success: 'Успіх!',
    confirm: 'Підтвердження',
    ok: 'OK',
    back: 'Назад',
    save: 'Зберегти',
    cancel: 'Скасувати',
    edit: 'Редагувати',
    delete: 'Видалити',
    add: 'Додати',
    close: 'Закрити',
    clear: 'Очистити',
    none: 'Немає',
    found: 'Знайдено',
    notFound: 'Нічого не знайдено',
    loading: 'Завантаження...',
    bookAdded: 'Книгу додано',
    unknownAuthor: 'Невідомий автор',
    noBooksWithStatus: 'Немає книг з таким статусом',
  },

  buttons: {
    addBook: '+ Додати книгу',
    save: 'Зберегти',
    cancel: 'Скасувати',
    edit: 'Редагувати',
    delete: 'Видалити',
    import: '📥 Імпорт',
    export: '📤 Експорт',
    share: 'Поділитися',
  },

  // === ДОДАТОК ===
  app: {
    title: 'Сіверро',
    version: '1.0.0',
    tagline: 'Тихий простір для читання та роздумів',
  },

  // === НАЛАШТУВАННЯ ===
  settings: {
    title: 'Налаштування',
    appearance: 'Зовнішній вигляд',
    language: 'Мова',
    data: 'Дані',
    exportData: 'Експорт даних',
    importData: 'Імпорт даних',
    clearData: 'Очистити дані',
    resetStats: 'Скинути статистику',
    about: 'Про додаток',
  },

  // === ТЕМА ===
  theme: {
    title: 'Тема',
    light: 'Світла',
    dark: 'Темна',
    system: 'Системна',
  },

  // === МОВА ===
  language: {
    title: 'Мова',
    russian: 'Русский',
    english: 'English',
    belarusian: 'Беларуская',
    ukrainian: 'Українська',
    updated: 'Мову змінено',
  },

  // === БІБЛІОТЕКА ===
  library: {
    title: 'Бібліотека',
    search: 'Пошук за назвою, автором, жанром...',
    filters: 'Фільтр',
    sort: 'Сортувати',
  },

  // === ФІЛЬТРИ ===
  filters: {
    all: 'Всі',
    finished: 'Прочитано',
    reading: 'Читаю',
    planned: 'В планах',
    postponed: 'Відкладено',
    abandoned: 'Кинуто',
    rereading: 'Перечитую',
  },

  // === СОРТУВАННЯ ===
  sort: {
    button: 'Сортувати',
    title: 'Сортувати за',
    byDate: 'За датою додавання',
    byTitle: 'За назвою',
    byAuthor: 'За автором',
    byRating: 'За оцінкою',
    byProgress: 'За прогресом',
  },

  // === СТАТУСИ КНИГ ===
  status: {
    planned: 'в планах',
    reading: 'читаю',
    finished: 'прочитано',
    postponed: 'відкладено',
    abandoned: 'кинуто',
    rereading: 'перечитую',
  },

  // === ПОЛЯ КНИГИ ===
  fields: {
    title: 'Назва',
    author: 'Автор',
    status: 'Статус',
    rating: 'Оцінка',
    section: 'Розділ',
    genres: 'Жанри',
    pages: 'Сторінок',
    startDate: 'Дата початку',
    endDate: 'Дата закінчення',
    notes: 'Нотатки',
    languages: 'Мова читання',
    review: 'Рецензія',
    authorCountry: 'Країна автора',
    series: 'Серія',
    seriesPosition: 'Номер у серії',
    originalYear: 'Рік оригіналу',
    readingFormat: 'Формат',
    cover: 'Обкладинка',
    progress: 'Прогрес',
  },

  // === ПЛЕЙСХОЛДЕРИ ===
  placeholders: {
    title: 'Назва',
    author: 'Автор',
    section: 'Розділ (Країна, століття)',
    genres: 'Жанри через кому',
    pages: 'Кількість сторінок',
    startDate: 'ДД.ММ.РРРР',
    endDate: 'ДД.ММ.РРРР',
    notes: 'Нотатки / відгук',
    search: 'Пошук за назвою, автором, жанром...',
    authorCountry: 'Наприклад: Україна, США, Франція',
    series: 'Назва серії',
    seriesPosition: 'Наприклад: 1, 2, 3...',
    originalYear: 'Наприклад: 2020',
    review: 'Поділіться враженнями про книгу...',
  },

  // === ЛІЧИЛЬНИКИ ===
  counters: {
    total: 'Всього',
    finished: 'Прочитано',
    reading: 'Читаю',
    planned: 'В планах',
    books: 'кн.',
  },

  // === ПУСТІ СТАНИ ===
  empty: {
    title: '📭 Немає книг',
    subtitle: 'Натисніть ➕, щоб додати',
    library: 'Бібліотека порожня',
    favorites: 'Немає обраних книг',
    quotes: 'Немає цитат',
    sessions: 'Немає сесій',
  },

  // === ДІЇ ===
  actions: {
    deleteTitle: 'Видалення',
    deleteConfirm: 'Точно видалити?',
    delete: 'Видалити',
    cancel: 'Скасувати',
  },

  // === ПРОФІЛЬ ===
  profile: {
    title: 'Профіль',
    readerLevel: 'Рівень читача',
    stats: 'Статистика',
    defaultName: 'Читач',
    memberSince: 'Читач з',
    favoriteBooks: 'Обрані книги',
    quotes: 'Мої цитати',
    settings: 'Налаштування',
    about: 'Про додаток',
    total: 'Всього',
    read: 'Прочитано',
  },

  // === СТАТИСТИКА ===
  statistics: {
    title: 'Статистика читання',
    subtitle: 'Ваші досягнення',
    totalBooks: 'Всього книг',
    totalPages: 'Прочитано сторінок',
    totalHours: 'Годин читання',
    averageSpeed: 'Середня швидкість',
    bestDay: 'Найкращий день',
    weeklyActivity: 'Активність за тиждень',
  },

  // === ІНСАЙТИ ===
  insights: {
    title: 'Інсайти',
    progress: 'Прогрес читання',
    finished: 'Прочитано',
    total: 'Всього',
    topGenres: 'Топ-3 жанри',
    noGenreData: 'Немає даних',
    books: 'кн.',
    addFirstBook: 'Додайте першу книгу',
    justStarted: 'Ви тільки почали',
    goodStart: 'Чудовий старт',
    bookworm: 'Книжковий черв\'як',
    bookKing: 'Книжковий король',
    emptyMessage: 'Додайте більше книг та завершіть кілька сесій читання, щоб побачити персональну статистику.',
  },

  // === СЕСІЇ ЧИТАННЯ ===
  session: {
    title: 'Сесії',
    noActiveBookTitle: 'Немає активної книги',
    noActiveBookMessage: 'Будь ласка, оберіть книгу для читання',
    startSession: 'Почати сесію',
    endSession: 'Завершити сесію',
    currentPage: 'Поточна сторінка',
    startPage: 'Початкова сторінка',
    endPage: 'Фінальна сторінка',
    ofPages: 'з',
    pagesRead: 'стор.',
    duration: 'Тривалість',
    invalidPage: 'Введіть сторінку від {current} до {total}',
    sessionComplete: 'Прочитано {pages} сторінок за {minutes} хв.',
    enterEndPage: 'Введіть фінальну сторінку',
    enterEndPageError: 'Будь ласка, введіть фінальну сторінку',
    endPageMustBeGreater: 'Фінальна сторінка має бути більшою за {start}',
    pause: 'Пауза',
    resume: 'Продовжити',
    paused: 'Пауза',
    history: 'Історія читання',
    selectBook: 'Оберіть книгу',
    currentBook: '📖 Поточна книга',
    readingBooks: '📚 У процесі читання',
    setStartPage: 'Вказати початкову сторінку',
    startPageQuestion: 'З якої сторінки ви почали читати цю книгу?',
    clearHistory: 'Очистити історію',
    clearHistoryMessage: 'Всі сесії для книги "{title}" будуть видалені.',
    deleteSession: 'Видалити сесію?',
    deleteSessionConfirm: 'Цю дію не можна скасувати.',
  },

  // === ЦИТАТИ ===
  quotes: {
    title: 'Мої цитати',
    addButton: '📜 Додати цитату',
    quotePlaceholder: 'Введіть цитату...',
    pagePlaceholder: 'Номер сторінки',
    notePlaceholder: 'Ваші думки про цитату...',
    save: 'Зберегти',
    cancel: 'Скасувати',
    deleteConfirm: 'Видалити цитату?',
    deleteConfirmMessage: 'Цю дію не можна скасувати',
    emptyTitle: 'Немає цитат',
    emptyMessage: 'Додайте цитату під час сесії читання',
    quoteOfDay: 'Цитата дня',
    editNote: 'Редагувати коментар',
    delete: 'Видалити',
    voiceInput: 'Диктувати голосом',
    voiceInputDeveloping: 'Голосове введення в розробці',
    enterQuoteText: 'Введіть текст цитати',
    quoteSaved: 'Цитату збережено',
    page: 'стор.',
    readingTime: 'читання',
    comment: 'Коментар',
  },

  // === ОБРАНІ КНИГИ ===
  favoriteBooks: {
    title: 'Обрані книги',
    emptyTitle: 'Немає обраних книг',
    emptyMessage: 'Додавайте книги до обраного, щоб вони відображалися тут',
  },

  // === ПРО ДОДАТОК ===
  about: {
    title: 'Про Syverro',
    version: 'Версія',
    tagline: 'Тихий простір для читання та роздумів',
    philosophyTitle: 'Філософія',
    description: 'Syverro — це не просто каталог прочитаних книг. Це простір, де читання стає частиною особистої інтелектуальної історії. Зберігайте книги, думки та спостереження, помічайте власні патерни та поступово формуйте бібліотеку ідей.',
    risTitle: 'Reading Intelligence System',
    risDescription: 'RIS розглядає читання як процес формування мислення. Книги — це не окремі елементи списку, а взаємопов\'язані точки на мапі знань, інтересів та досвіду. Syverro допомагає побачити ці зв\'язки та зберегти їх.',
    contactTitle: 'Зв\'язатися',
    shareMessage: 'Читання як частина інтелектуальної історії',
    author: 'Розробник',
    email: 'Написати розробнику',
    quote: '«Порядок у книгах — порядок у голові»',
  },

  // === АВАТАР ===
  avatar: {
    select: 'Оберіть аватар',
    fromGallery: 'Вибрати з галереї',
    delete: 'Видалити аватар',
    orEmoji: '— або оберіть емодзі —',
    permissionDenied: 'Потрібен дозвіл для доступу до галереї',
    updated: 'Аватар оновлено',
    uploadFailed: 'Не вдалося завантажити аватар',
  },

  // === АВТОР ===
  author: {
    selectButton: 'Вибрати автора',
    modalTitle: 'Виберіть автора',
    newAuthorPlaceholder: 'Новий автор',
    noAuthors: 'Немає авторів',
  },

  // === ЖАНРИ ===
  genres: {
    addButton: 'Додати жанр',
    modalTitle: 'Виберіть жанри',
    customPlaceholder: 'Свій жанр',
  },

  // === ПОМИЛКИ ===
  errors: {
    emptyFields: 'Будь ласка, заповніть обов\'язкові поля',
    bookNotFound: 'Книгу не знайдено',
    networkError: 'Помилка мережі',
    authFailed: 'Помилка авторизації',
    syncFailed: 'Помилка синхронізації',
    exportFailed: 'Помилка експорту',
    importFailed: 'Помилка імпорту',
  },

  // === ІМПОРТ/ЕКСПОРТ ===
  import: {
    button: '📥 Імпорт',
    alertTitle: 'Імпорт',
    alertLoading: 'Завантажую книги...',
    alertSuccess: 'Готово!',
    alertError: 'Помилка',
  },

  export: {
    button: '📤 Експорт',
    alertTitle: 'Експорт',
    alertLoading: 'Експортую дані...',
    alertSuccess: 'Дані експортовано',
    alertError: 'Помилка експорту',
  },

  // === ДЕТАЛІ КНИГИ ===
  bookDetails: {
    notFound: 'Книгу не знайдено',
    deleteConfirm: 'Ви впевнені, що хочете видалити цю книгу?',
    status: 'Статус',
    progress: 'Прогрес',
    rating: 'Рейтинг',
    pages: 'стор.',
    cover: 'Обкладинка',
  },

  // === МЕНЮ ===
  menu: {
    profile: 'Мій профіль',
    stats: 'Статистика',
    insights: 'Інсайти',
    theme: 'Тема',
    language: 'Мова',
    about: 'Про додаток',
  },
};

export default ua;
export type UkrainianLocale = typeof ua;