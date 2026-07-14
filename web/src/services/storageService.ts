import type {
  GlobalBook,
  EnrichedBook,
  NewGlobalBook,
} from '../types/globalBook';

import type {
  PersonalBook,
  PersonalBookStatus,
} from '../types/personalBook';

import type {
  ReaderProfile,
} from '../types/reader';

import initialBooksData from '../data/books.json';


const STORAGE_KEYS = {
  GLOBAL_BOOKS: 'syverro_global_books',
  PERSONAL_BOOKS: 'syverro_personal_books',
  EDIT_PROPOSALS: 'syverro_edit_proposals',
};


const getReaderProfileKey = (): string => {
  const user =
    localStorage.getItem('user');

  if (!user) {
    return 'syverro_reader_profile_guest';
  }

  try {
    const parsed =
      JSON.parse(user);

    return `syverro_reader_profile_${parsed.id}`;

  } catch {

    return 'syverro_reader_profile_guest';

  }
};


const DEMIURGE_EMAILS = [
  'syverro.ris@gmail.com',
];


// ============================================
// GLOBAL BOOKS
// ============================================

const getGlobalBooks = (): GlobalBook[] => {

  const stored =
    localStorage.getItem(
      STORAGE_KEYS.GLOBAL_BOOKS
    );


  if (stored) {

    try {
      return JSON.parse(
        stored
      ) as GlobalBook[];

    } catch {
      return [];
    }

  }


  try {

    const initial =
      initialBooksData as GlobalBook[];


    localStorage.setItem(
      STORAGE_KEYS.GLOBAL_BOOKS,
      JSON.stringify(initial)
    );


    return initial;

  } catch (error) {

    console.error(
      'Не удалось загрузить данные:',
      error
    );

    return [];

  }

};


const saveGlobalBooks = (
  books: GlobalBook[]
): void => {

  localStorage.setItem(
    STORAGE_KEYS.GLOBAL_BOOKS,
    JSON.stringify(books)
  );

};


// ============================================
// PERSONAL BOOKS
// ============================================

const getPersonalBooks = (
  userId: string
): PersonalBook[] => {

  const stored =
    localStorage.getItem(
      STORAGE_KEYS.PERSONAL_BOOKS
    );


  if (!stored) return [];


  try {

    const all =
      JSON.parse(
        stored
      ) as Record<string, PersonalBook>;


    return Object.values(all)
      .filter(
        book =>
          book.userId === userId
      );

  } catch {

    return [];

  }

};


const getPersonalBook = (
  userId: string,
  bookId: string
): PersonalBook | null => {

  const stored =
    localStorage.getItem(
      STORAGE_KEYS.PERSONAL_BOOKS
    );


  if (!stored) return null;


  try {

    const all =
      JSON.parse(
        stored
      ) as Record<string, PersonalBook>;


    return (
      all[`${userId}_${bookId}`]
      ?? null
    );

  } catch {

    return null;

  }

};


const savePersonalBook = (
  userId: string,
  bookId: string,
  data: PersonalBook
): void => {

  const stored =
    localStorage.getItem(
      STORAGE_KEYS.PERSONAL_BOOKS
    );


  let all:
    Record<string, PersonalBook> = {};


  if (stored) {

    try {

      all =
        JSON.parse(
          stored
        ) as Record<string, PersonalBook>;

    } catch {

      all = {};

    }

  }


  all[`${userId}_${bookId}`] =
    data;


  localStorage.setItem(
    STORAGE_KEYS.PERSONAL_BOOKS,
    JSON.stringify(all)
  );

};


const deletePersonalBook = (
  userId: string,
  bookId: string
): void => {

  const stored =
    localStorage.getItem(
      STORAGE_KEYS.PERSONAL_BOOKS
    );


  if (!stored) return;


  try {

    const all =
      JSON.parse(
        stored
      ) as Record<string, PersonalBook>;


    delete all[`${userId}_${bookId}`];


    localStorage.setItem(
      STORAGE_KEYS.PERSONAL_BOOKS,
      JSON.stringify(all)
    );

  } catch {

    return;

  }

};


// ============================================
// SERVICE
// ============================================

