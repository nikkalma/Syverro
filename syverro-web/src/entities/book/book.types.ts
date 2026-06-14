// src/entities/book/book.types.ts

export type BookStatus = 'planned' | 'reading' | 'finished' | 'postponed' | 'abandoned' | 'rereading';
export type ReadingFormat = 'reading' | 'listening';
export type BookRating = 1 | 2 | 3 | 4 | 5 | null;

export interface Book {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  rating: BookRating;
  cover: string | null;
  section: string | null;
  genres: string[];
  totalPages: number;
  currentPage: number;
  startDate: string | null;
  endDate: string | null;
  notes: string;
  languages: string[];
  review: string;
  createdAt: number;
  favorite: boolean;
  authorCountry: string | null;
  series: string | null;
  seriesPosition: number | null;
  originalYear: number | null;
  readingFormat: ReadingFormat;
  lastRead: string | null;
}

export type NewBook = Omit<Book, 'id' | 'createdAt'>;
export type BookUpdate = Partial<Book>;