export interface GlobalBook {
  id: string;

  title: string;

  subtitle?: string;

  author: string;

  authors?: string[];

  cover: string | null;

  genres: string[];

  subgenres?: string[];

  originalLanguage?: string;

  authorCountry?: string | null;

  originalYear?: number | null;

  description?: string | null;

  totalPages: number;

  averageRating?: number | null;

  themes?: string[];

  motifs?: string[];

  mood?: string[];

  vibe?: string[];

  series?: string | null;

  seriesPosition?: number | null;

  moderationStatus?: 
    | 'pending'
    | 'approved'
    | 'rejected';

  moderationReason?: string;

  createdAt: number;
}


export type NewGlobalBook = Omit<
  GlobalBook,
  'id' | 'createdAt'
>;


export interface EnrichedBook extends GlobalBook {
  personal: import('./personalBook').PersonalBook | null;
}


export type Book = GlobalBook;

export type BookCreate = NewGlobalBook;