const ru = {
  // === НАВИГАЦИЯ ===
  tabs: {
    profile: 'Профиль',
    library: 'Библиотека',
    session: 'Сессия',
    settings: 'Настройки',
  },

  screens: {
    bookDetails: 'О книге',
    quotes: 'Цитаты',
    favorites: 'Избранное',
    about: 'О приложении',
  },

  // === КАЛЕНДАРЬ ===
  calendar: {
    mon: 'Пн',
    tue: 'Вт',
    wed: 'Ср',
    thu: 'Чт',
    fri: 'Пт',
    sat: 'Сб',
    sun: 'Вс',
    months: {
      january: 'Январь',
      february: 'Февраль',
      march: 'Март',
      april: 'Апрель',
      may: 'Май',
      june: 'Июнь',
      july: 'Июль',
      august: 'Август',
      september: 'Сентябрь',
      october: 'Октябрь',
      november: 'Ноябрь',
      december: 'Декабрь',
    },
  },

  // === ОБЩЕЕ ===
  common: {
    error: 'Ошибка',
    success: 'Успех!',
    confirm: 'Подтверждение',
    ok: 'OK',
    back: 'Назад',
    save: 'Сохранить',
    cancel: 'Отмена',
    edit: 'Редактировать',
    delete: 'Удалить',
    add: 'Добавить',
    close: 'Закрыть',
    clear: 'Очистить',
    none: 'Нет',
    found: 'Найдено',
    notFound: 'Ничего не найдено',
    loading: 'Загрузка...',
    bookAdded: 'Книга добавлена',
    unknownAuthor: 'Неизвестный автор',
    noBooksWithStatus: 'Нет книг со статусом',
  },

  buttons: {
    addBook: '+ Добавить книгу',
    save: 'Сохранить',
    cancel: 'Отмена',
    edit: 'Редактировать',
    delete: 'Удалить',
    import: '📥 Импорт',
    export: '📤 Экспорт',
    share: 'Поделиться',
    sync: '🔄 Синхронизация',
  },

  // === ПРИЛОЖЕНИЕ ===
  app: {
    title: 'Сиверро',
    version: '1.0.0',
    tagline: 'Тихое пространство для чтения и размышлений',
  },

  // === ЭКРАН НАСТРОЕК ===
  settings: {
    title: 'Настройки',
    appearance: 'Внешний вид',
    language: 'Язык',
    data: 'Данные',
    exportData: 'Экспорт данных',
    importData: 'Импорт данных',
    clearData: 'Очистить данные',
    resetStats: 'Сбросить статистику',
    resetStatsConfirm: 'Все сессии чтения будут удалены без возможности восстановления. Книги останутся. Продолжить?',
    statsReset: 'Статистика чтения сброшена.',
    about: 'О приложении',
    clear: 'Очистка',
  },

  // === СИНХРОНИЗАЦИЯ ===
  sync: {
    title: 'Синхронизация',
    completed: 'Данные синхронизированы',
    failed: 'Ошибка синхронизации',
    inProgress: 'Синхронизация...',
    hint: 'Отправить данные на сервер и получить обновления',
  },

  // === ТЕМА ===
  theme: {
    title: 'Тема',
    light: 'Светлая',
    dark: 'Тёмная',
    system: 'Системная',
  },

  // === ЯЗЫК ===
  language: {
    title: 'Язык',
    russian: 'Русский',
    english: 'English',
    belarusian: 'Беларуская',
    ukrainian: 'Українська',
    updated: 'Язык изменён',
  },

  // === ЭКРАН БИБЛИОТЕКИ ===
  library: {
    title: 'Библиотека',
    search: 'Поиск по названию, автору, жанру...',
    filters: 'Фильтр',
    sort: 'Сортировать',
  },

  // === ФИЛЬТРЫ ===
  filters: {
    all: 'Все',
    finished: 'Прочитано',
    reading: 'Читаю',
    planned: 'В планах',
    postponed: 'Отложено',
    abandoned: 'Брошено',
    rereading: 'Перечитываю',
  },

  // === СОРТИРОВКА ===
  sort: {
    button: 'Сортировать',
    title: 'Сортировать по',
    byDate: 'По дате добавления',
    byTitle: 'По названию',
    byAuthor: 'По автору',
    byRating: 'По оценке',
    byProgress: 'По прогрессу',
  },

  // === СТАТУСЫ КНИГ ===
  status: {
    planned: 'в планах',
    reading: 'читаю',
    finished: 'прочитано',
    postponed: 'отложено',
    abandoned: 'брошено',
    rereading: 'перечитываю',
  },

  // === ПОЛЯ КНИГИ ===
  fields: {
    title: 'Название',
    author: 'Автор',
    status: 'Статус',
    rating: 'Оценка',
    section: 'Раздел',
    genres: 'Жанры',
    pages: 'Страниц',
    startDate: 'Дата начала',
    endDate: 'Дата окончания',
    notes: 'Заметки',
    languages: 'Язык чтения',
    review: 'Рецензия',
    authorCountry: 'Страна автора',
    series: 'Серия',
    seriesPosition: 'Номер в серии',
    originalYear: 'Год оригинала',
    readingFormat: 'Формат',
    cover: 'Обложка',
    progress: 'Прогресс',
  },

  // === ПЛЕЙСХОЛДЕРЫ ===
  placeholders: {
    title: 'Название',
    author: 'Автор',
    section: 'Раздел (Страна, столетие)',
    genres: 'Жанры через запятую',
    pages: 'Количество страниц',
    startDate: 'ДД.ММ.ГГГГ',
    endDate: 'ДД.ММ.ГГГГ',
    notes: 'Заметки / отзыв',
    search: 'Поиск по названию, автору, жанру...',
    authorCountry: 'Например: Россия, США, Великобритания',
    series: 'Название серии',
    seriesPosition: 'Например: 1, 2, 3...',
    originalYear: 'Например: 2020',
    review: 'Поделитесь впечатлениями о книге...',
  },

  // === СЧЁТЧИКИ ===
  counters: {
    total: 'Всего',
    finished: 'Прочитано',
    reading: 'Читаю',
    planned: 'В планах',
    books: 'кн.',
  },

  // === ПУСТЫЕ СОСТОЯНИЯ ===
  empty: {
    title: '📭 Нет книг',
    subtitle: 'Нажмите ➕, чтобы добавить',
    library: 'Библиотека пуста',
    favorites: 'Нет избранных книг',
    quotes: 'Нет цитат',
    sessions: 'Нет сессий',
  },

  // === ДЕЙСТВИЯ ===
  actions: {
    deleteTitle: 'Удаление',
    deleteConfirm: 'Точно удалить?',
    delete: 'Удалить',
    cancel: 'Отмена',
  },

  // === ЭКРАН ПРОФИЛЯ ===
  profile: {
    title: 'Профиль',
    readerLevel: 'Уровень читателя',
    stats: 'Статистика',
    defaultName: 'Читатель',
    memberSince: 'Читатель с',
    favoriteBooks: 'Избранные книги',
    quotes: 'Мои цитаты',
    settings: 'Настройки',
    about: 'О приложении',
    total: 'Всего',
    read: 'Прочитано',
  },

  // === СТАТИСТИКА ===
  statistics: {
    title: 'Статистика чтения',
    subtitle: 'Ваши достижения',
    totalBooks: 'Всего книг',
    totalPages: 'Прочитано страниц',
    totalHours: 'Часов чтения',
    averageSpeed: 'Средняя скорость',
    bestDay: 'Лучший день',
    weeklyActivity: 'Активность за неделю',
  },

  // === ИНСАЙТЫ ===
  insights: {
    title: 'Инсайты',
    progress: 'Прогресс чтения',
    finished: 'Прочитано',
    total: 'Всего',
    topGenres: 'Топ-3 жанра',
    noGenreData: 'Нет данных',
    books: 'кн.',
    addFirstBook: 'Добавьте первую книгу',
    justStarted: 'Вы только начали',
    goodStart: 'Отличный старт',
    bookworm: 'Книжный червь',
    bookKing: 'Книжный король',
    emptyMessage: 'Добавьте больше книг и завершите несколько сессий чтения, чтобы увидеть персональную статистику.',
  },

  // === СЕССИИ ЧТЕНИЯ ===
  session: {
    title: 'Сессии',
    noActiveBookTitle: 'Нет активной книги',
    noActiveBookMessage: 'Пожалуйста, выберите книгу для чтения',
    startSession: 'Начать сессию',
    endSession: 'Завершить сессию',
    currentPage: 'Текущая страница',
    startPage: 'Начальная страница',
    endPage: 'Финальная страница',
    ofPages: 'из',
    pagesRead: 'стр.',
    duration: 'Длительность',
    invalidPage: 'Введите страницу от {current} до {total}',
    sessionComplete: 'Прочитано {pages} страниц за {minutes} мин.',
    enterEndPage: 'Введите финальную страницу',
    enterEndPageError: 'Пожалуйста, введите финальную страницу',
    endPageMustBeGreater: 'Финальная страница должна быть больше {start}',
    pause: 'Пауза',
    resume: 'Продолжить',
    paused: 'Пауза',
    history: 'История чтения',
    selectBook: 'Выберите книгу',
    currentBook: '📖 Текущая книга',
    readingBooks: '📚 В процессе чтения',
    setStartPage: 'Указать начальную страницу',
    startPageQuestion: 'С какой страницы вы начали читать эту книгу?',
    clearHistory: 'Очистить историю',
    clearHistoryMessage: 'Все сессии для книги "{title}" будут удалены.',
    deleteSession: 'Удалить сессию?',
    deleteSessionConfirm: 'Это действие нельзя отменить.',
  },

  // === ЦИТАТЫ ===
  quotes: {
    title: 'Мои цитаты',
    addButton: '📜 Добавить цитату',
    quotePlaceholder: 'Введите цитату...',
    pagePlaceholder: 'Номер страницы',
    notePlaceholder: 'Ваши мысли о цитате...',
    save: 'Сохранить',
    cancel: 'Отмена',
    deleteConfirm: 'Удалить цитату?',
    deleteConfirmMessage: 'Это действие нельзя отменить',
    emptyTitle: 'Нет цитат',
    emptyMessage: 'Добавьте цитату во время сессии чтения',
    quoteOfDay: 'Цитата дня',
    editNote: 'Редактировать комментарий',
    delete: 'Удалить',
    voiceInput: 'Диктовать голосом',
    voiceInputDeveloping: 'Голосовой ввод в разработке',
    enterQuoteText: 'Введите текст цитаты',
    quoteSaved: 'Цитата сохранена',
    page: 'стр.',
    readingTime: 'чтения',
    comment: 'Комментарий',
  },

  // === ИЗБРАННЫЕ КНИГИ ===
  favoriteBooks: {
    title: 'Избранные книги',
    emptyTitle: 'Нет избранных книг',
    emptyMessage: 'Добавляйте книги в избранное, чтобы они отображались здесь',
  },

  // === О ПРИЛОЖЕНИИ ===
  about: {
    title: 'О Syverro',
    version: 'Версия',
    tagline: 'Тихое пространство для чтения и размышлений',
    philosophyTitle: 'Философия',
    description: 'Syverro — это не просто каталог прочитанных книг. Это пространство, где чтение становится частью личной интеллектуальной истории. Сохраняйте книги, мысли и наблюдения, замечайте собственные паттерны и постепенно формируйте библиотеку идей.',
    risTitle: 'Reading Intelligence System',
    risDescription: 'RIS рассматривает чтение как процесс формирования мышления. Книги — это не отдельные элементы списка, а взаимосвязанные точки на карте знаний, интересов и опыта. Syverro помогает увидеть эти связи и сохранить их.',
    contactTitle: 'Связаться',
    shareMessage: 'Чтение как часть интеллектуальной истории',
    author: 'Разработчик',
    email: 'Написать разработчику',
    quote: '«Порядок в книгах — порядок в голове»',
  },

  // === АВАТАР ===
  avatar: {
    select: 'Выбери аватар',
    fromGallery: 'Выбрать из галереи',
    delete: 'Удалить аватар',
    orEmoji: '— или выбери эмодзи —',
    permissionDenied: 'Нужно разрешение для доступа к галерее',
    updated: 'Аватар обновлён',
    uploadFailed: 'Не удалось загрузить аватар',
  },

  // === АВТОР ===
  author: {
    selectButton: 'Выбрать автора',
    modalTitle: 'Выберите автора',
    newAuthorPlaceholder: 'Новый автор',
    noAuthors: 'Нет авторов',
  },

  // === ЖАНРЫ ===
  genres: {
    addButton: 'Добавить жанр',
    modalTitle: 'Выберите жанры',
    customPlaceholder: 'Свой жанр',
  },

  // === ОШИБКИ ===
  errors: {
    emptyFields: 'Пожалуйста, заполните обязательные поля',
    bookNotFound: 'Книга не найдена',
    networkError: 'Ошибка сети',
    authFailed: 'Ошибка авторизации',
    syncFailed: 'Ошибка синхронизации',
    exportFailed: 'Ошибка экспорта',
    importFailed: 'Ошибка импорта',
  },

  // === ИМПОРТ/ЭКСПОРТ ===
  import: {
    button: '📥 Импорт',
    alertTitle: 'Импорт',
    alertLoading: 'Загружаю книги...',
    alertSuccess: 'Готово!',
    alertError: 'Ошибка',
  },

  export: {
    button: '📤 Экспорт',
    alertTitle: 'Экспорт',
    alertLoading: 'Экспортирую данные...',
    alertSuccess: 'Данные экспортированы',
    alertError: 'Ошибка экспорта',
    hint: 'Сохранить все книги, сессии, профиль и цитаты в JSON-файл',
  },

  // === ДЕТАЛИ КНИГИ ===
  bookDetails: {
    notFound: 'Книга не найдена',
    deleteConfirm: 'Вы уверены, что хотите удалить эту книгу?',
    status: 'Статус',
    progress: 'Прогресс',
    rating: 'Рейтинг',
    pages: 'стр.',
    cover: 'Обложка',
  },

  // === МЕНЮ ===
  menu: {
    profile: 'Мой профиль',
    stats: 'Статистика',
    insights: 'Инсайты',
    theme: 'Тема',
    language: 'Язык',
    about: 'О приложении',
  },
};

export default ru;
export type RussianLocale = typeof ru;