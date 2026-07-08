export interface GlobalBook {
  id: string;

  title: string;

  author: string;

  cover: string | null;

  genres: string[];

  totalPages: number;

  authorCountry?: string | null;

  originalYear?: number | null;

  description?: string | null;


  // аналитические поля на будущее
  themes?: string[];

  motifs?: string[];


  series?: string | null;

  seriesPosition?: number | null;


  // модерация
  moderationStatus?: 'pending' | 'approved' | 'rejected';

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