export const storageService = {

  getAllBooks(): GlobalBook[] {
    return getGlobalBooks();
  },


  getBookById(
    id: string
  ): GlobalBook | null {

    return (
      getGlobalBooks()
        .find(
          book =>
            book.id === id
        )
      ?? null
    );

  },


  addGlobalBook(
    data: NewGlobalBook
  ): GlobalBook {

    const book: GlobalBook = {

      ...data,

      id:
        Date.now()
          .toString(),

      createdAt:
        Date.now(),

    };


    const books =
      getGlobalBooks();


    books.push(book);


    saveGlobalBooks(
      books
    );


    return book;

  },


  updateGlobalBook(
    book: GlobalBook
  ): void {

    const books =
      getGlobalBooks();


    const index =
      books.findIndex(
        item =>
          item.id === book.id
      );


    if (index !== -1) {

      books[index] =
        book;

      saveGlobalBooks(
        books
      );

    }

  },


  deleteGlobalBook(
    id: string
  ): void {

    saveGlobalBooks(
      getGlobalBooks()
        .filter(
          book =>
            book.id !== id
        )
    );

  },


  getPersonalBooks(
    userId: string
  ): PersonalBook[] {

    return getPersonalBooks(
      userId
    );

  },


  getPersonalBook(
    userId: string,
    bookId: string
  ): PersonalBook | null {

    return getPersonalBook(
      userId,
      bookId
    );

  },


  addPersonalBook(
    userId: string,
    bookId: string,
    status:
      PersonalBookStatus = 'planned'
  ): PersonalBook {

    const now =
      Date.now();


    const personal: PersonalBook = {

      userId,

      bookId,

      status,

      currentPage:
        0,

      favorite:
        false,

      notes:
        '',

      quotes:
        [],

      createdAt:
        now,

      updatedAt:
        now,

    };


    savePersonalBook(
      userId,
      bookId,
      personal
    );


    return personal;

  },


  updatePersonalBook(
    userId: string,
    bookId: string,
    updates: Partial<PersonalBook>
  ): void {

    const current =
      getPersonalBook(
        userId,
        bookId
      );


    if (!current) return;


    savePersonalBook(
      userId,
      bookId,
      {
        ...current,
        ...updates,
        updatedAt:
          Date.now(),
      }
    );

  },


  removePersonalBook(
    userId: string,
    bookId: string
  ): void {

    deletePersonalBook(
      userId,
      bookId
    );

  },


  getEnrichedBooks(
    userId: string
  ): EnrichedBook[] {

    const personalMap:
      Record<string, PersonalBook> = {};


    getPersonalBooks(
      userId
    )
      .forEach(
        book => {

          personalMap[book.bookId] =
            book;

        }
      );


    return getGlobalBooks()
      .map(
        book => ({

          ...book,

          personal:
            personalMap[book.id]
            ?? null,

        })
      );

  },


  getEnrichedBook(
    userId: string,
    bookId: string
  ): EnrichedBook | null {

    const global =
      getGlobalBooks()
        .find(
          book =>
            book.id === bookId
        );


    if (!global) return null;


    return {

      ...global,

      personal:
        getPersonalBook(
          userId,
          bookId
        ),

    };

  },


  addQuote(
    userId: string,
    bookId: string,
    text: string,
    page?: number,
    note?: string
  ): void {

    const personal =
      getPersonalBook(
        userId,
        bookId
      );


    if (!personal) return;


    personal.quotes ??= [];


    personal.quotes.push({

      id:
        Date.now()
          .toString(),

      text,

      page:
        page ?? null,

      note:
        note ?? null,

      createdAt:
        Date.now(),

    });


    personal.updatedAt =
      Date.now();


    savePersonalBook(
      userId,
      bookId,
      personal
    );

  },


  deleteQuote(
    userId: string,
    bookId: string,
    quoteId: string
  ): void {

    const personal =
      getPersonalBook(
        userId,
        bookId
      );


    if (!personal?.quotes) return;


    personal.quotes =
      personal.quotes.filter(
        quote =>
          quote.id !== quoteId
      );


    personal.updatedAt =
      Date.now();


    savePersonalBook(
      userId,
      bookId,
      personal
    );

  },


  getReaderProfile(): ReaderProfile {

  const stored =
    localStorage.getItem(
      getReaderProfileKey()
    );


  if (!stored) return {};


  try {

    return JSON.parse(
      stored
    ) as ReaderProfile;

  } catch {

    return {};

  }

},


saveReaderProfile(
  profile: ReaderProfile
): void {

  localStorage.setItem(
    getReaderProfileKey(),
    JSON.stringify(profile)
  );

},


  updateReaderProfile(
    updates: Partial<ReaderProfile>
  ): ReaderProfile {

    const updated = {

      ...this.getReaderProfile(),

      ...updates,

    };


    this.saveReaderProfile(
      updated
    );


    return updated;

  },


  isDemiurge(): boolean {

    const email =
      localStorage.getItem(
        'user_email'
      ) ?? '';


    return DEMIURGE_EMAILS.includes(
      email
    );

  },


  clearAll(): void {

    Object.values(
      STORAGE_KEYS
    )
      .forEach(
        key =>
          localStorage.removeItem(key)
      );

  },

};