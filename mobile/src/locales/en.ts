const en = {
  // === NAVIGATION ===
  tabs: {
    profile: 'Profile',
    library: 'Library',
    session: 'Session',
    settings: 'Settings',
  },

  screens: {
    bookDetails: 'Book Details',
    quotes: 'Quotes',
    favorites: 'Favorites',
    about: 'About',
  },

  // === CALENDAR ===
  calendar: {
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    sun: 'Sun',
    months: {
      january: 'January',
      february: 'February',
      march: 'March',
      april: 'April',
      may: 'May',
      june: 'June',
      july: 'July',
      august: 'August',
      september: 'September',
      october: 'October',
      november: 'November',
      december: 'December',
    },
  },

  // === COMMON ===
  common: {
    error: 'Error',
    success: 'Success!',
    confirm: 'Confirm',
    ok: 'OK',
    back: 'Back',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    add: 'Add',
    close: 'Close',
    clear: 'Clear',
    none: 'None',
    found: 'Found',
    notFound: 'Nothing found',
    loading: 'Loading...',
    bookAdded: 'Book added',
    unknownAuthor: 'Unknown author',
    noBooksWithStatus: 'No books with this status',
  },

  buttons: {
    addBook: '+ Add book',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    import: '📥 Import',
    export: '📤 Export',
    share: 'Share',
  },

  // === APP ===
  app: {
    title: 'Syverro',
    version: '1.0.0',
    tagline: 'A quiet space for reading and reflection',
  },

  // === SETTINGS ===
  settings: {
    title: 'Settings',
    appearance: 'Appearance',
    language: 'Language',
    data: 'Data',
    exportData: 'Export Data',
    importData: 'Import Data',
    clearData: 'Clear Data',
    resetStats: 'Reset Statistics',
    about: 'About',
  },

  // === THEME ===
  theme: {
    title: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  },

  // === LANGUAGE ===
  language: {
    title: 'Language',
    russian: 'Russian',
    english: 'English',
    belarusian: 'Belarusian',
    ukrainian: 'Ukrainian',
    updated: 'Language updated',
  },

  // === LIBRARY ===
  library: {
    title: 'Library',
    search: 'Search by title, author, genre...',
    filters: 'Filter',
    sort: 'Sort',
  },

  // === FILTERS ===
  filters: {
    all: 'All',
    finished: 'Finished',
    reading: 'Reading',
    planned: 'Planned',
    postponed: 'Postponed',
    abandoned: 'Abandoned',
    rereading: 'Rereading',
  },

  // === SORT ===
  sort: {
    button: 'Sort',
    title: 'Sort by',
    byDate: 'By date added',
    byTitle: 'By title',
    byAuthor: 'By author',
    byRating: 'By rating',
    byProgress: 'By progress',
  },

  // === BOOK STATUS ===
  status: {
    planned: 'planned',
    reading: 'reading',
    finished: 'finished',
    postponed: 'postponed',
    abandoned: 'abandoned',
    rereading: 'rereading',
  },

  // === BOOK FIELDS ===
  fields: {
    title: 'Title',
    author: 'Author',
    status: 'Status',
    rating: 'Rating',
    section: 'Section',
    genres: 'Genres',
    pages: 'Pages',
    startDate: 'Start date',
    endDate: 'End date',
    notes: 'Notes',
    languages: 'Reading language',
    review: 'Review',
    authorCountry: 'Author country',
    series: 'Series',
    seriesPosition: 'Series number',
    originalYear: 'Original year',
    readingFormat: 'Format',
    cover: 'Cover',
    progress: 'Progress',
  },

  // === PLACEHOLDERS ===
  placeholders: {
    title: 'Title',
    author: 'Author',
    section: 'Section (Country, century)',
    genres: 'Genres separated by commas',
    pages: 'Number of pages',
    startDate: 'MM/DD/YYYY',
    endDate: 'MM/DD/YYYY',
    notes: 'Notes / review',
    search: 'Search by title, author, genre...',
    authorCountry: 'Example: USA, UK, France',
    series: 'Series name',
    seriesPosition: 'Example: 1, 2, 3...',
    originalYear: 'Example: 2020',
    review: 'Share your thoughts about the book...',
  },

  // === COUNTERS ===
  counters: {
    total: 'Total',
    finished: 'Finished',
    reading: 'Reading',
    planned: 'Planned',
    books: 'books',
  },

  // === EMPTY STATES ===
  empty: {
    title: '📭 No books',
    subtitle: 'Tap ➕ to add',
    library: 'Library is empty',
    favorites: 'No favorite books',
    quotes: 'No quotes',
    sessions: 'No sessions',
  },

  // === ACTIONS ===
  actions: {
    deleteTitle: 'Delete',
    deleteConfirm: 'Delete permanently?',
    delete: 'Delete',
    cancel: 'Cancel',
  },

  // === PROFILE ===
  profile: {
    title: 'Profile',
    readerLevel: 'Reader Level',
    stats: 'Statistics',
    defaultName: 'Reader',
    memberSince: 'Member since',
    favoriteBooks: 'Favorite Books',
    quotes: 'My Quotes',
    settings: 'Settings',
    about: 'About',
    total: 'Total',
    read: 'Read',
  },

  // === STATISTICS ===
  statistics: {
    title: 'Reading Statistics',
    subtitle: 'Your achievements',
    totalBooks: 'Total books',
    totalPages: 'Pages read',
    totalHours: 'Hours read',
    averageSpeed: 'Average speed',
    bestDay: 'Best day',
    weeklyActivity: 'Weekly activity',
  },

  // === INSIGHTS ===
  insights: {
    title: 'Insights',
    progress: 'Reading progress',
    finished: 'Finished',
    total: 'Total',
    topGenres: 'Top 3 genres',
    noGenreData: 'No data',
    books: 'books',
    addFirstBook: 'Add your first book',
    justStarted: 'You just started',
    goodStart: 'Good start',
    bookworm: 'Bookworm',
    bookKing: 'Book king',
    emptyMessage: 'Add more books and complete a few reading sessions to see personal statistics.',
  },

  // === READING SESSIONS ===
  session: {
    title: 'Sessions',
    noActiveBookTitle: 'No active book',
    noActiveBookMessage: 'Please select a book to read',
    startSession: 'Start session',
    endSession: 'End session',
    currentPage: 'Current page',
    startPage: 'Start page',
    endPage: 'End page',
    ofPages: 'of',
    pagesRead: 'pages',
    duration: 'Duration',
    invalidPage: 'Enter a page between {current} and {total}',
    sessionComplete: 'Read {pages} pages in {minutes} min.',
    enterEndPage: 'Enter the final page',
    enterEndPageError: 'Please enter the final page',
    endPageMustBeGreater: 'Final page must be greater than {start}',
    pause: 'Pause',
    resume: 'Resume',
    paused: 'Paused',
    history: 'Reading history',
    selectBook: 'Select a book',
    currentBook: '📖 Current book',
    readingBooks: '📚 Currently reading',
    setStartPage: 'Set start page',
    startPageQuestion: 'What page did you start reading this book from?',
    clearHistory: 'Clear history',
    clearHistoryMessage: 'All sessions for "{title}" will be deleted.',
    deleteSession: 'Delete session?',
    deleteSessionConfirm: 'This action cannot be undone.',
  },

  // === QUOTES ===
  quotes: {
    title: 'My Quotes',
    addButton: '📜 Add quote',
    quotePlaceholder: 'Enter quote...',
    pagePlaceholder: 'Page number',
    notePlaceholder: 'Your thoughts about the quote...',
    save: 'Save',
    cancel: 'Cancel',
    deleteConfirm: 'Delete quote?',
    deleteConfirmMessage: 'This action cannot be undone',
    emptyTitle: 'No quotes',
    emptyMessage: 'Add a quote during a reading session',
    quoteOfDay: 'Quote of the day',
    editNote: 'Edit comment',
    delete: 'Delete',
    voiceInput: 'Voice input',
    voiceInputDeveloping: 'Voice input is under development',
    enterQuoteText: 'Enter quote text',
    quoteSaved: 'Quote saved',
    page: 'p.',
    readingTime: 'reading',
    comment: 'Comment',
  },

  // === FAVORITE BOOKS ===
  favoriteBooks: {
    title: 'Favorite Books',
    emptyTitle: 'No favorite books',
    emptyMessage: 'Add books to favorites to see them here',
  },

  // === ABOUT ===
  about: {
    title: 'About Syverro',
    version: 'Version',
    tagline: 'A quiet space for reading and reflection',
    philosophyTitle: 'Philosophy',
    description: 'Syverro is more than just a catalog of read books. It\'s a space where reading becomes part of your personal intellectual history. Save books, thoughts, and observations, notice your own patterns, and gradually build a library of ideas.',
    risTitle: 'Reading Intelligence System',
    risDescription: 'RIS views reading as a process of shaping thinking. Books are not separate items on a list, but interconnected points on a map of knowledge, interests, and experiences. Syverro helps you see these connections and preserve them.',
    contactTitle: 'Contact',
    shareMessage: 'Reading as part of intellectual history',
    author: 'Developer',
    email: 'Email developer',
    quote: '"Order in books — order in mind"',
  },

  // === AVATAR ===
  avatar: {
    select: 'Choose avatar',
    fromGallery: 'Choose from gallery',
    delete: 'Delete avatar',
    orEmoji: '— or choose an emoji —',
    permissionDenied: 'Permission needed to access gallery',
    updated: 'Avatar updated',
    uploadFailed: 'Failed to upload avatar',
  },

  // === AUTHOR ===
  author: {
    selectButton: 'Select author',
    modalTitle: 'Select author',
    newAuthorPlaceholder: 'New author',
    noAuthors: 'No authors',
  },

  // === GENRES ===
  genres: {
    addButton: 'Add genre',
    modalTitle: 'Select genres',
    customPlaceholder: 'Custom genre',
  },

  // === ERRORS ===
  errors: {
    emptyFields: 'Please fill in required fields',
    bookNotFound: 'Book not found',
    networkError: 'Network error',
    authFailed: 'Authentication failed',
    syncFailed: 'Sync failed',
    exportFailed: 'Export failed',
    importFailed: 'Import failed',
  },

  // === IMPORT/EXPORT ===
  import: {
    button: '📥 Import',
    alertTitle: 'Import',
    alertLoading: 'Loading books...',
    alertSuccess: 'Done!',
    alertError: 'Error',
  },

  export: {
    button: '📤 Export',
    alertTitle: 'Export',
    alertLoading: 'Exporting data...',
    alertSuccess: 'Data exported',
    alertError: 'Export error',
  },

  // === BOOK DETAILS ===
  bookDetails: {
    notFound: 'Book not found',
    deleteConfirm: 'Are you sure you want to delete this book?',
    status: 'Status',
    progress: 'Progress',
    rating: 'Rating',
    pages: 'pages',
    cover: 'Cover',
  },

  // === MENU ===
  menu: {
    profile: 'My profile',
    stats: 'Statistics',
    insights: 'Insights',
    theme: 'Theme',
    language: 'Language',
    about: 'About',
  },
};

export default en;
export type EnglishLocale = typeof en;