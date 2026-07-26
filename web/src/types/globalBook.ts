export interface GlobalBook {
  id: string;

  title: string;

  subtitle?: string;

  author: string;

  authorId?: string | null;

  authorName?: string | null;
  authorSlug?: string | null;

  authors?: string[];

  cover: string | null;

  genres: string[];

  genreIds?: string[];

  genreObjects?: Array<{ id: string; name: string; slug: string }>;

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

  publicationType?: 'official' | 'unofficial';

  metadataStatus?: 'draft' | 'incomplete' | 'review_ready' | 'complete';

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