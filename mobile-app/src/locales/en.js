export default {
  // ==================== MAIN ====================
  app: {
    title: 'Syverro'
  },

  // ==================== BUTTONS ====================
  buttons: {
    addBook: '+ Add book',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete'
  },

  // ==================== COMMON ====================
  common: {
    error: 'Error',
    success: 'Success!',
    confirm: 'Confirm',
    ok: 'OK',
    back: 'Back',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete'
  },

  // ==================== THEME ====================
  theme: {
    title: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System'
  },

  // ==================== LANGUAGE ====================
  language: {
    title: 'Language'
  },

  // ==================== IMPORT ====================
  import: {
    button: '📥 Import',
    alertTitle: 'Import',
    alertLoading: 'Loading books...',
    alertSuccess: 'Done!',
    alertError: 'Error'
  },

  // ==================== BOOKS ====================
  books: {
    count: 'books'
  },

  // ==================== SCREENS ====================
  screens: {
    details: 'Book details',
    back: 'Back'
  },

  // ==================== MENU ====================
  menu: {
    profile: 'My profile',
    stats: 'Statistics',
    insights: 'Insights',
    theme: 'Dark mode',
    language: 'English',
    about: 'About'
  },

  // ==================== PLACEHOLDERS ====================
  placeholders: {
    title: 'Title',
    author: 'Author',
    section: 'Section (Country, century)',
    genres: 'Genres (comma separated)',
    pages: 'Number of pages',
    startDate: 'Start date (MM/DD/YYYY)',
    endDate: 'End date (MM/DD/YYYY)',
    notes: 'Notes / review',
    search: 'Search by title, author, genre...'
  },

  // ==================== FIELDS ====================
  fields: {
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
    seriesPosition: 'Position in series',
    originalYear: 'Original year'
  },

  // ==================== BOOK STATUSES ====================
  status: {
    planned: 'planned',
    reading: 'reading',
    finished: 'finished',
    postponed: 'postponed',
    abandoned: 'abandoned',
    rereading: 'rereading'
  },

  // ==================== ERRORS ====================
  errors: {
    emptyFields: 'Please fill in required fields',
    bookNotFound: 'Book not found',
    networkError: 'Network error'
  },

  // ==================== FILTERS ====================
  filters: {
    all: 'All',
    finished: 'Finished',
    reading: 'Reading',
    planned: 'Planned'
  },

  // ==================== SORT ====================
  sort: {
    button: 'Sort',
    title: 'Sort by',
    byDate: 'By date added',
    byTitle: 'By title',
    byAuthor: 'By author',
    byRating: 'By rating'
  },

  // ==================== EMPTY STATES ====================
  empty: {
    title: '📭 No books',
    subtitle: 'Tap ➕ to add'
  },

  // ==================== COUNTERS ====================
  counters: {
    total: 'Total',
    finished: 'Finished',
    reading: 'Reading',
    planned: 'Planned'
  },

  // ==================== ACTIONS ====================
  actions: {
    deleteTitle: 'Delete book',
    deleteConfirm: 'Delete permanently?',
    delete: 'Delete',
    cancel: 'Cancel'
  },

  // ==================== INSIGHTS (HOME STATS) ====================
  insights: {
    title: 'Insights',
    progress: 'Reading progress',
    finished: 'Finished',
    total: 'Total',
    topGenres: 'Top 3 genres',
    noGenreData: 'No data',
    books: 'books',
    addFirstBook: 'Add your first book',
    justStarted: 'Just started',
    goodStart: 'Good start',
    bookworm: 'Bookworm',
    bookKing: 'Book king'
  },

  // ==================== BOOK DETAILS ====================
  bookDetails: {
    notFound: 'Book not found',
    deleteConfirm: 'Are you sure you want to delete this book?',
    status: 'Status',
    progress: 'Progress',
    rating: 'Rating',
    pages: 'pages'
  },

  // ==================== READING SESSION ====================
  session: {
    noActiveBookTitle: 'No active book',
    noActiveBookMessage: 'Please select a book to read',
    startSession: 'Start session',
    endSession: 'End session',
    currentPage: 'Current page',
    ofPages: 'of',
    pagesRead: 'Pages read',
    duration: 'Duration',
    invalidPage: 'Enter page from {current} to {total}',
    sessionComplete: 'Read {pages} pages in {minutes} min.'
  },

  // ==================== STATISTICS (INSIGHTS SCREEN) ====================
  statistics: {
    title: 'Reading statistics',
    subtitle: 'Your achievements',
    totalBooks: 'Total books',
    totalPages: 'Pages read',
    totalHours: 'Hours read',
    averageSpeed: 'Average speed',
    bestDay: 'Best day',
    weeklyActivity: 'Weekly activity'
  },

  // ==================== ABOUT ====================
  about: {
    title: 'About',
    version: 'Version',
    author: 'Developer',
    description: 'Syverro - a cozy reading environment for tracking reading progress'
  },

  // ==================== FAVORITE BOOKS ====================
  favoriteBooks: {
    title: 'Favorite books',
    emptyTitle: 'No favorite books',
    emptyMessage: 'Add books to favorites to see them here'
  },

  // ==================== PROFILE ====================
  profile: {
    title: 'Profile',
    readerLevel: 'Reader level',
    stats: 'Statistics'
  }
};