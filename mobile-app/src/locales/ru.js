export default {
  app: {
    title: 'Сиверро'
  },

  buttons: {
    addBook: '+ Добавить книгу',
    save: 'Сохранить',
    cancel: 'Отмена',
    edit: 'Редактировать',
    delete: 'Удалить'
  },

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
    noBooksWithStatus: 'Нет книг со статусом'
  },

  theme: {
    title: 'Тема',
    light: 'Светлая',
    dark: 'Тёмная',
    system: 'Системная'
  },

  language: {
    title: 'Язык'
  },

  settings: {
    title: 'Настройки',
    data: 'Данные',
    clear: 'Очистка',
    resetStats: 'Сбросить статистику'
  },

  library: {
    title: 'Библиотека'
  },

  import: {
    button: '📥 Импорт',
    alertTitle: 'Импорт',
    alertLoading: 'Загружаю книги...',
    alertSuccess: 'Готово!',
    alertError: 'Ошибка'
  },

  books: {
    count: 'книг'
  },

  screens: {
    details: 'Детали книги',
    back: 'Назад'
  },

  menu: {
    profile: 'Мой профиль',
    stats: 'Статистика',
    insights: 'Инсайты',
    theme: 'Тёмная',
    language: 'Русский',
    about: 'О приложении'
  },

  placeholders: {
    title: 'Название',
    author: 'Автор',
    section: 'Раздел (Страна, столетие)',
    genres: 'Жанры через запятую',
    pages: 'Количество страниц',
    startDate: 'Дата начала (ДД.ММ.ГГГГ)',
    endDate: 'Дата окончания (ДД.ММ.ГГГГ)',
    notes: 'Заметки / отзыв',
    search: 'Поиск по названию, автору, жанру...',
    authorCountry: 'Например: Россия, США, Великобритания',
    series: 'Название серии',
    seriesPosition: 'Например: 1, 2, 3...',
    originalYear: 'Например: 2020',
    review: 'Поделитесь впечатлениями о книге...'
  },

  fields: {
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
    readingFormat: 'Формат'
  },

  status: {
    planned: 'в планах',
    reading: 'читаю',
    finished: 'прочитано',
    postponed: 'отложено',
    abandoned: 'брошено',
    rereading: 'перечитываю'
  },

  errors: {
    emptyFields: 'Пожалуйста, заполните обязательные поля',
    bookNotFound: 'Книга не найдена',
    networkError: 'Ошибка сети'
  },

  filters: {
    all: 'Все',
    finished: 'Прочитано',
    reading: 'Читаю',
    planned: 'В планах',
    title: 'Фильтр'
  },

  sort: {
    button: 'Сортировать',
    title: 'Сортировать по',
    byDate: 'По дате добавления',
    byTitle: 'По названию',
    byAuthor: 'По автору',
    byRating: 'По оценке',
    byProgress: 'По прогрессу'
  },

  empty: {
    title: '📭 Нет книг',
    subtitle: 'Нажмите ➕, чтобы добавить'
  },

  counters: {
    total: 'Всего',
    finished: 'Прочитано',
    reading: 'Читаю',
    planned: 'В планах'
  },

  actions: {
    deleteTitle: 'Удаление книги',
    deleteConfirm: 'Точно удалить?',
    delete: 'Удалить',
    cancel: 'Отмена'
  },

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
    bookKing: 'Книжный король'
  },

  bookDetails: {
    notFound: 'Книга не найдена',
    deleteConfirm: 'Вы уверены, что хотите удалить эту книгу?',
    status: 'Статус',
    progress: 'Прогресс',
    rating: 'Рейтинг',
    pages: 'стр.',
    cover: 'Обложка'
  },

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
    deleteSessionConfirm: 'Это действие нельзя отменить.'
  },

  statistics: {
    title: 'Статистика чтения',
    subtitle: 'Ваши достижения',
    totalBooks: 'Всего книг',
    totalPages: 'Прочитано страниц',
    totalHours: 'Часов чтения',
    averageSpeed: 'Средняя скорость',
    bestDay: 'Лучший день',
    weeklyActivity: 'Активность за неделю'
  },

  about: {
    title: 'О приложении',
    version: 'Версия',
    author: 'Разработчик',
    description: 'Syverro — камерная читательская среда для отслеживания прогресса чтения',
    share: 'Поделиться',
    email: 'Написать разработчику',
    quote: '«Порядок в книгах — порядок в голове»'
  },

  favoriteBooks: {
    title: 'Избранные книги',
    emptyTitle: 'Нет избранных книг',
    emptyMessage: 'Добавляйте книги в избранное, чтобы они отображались здесь'
  },

  profile: {
    title: 'Профиль',
    readerLevel: 'Уровень читателя',
    stats: 'Статистика',
    defaultName: 'Читатель'
  },

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
    voiceInputDeveloping: 'Голосовой ввод в разработке. Пожалуйста, используйте текстовый ввод.',
    enterQuoteText: 'Введите текст цитаты',
    quoteSaved: 'Цитата сохранена',
    page: 'стр.',
    readingTime: 'чтения',
    comment: 'Комментарий'
  },

  avatar: {
    select: 'Выбери аватар',
    fromGallery: 'Выбрать из галереи',
    delete: 'Удалить аватар',
    orEmoji: '— или выбери эмодзи —',
    permissionDenied: 'Нужно разрешение для доступа к галерее',
    updated: 'Аватар обновлён',
    uploadFailed: 'Не удалось загрузить аватар'
  },

  author: {
    selectButton: 'Выбрать автора',
    modalTitle: 'Выберите автора',
    newAuthorPlaceholder: 'Новый автор',
    noAuthors: 'Нет авторов'
  },

  genres: {
    addButton: 'Добавить жанр',
    modalTitle: 'Выберите жанры',
    customPlaceholder: 'Свой жанр'
  },

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
},
};