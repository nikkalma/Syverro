const be = {
  // === НАВІГАЦЫЯ ===
  tabs: {
    profile: 'Профіль',
    library: 'Бібліятэка',
    session: 'Сесія',
    settings: 'Налады',
  },

  screens: {
    bookDetails: 'Аб кнізе',
    quotes: 'Цытаты',
    favorites: 'Выбранае',
    about: 'Пра праграму',
  },

  // === КАЛЯНДАР ===
  calendar: {
    mon: 'Пн',
    tue: 'Аў',
    wed: 'Ср',
    thu: 'Чц',
    fri: 'Пт',
    sat: 'Сб',
    sun: 'Нд',
    months: {
      january: 'Студзень',
      february: 'Люты',
      march: 'Сакавік',
      april: 'Красавік',
      may: 'Май',
      june: 'Чэрвень',
      july: 'Ліпень',
      august: 'Жнівень',
      september: 'Верасень',
      october: 'Кастрычнік',
      november: 'Лістапад',
      december: 'Снежань',
    },
  },

  // === АГУЛЬНАЕ ===
  common: {
    error: 'Памылка',
    success: 'Поспех!',
    confirm: 'Пацверджанне',
    ok: 'OK',
    back: 'Назад',
    save: 'Захаваць',
    cancel: 'Адмена',
    edit: 'Рэдагаваць',
    delete: 'Выдаліць',
    add: 'Дадаць',
    close: 'Закрыць',
    clear: 'Ачысціць',
    none: 'Няма',
    found: 'Знойдзена',
    notFound: 'Нічога не знойдзена',
    loading: 'Загрузка...',
    bookAdded: 'Кніга дададзена',
    unknownAuthor: 'Невядомы аўтар',
    noBooksWithStatus: 'Няма кніг з такім статусам',
  },

  buttons: {
    addBook: '+ Дадаць кнігу',
    save: 'Захаваць',
    cancel: 'Адмена',
    edit: 'Рэдагаваць',
    delete: 'Выдаліць',
    import: '📥 Імпарт',
    export: '📤 Экспарт',
    share: 'Падзяліцца',
  },

  // === ПРАГРАМА ===
  app: {
    title: 'Сіверра',
    version: '1.0.0',
    tagline: 'Ціхая прастора для чытання і роздумаў',
  },

  // === НАЛАДЫ ===
  settings: {
    title: 'Налады',
    appearance: 'Знешні выгляд',
    language: 'Мова',
    data: 'Дадзеныя',
    exportData: 'Экспарт дадзеных',
    importData: 'Імпарт дадзеных',
    clearData: 'Ачысціць дадзеныя',
    resetStats: 'Скінуць статыстыку',
    about: 'Пра праграму',
  },

  // === ТЭМА ===
  theme: {
    title: 'Тэма',
    light: 'Светлая',
    dark: 'Цёмная',
    system: 'Сістэмная',
  },

  // === МОВА ===
  language: {
    title: 'Мова',
    russian: 'Русский',
    english: 'English',
    belarusian: 'Беларуская',
    ukrainian: 'Українська',
    updated: 'Мова зменена',
  },

  // === БІБЛІЯТЭКА ===
  library: {
    title: 'Бібліятэка',
    search: 'Пошук па назве, аўтары, жанры...',
    filters: 'Фільтр',
    sort: 'Сартаваць',
  },

  // === ФІЛЬТРЫ ===
  filters: {
    all: 'Усе',
    finished: 'Прачытана',
    reading: 'Чытаю',
    planned: 'У планах',
    postponed: 'Адкладзена',
    abandoned: 'Кінута',
    rereading: 'Перачытваю',
  },

  // === СОРТЫРОЎКА ===
  sort: {
    button: 'Сартаваць',
    title: 'Сартаваць па',
    byDate: 'Па даце дадання',
    byTitle: 'Па назве',
    byAuthor: 'Па аўтары',
    byRating: 'Па ацэнцы',
    byProgress: 'Па прагрэсе',
  },

  // === СТАТУСЫ КНІГ ===
  status: {
    planned: 'у планах',
    reading: 'чытаю',
    finished: 'прачытана',
    postponed: 'адкладзена',
    abandoned: 'кінута',
    rereading: 'перачытваю',
  },

  // === ПОЛІ КНІГІ ===
  fields: {
    title: 'Назва',
    author: 'Аўтар',
    status: 'Статус',
    rating: 'Ацэнка',
    section: 'Раздзел',
    genres: 'Жанры',
    pages: 'Старонак',
    startDate: 'Дата пачатку',
    endDate: 'Дата заканчэння',
    notes: 'Нататкі',
    languages: 'Мова чытання',
    review: 'Рэцэнзія',
    authorCountry: 'Краіна аўтара',
    series: 'Серыя',
    seriesPosition: 'Нумар у серыі',
    originalYear: 'Год арыгінала',
    readingFormat: 'Фармат',
    cover: 'Вокладка',
    progress: 'Прагрэс',
  },

  // === ПЛЕЙСХОЛДЭРЫ ===
  placeholders: {
    title: 'Назва',
    author: 'Аўтар',
    section: 'Раздзел (Краіна, стагоддзе)',
    genres: 'Жанры праз коску',
    pages: 'Колькасць старонак',
    startDate: 'ДД.ММ.ГГГГ',
    endDate: 'ДД.ММ.ГГГГ',
    notes: 'Нататкі / водгук',
    search: 'Пошук па назве, аўтары, жанры...',
    authorCountry: 'Напрыклад: Беларусь, Расія, ЗША',
    series: 'Назва серыі',
    seriesPosition: 'Напрыклад: 1, 2, 3...',
    originalYear: 'Напрыклад: 2020',
    review: 'Падзяліцеся ўражаннямі аб кнізе...',
  },

  // === ЛІЧЫЛЬНІКІ ===
  counters: {
    total: 'Усяго',
    finished: 'Прачытана',
    reading: 'Чытаю',
    planned: 'У планах',
    books: 'кн.',
  },

  // === ПУСТЫЯ СТАНЫ ===
  empty: {
    title: '📭 Няма кніг',
    subtitle: 'Націсніце ➕, каб дадаць',
    library: 'Бібліятэка пустая',
    favorites: 'Няма выбраных кніг',
    quotes: 'Няма цытат',
    sessions: 'Няма сесій',
  },

  // === ДЗЕЯННІ ===
  actions: {
    deleteTitle: 'Выдаленне',
    deleteConfirm: 'Сапраўды выдаліць?',
    delete: 'Выдаліць',
    cancel: 'Адмена',
  },

  // === ПРОФІЛЬ ===
  profile: {
    title: 'Профіль',
    readerLevel: 'Узровень чытача',
    stats: 'Статыстыка',
    defaultName: 'Чытач',
    memberSince: 'Чытач з',
    favoriteBooks: 'Выбраныя кнігі',
    quotes: 'Мае цытаты',
    settings: 'Налады',
    about: 'Пра праграму',
    total: 'Усяго',
    read: 'Прачытана',
  },

  // === СТАТЫСТЫКА ===
  statistics: {
    title: 'Статыстыка чытання',
    subtitle: 'Вашы дасягненні',
    totalBooks: 'Усяго кніг',
    totalPages: 'Прачытана старонак',
    totalHours: 'Гадзін чытання',
    averageSpeed: 'Сярэдняя хуткасць',
    bestDay: 'Найлепшы дзень',
    weeklyActivity: 'Актыўнасць за тыдзень',
  },

  // === ІНСАЙТЫ ===
  insights: {
    title: 'Інсайты',
    progress: 'Прагрэс чытання',
    finished: 'Прачытана',
    total: 'Усяго',
    topGenres: 'Топ-3 жанры',
    noGenreData: 'Няма дадзеных',
    books: 'кн.',
    addFirstBook: 'Дадайце першую кнігу',
    justStarted: 'Вы толькі пачалі',
    goodStart: 'Выдатны старт',
    bookworm: 'Кніжны чарвяк',
    bookKing: 'Кніжны кароль',
    emptyMessage: 'Дадайце больш кніг і завершыце некалькі сесій чытання, каб убачыць персанальную статыстыку.',
  },

  // === СЕСІІ ЧЫТАННЯ ===
  session: {
    title: 'Сесіі',
    noActiveBookTitle: 'Няма актыўнай кнігі',
    noActiveBookMessage: 'Калі ласка, абярыце кнігу для чытання',
    startSession: 'Пачаць сесію',
    endSession: 'Завяршыць сесію',
    currentPage: 'Бягучая старонка',
    startPage: 'Пачатковая старонка',
    endPage: 'Фінальная старонка',
    ofPages: 'з',
    pagesRead: 'стар.',
    duration: 'Працягласць',
    invalidPage: 'Увядзіце старонку ад {current} да {total}',
    sessionComplete: 'Прачытана {pages} старонак за {minutes} хв.',
    enterEndPage: 'Увядзіце фінальную старонку',
    enterEndPageError: 'Калі ласка, увядзіце фінальную старонку',
    endPageMustBeGreater: 'Фінальная старонка павінна быць больш за {start}',
    pause: 'Паўза',
    resume: 'Працягнуць',
    paused: 'Паўза',
    history: 'Гісторыя чытання',
    selectBook: 'Абярыце кнігу',
    currentBook: '📖 Бягучая кніга',
    readingBooks: '📚 У працэсе чытання',
    setStartPage: 'Пазначыць пачатковую старонку',
    startPageQuestion: 'З якой старонкі вы пачалі чытаць гэту кнігу?',
    clearHistory: 'Ачысціць гісторыю',
    clearHistoryMessage: 'Усе сесіі для кнігі "{title}" будуць выдалены.',
    deleteSession: 'Выдаліць сесію?',
    deleteSessionConfirm: 'Гэта дзеянне нельга адмяніць.',
  },

  // === ЦЫТАТЫ ===
  quotes: {
    title: 'Мае цытаты',
    addButton: '📜 Дадаць цытату',
    quotePlaceholder: 'Увядзіце цытату...',
    pagePlaceholder: 'Нумар старонкі',
    notePlaceholder: 'Вашы думкі аб цытаце...',
    save: 'Захаваць',
    cancel: 'Адмена',
    deleteConfirm: 'Выдаліць цытату?',
    deleteConfirmMessage: 'Гэта дзеянне нельга адмяніць',
    emptyTitle: 'Няма цытат',
    emptyMessage: 'Дадайце цытату падчас сесіі чытання',
    quoteOfDay: 'Цытата дня',
    editNote: 'Рэдагаваць каментар',
    delete: 'Выдаліць',
    voiceInput: 'Дыктаваць голасам',
    voiceInputDeveloping: 'Галасавы ўвод у распрацоўцы',
    enterQuoteText: 'Увядзіце тэкст цытаты',
    quoteSaved: 'Цытата захавана',
    page: 'стар.',
    readingTime: 'чытання',
    comment: 'Каментар',
  },

  // === ВЫБРАНЫЯ КНІГІ ===
  favoriteBooks: {
    title: 'Выбраныя кнігі',
    emptyTitle: 'Няма выбраных кніг',
    emptyMessage: 'Дадавайце кнігі ў выбранае, каб яны адлюстроўваліся тут',
  },

  // === ПРА ПРАГРАМУ ===
  about: {
    title: 'Пра Syverro',
    version: 'Версія',
    tagline: 'Ціхая прастора для чытання і роздумаў',
    philosophyTitle: 'Філасофія',
    description: 'Syverro — гэта не проста каталог прачытаных кніг. Гэта прастора, дзе чытанне становіцца часткай асабістай інтэлектуальнай гісторыі. Захоўвайце кнігі, думкі і назіранні, заўважайце ўласныя патэрны і паступова фарміруйце бібліятэку ідэй.',
    risTitle: 'Reading Intelligence System',
    risDescription: 'RIS разглядае чытанне як працэс фарміравання мыслення. Кнігі — гэта не асобныя элементы спісу, а ўзаемазвязаныя кропкі на карце ведаў, інтарэсаў і досведу. Syverro дапамагае ўбачыць гэтыя сувязі і захаваць іх.',
    contactTitle: 'Звязацца',
    shareMessage: 'Чытанне як частка інтэлектуальнай гісторыі',
    author: 'Распрацоўшчык',
    email: 'Напісаць распрацоўшчыку',
    quote: '«Парадак у кнігах — парадак у галаве»',
  },

  // === АВАТАР ===
  avatar: {
    select: 'Абярыце аватар',
    fromGallery: 'Выбраць з галерэі',
    delete: 'Выдаліць аватар',
    orEmoji: '— або абярыце эмодзі —',
    permissionDenied: 'Патрэбны дазвол для доступу да галерэі',
    updated: 'Аватар абноўлены',
    uploadFailed: 'Не атрымалася загрузіць аватар',
  },

  // === АЎТАР ===
  author: {
    selectButton: 'Выбраць аўтара',
    modalTitle: 'Абярыце аўтара',
    newAuthorPlaceholder: 'Новы аўтар',
    noAuthors: 'Няма аўтараў',
  },

  // === ЖАНРЫ ===
  genres: {
    addButton: 'Дадаць жанр',
    modalTitle: 'Абярыце жанры',
    customPlaceholder: 'Свой жанр',
  },

  // === ПАМЫЛКІ ===
  errors: {
    emptyFields: 'Калі ласка, запоўніце абавязковыя палі',
    bookNotFound: 'Кніга не знойдзена',
    networkError: 'Памылка сеткі',
    authFailed: 'Памылка аўтарызацыі',
    syncFailed: 'Памылка сінхранізацыі',
    exportFailed: 'Памылка экспарту',
    importFailed: 'Памылка імпарту',
  },

  // === ІМПАРТ/ЭКСПАРТ ===
  import: {
    button: '📥 Імпарт',
    alertTitle: 'Імпарт',
    alertLoading: 'Загружаю кнігі...',
    alertSuccess: 'Гатова!',
    alertError: 'Памылка',
  },

  export: {
    button: '📤 Экспарт',
    alertTitle: 'Экспарт',
    alertLoading: 'Экспартую дадзеныя...',
    alertSuccess: 'Дадзеныя экспартаваны',
    alertError: 'Памылка экспарту',
  },

  // === ДЭТАЛІ КНІГІ ===
  bookDetails: {
    notFound: 'Кніга не знойдзена',
    deleteConfirm: 'Вы ўпэўнены, што хочаце выдаліць гэту кнігу?',
    status: 'Статус',
    progress: 'Прагрэс',
    rating: 'Рэйтынг',
    pages: 'стар.',
    cover: 'Вокладка',
  },

  // === МЕНЮ ===
  menu: {
    profile: 'Мой профіль',
    stats: 'Статыстыка',
    insights: 'Інсайты',
    theme: 'Тэма',
    language: 'Мова',
    about: 'Пра праграму',
  },
};

export default be;
export type BelarusianLocale = typeof be;