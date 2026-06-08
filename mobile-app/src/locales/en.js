export default {
  app: {
    title: 'Syverro'
  },

  buttons: {
    addBook: '+ Add book',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete'
  },

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
    noBooksWithStatus: 'No books with status'
  },

  theme: {
    title: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System'
  },

  language: {
    title: 'Language'
  },

  settings: {
    title: 'Settings',
    data: 'Data',
    clear: 'Clear',
    resetStats: 'Reset statistics'
  },

  library: {
    title: 'Library'
  },

  import: {
    button: '📥 Import',
    alertTitle: 'Import',
    alertLoading: 'Loading books...',
    alertSuccess: 'Done!',
    alertError: 'Error'
  },

  books: {
    count: 'books'
  },

  screens: {
    details: 'Book details',
    back: 'Back'
  },

  menu: {
    profile: 'My profile',
    stats: 'Statistics',
    insights: 'Insights',
    theme: 'Dark mode',
    language: 'English',
    about: 'About'
  },

  placeholders: {
    title: 'Title',
    author: 'Author',
    section: 'Section (Country, century)',
    genres: 'Genres (comma separated)',
    pages: 'Number of pages',
    startDate: 'Start date (MM/DD/YYYY)',
    endDate: 'End date (MM/DD/YYYY)',
    notes: 'Notes / review',
    search: 'Search by title, author, genre...',
    authorCountry: 'Example: Russia, USA, UK',
    series: 'Series name',
    seriesPosition: 'Example: 1, 2, 3...',
    originalYear: 'Example: 2020',
    review: 'Share your thoughts about the book...'
  },

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
    originalYear: 'Original year',
    readingFormat: 'Format'
  },

  status: {
    planned: 'planned',
    reading: 'reading',
    finished: 'finished',
    postponed: 'postponed',
    abandoned: 'abandoned',
    rereading: 'rereading'
  },

  errors: {
    emptyFields: 'Please fill in required fields',
    bookNotFound: 'Book not found',
    networkError: 'Network error'
  },

  filters: {
    all: 'All',
    finished: 'Finished',
    reading: 'Reading',
    planned: 'Planned',
    title: 'Filter'
  },

  sort: {
    button: 'Sort',
    title: 'Sort by',
    byDate: 'By date added',
    byTitle: 'By title',
    byAuthor: 'By author',
    byRating: 'By rating',
    byProgress: 'By progress'
  },

  empty: {
    title: '📭 No books',
    subtitle: 'Tap ➕ to add'
  },

  counters: {
    total: 'Total',
    finished: 'Finished',
    reading: 'Reading',
    planned: 'Planned'
  },

  actions: {
    deleteTitle: 'Delete book',
    deleteConfirm: 'Delete permanently?',
    delete: 'Delete',
    cancel: 'Cancel'
  },

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

  bookDetails: {
    notFound: 'Book not found',
    deleteConfirm: 'Are you sure you want to delete this book?',
    status: 'Status',
    progress: 'Progress',
    rating: 'Rating',
    pages: 'pages',
    cover: 'Cover'
  },

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
    pagesRead: 'p.',
    duration: 'Duration',
    invalidPage: 'Enter page from {current} to {total}',
    sessionComplete: 'Read {pages} pages in {minutes} min.',
    enterEndPage: 'Enter final page',
    enterEndPageError: 'Please enter the final page',
    endPageMustBeGreater: 'End page must be greater than {start}',
    pause: 'Pause',
    resume: 'Resume',
    paused: 'Paused',
    history: 'Reading history',
    selectBook: 'Select book',
    currentBook: '📖 Current book',
    readingBooks: '📚 Currently reading',
    setStartPage: 'Set start page',
    startPageQuestion: 'Which page did you start reading this book from?',
    clearHistory: 'Clear history',
    clearHistoryMessage: 'All sessions for "{title}" will be deleted.',
    deleteSession: 'Delete session?',
    deleteSessionConfirm: 'This action cannot be undone.'
  },

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

  about: {
    title: 'About',
    version: 'Version',
    author: 'Developer',
    description: 'Syverro - a cozy reading environment for tracking reading progress',
    share: 'Share',
    email: 'Email developer',
    quote: '"Order in books — order in mind"'
  },

  favoriteBooks: {
    title: 'Favorite books',
    emptyTitle: 'No favorite books',
    emptyMessage: 'Add books to favorites to see them here'
  },

  profile: {
    title: 'Profile',
    readerLevel: 'Reader level',
    stats: 'Statistics',
    defaultName: 'Reader'
  },

  quotes: {
    title: 'My quotes',
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
    voiceInput: 'Dictate by voice',
    voiceInputDeveloping: 'Voice input is under development. Please use text input for now.',
    enterQuoteText: 'Enter quote text',
    quoteSaved: 'Quote saved',
    page: 'p.',
    readingTime: 'of reading',
    comment: 'Comment'
  },

  avatar: {
    select: 'Choose avatar',
    fromGallery: 'Choose from gallery',
    delete: 'Delete avatar',
    orEmoji: '— or choose emoji —',
    permissionDenied: 'Permission to access gallery is required',
    updated: 'Avatar updated',
    uploadFailed: 'Failed to upload avatar'
  },

  author: {
    selectButton: 'Select author',
    modalTitle: 'Select author',
    newAuthorPlaceholder: 'New author',
    noAuthors: 'No authors'
  },

  genres: {
    addButton: 'Add genre',
    modalTitle: 'Select genres',
    customPlaceholder: 'Custom genre'
  },

  about: {
  title: 'About Syverro',
  version: 'Version',
  tagline: 'A quiet space for reading and reflection',
  philosophyTitle: 'Philosophy',
  description: 'Syverro is more than a catalog of read books. It is a space where reading becomes part of your personal intellectual history. Save books, thoughts, and observations, notice your own patterns, and gradually build a library of ideas.',
  risTitle: 'Reading Intelligence System',
  risDescription: 'RIS views reading as a process of shaping thinking. Books are not separate list items but interconnected points on a map of knowledge, interests, and experience. Syverro helps you see these connections and preserve them.',
  contactTitle: 'Contact',
  shareMessage: 'Reading as part of intellectual history',
},
};