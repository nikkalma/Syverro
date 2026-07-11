import type {
  PersonalBook,
  PersonalBookStatus,
} from '../types/personalBook';


const STORAGE_KEY = 'personal-books';


const getAll = (): PersonalBook[] => {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored) as PersonalBook[];
  } catch {
    return [];
  }
};


const saveAll = (books: PersonalBook[]): void => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(books)
  );
};


export const personalBookService = {

  getByUser: (
    userId: string
  ): PersonalBook[] => {

    return getAll().filter(
      (book) => book.userId === userId
    );
  },


  getByBook: (
    userId: string,
    bookId: string
  ): PersonalBook | null => {

    return (
      getAll().find(
        (book) =>
          book.userId === userId &&
          book.bookId === bookId
      ) ?? null
    );
  },


  add: (
    userId: string,
    bookId: string,
    status: PersonalBookStatus = 'planned'
  ): PersonalBook => {

    const books = getAll();


    const existing = books.find(
      (book) =>
        book.userId === userId &&
        book.bookId === bookId
    );


    if (existing) {
      return existing;
    }


    const now = Date.now();


    const newBook: PersonalBook = {
      userId,

      bookId,

      status,


      currentPage: 0,

      favorite: false,


      notes: '',

      quotes: [],

      review: '',


      createdAt: now,

      updatedAt: now,
    };


    saveAll([
      ...books,
      newBook,
    ]);


    return newBook;
  },


  update: (
    userId: string,
    bookId: string,
    updates: Partial<PersonalBook>
  ): PersonalBook | null => {

    const books = getAll();


    const index = books.findIndex(
      (book) =>
        book.userId === userId &&
        book.bookId === bookId
    );


    if (index === -1) {
      return null;
    }


    const current = books[index];


    const updated: PersonalBook = {
      ...current,

      ...updates,

      // запрещаем изменение идентификаторов связи
      userId: current.userId,

      bookId: current.bookId,


      updatedAt: Date.now(),
    };


    books[index] = updated;


    saveAll(books);


    return updated;
  },


  remove: (
    userId: string,
    bookId: string
  ): void => {

    const books = getAll();


    saveAll(
      books.filter(
        (book) =>
          !(
            book.userId === userId &&
            book.bookId === bookId
          )
      )
    );
  },


  getAll: (): PersonalBook[] => {
    return getAll();
  },


  clear: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  },

};