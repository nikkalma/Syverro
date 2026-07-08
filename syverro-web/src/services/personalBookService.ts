import type { PersonalBook, PersonalBookStatus } from '../types/personalBook';

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


const saveAll = (books: PersonalBook[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
};


export const personalBookService = {

  getByUser: (userId: string): PersonalBook[] => {
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
      ) || null
    );

  },


  add: (
    userId: string,
    bookId: string,
    status: PersonalBookStatus
  ): PersonalBook => {

    const books = getAll();

    const newBook: PersonalBook = {
      userId,
      bookId,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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


    const updated = {
      ...books[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };


    books[index] = updated;

    saveAll(books);

    return updated;
  },


  remove: (
    userId: string,
    bookId: string
  ) => {

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

};
