// src/types/book.ts

export type BookStatus = 
  | 'reading'
  | 'rereading'
  | 'completed'
  | 'want_to_read'
  | 'postponed'
  | 'abandoned';

export interface Quote {
  id: string;
  text: string;
  page: number | null;
  note: string | null;
  createdAt: number;
}

export interface PersonalBook {
  userId: string;
  bookId: string;
  status: BookStatus;
  currentPage: number;
  rating: number | null;
  favorite: boolean;
  notes: string;
  quotes: Quote[];
  addedAt: number;
  updatedAt: number;
}

export interface GlobalBook {
  id: string;
  title: string;
  author: string;
  cover: string | null;
  genres: string[];
  totalPages: number;
  authorCountry: string | null;
  originalYear: number | null;
  description: string | null;
  averageRating: number | null;
  totalRatings: number;
  createdAt: number;
  subtitle?: string;
  authors?: string[];
  originalLanguage?: string;
  subgenres?: string[];
  mood?: string[];
  vibe?: string[];
  themes?: string[];
  motifs?: string[];
  culturalTradition?: string;
  historicalPeriodWritten?: string;
  historicalPeriodSetting?: string;
  plotLinearity?: 'linear' | 'nonlinear';
  povCount?: number;
  textComplexity?: 'low' | 'medium' | 'high';
  narrativePace?: 'slow' | 'medium' | 'fast';
  descriptionDensity?: 'low' | 'medium' | 'high';
  dialogueRatio?: number;
  isClassic?: boolean;
  isNiche?: boolean;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  moderationReason?: string;
  triggerWarnings?: string[];
}

export interface EnrichedBook extends GlobalBook {
  personal: PersonalBook | null;
}

export type NewGlobalBook = Omit<GlobalBook, 'id' | 'createdAt' | 'averageRating' | 'totalRatings'>;

export interface Edition {
  id: string;
  bookId: string;
  publisher: string;
  year: number;
  country: string;
  translator?: string;
  editor?: string;
  series?: string;
  seriesPosition?: number;
  format: 'hardcover' | 'paperback' | 'ebook' | 'audiobook';
  pages: number;
  language: string;
  cover: string | null;
  isbn10?: string;
  isbn13?: string;
}

export interface BookVibe {
  bookId: string;
  mood: string[];
  vibe: string[];
  themes: string[];
  motifs: string[];
  source: 'manual' | 'ai' | 'crowd';
  confidence: number;
}

export interface Character {
  id: string;
  bookId: string;
  name: string;
  isMain: boolean;
  archetype?: string;
  description?: string;
}

export interface Review {
  id: string;
  bookId: string;
  userId: string;
  title: string | null;
  content: string;
  rating: number | null;
  isSpoiler: boolean;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  helpfulCount: number;
  createdAt: number;
  updatedAt: number | null;
}

// ============================================
// EDIT PROPOSAL — модерация изменений GBE
// ============================================
export type EditProposalStatus = 'pending' | 'approved' | 'rejected';

export interface EditProposal {
  id: string;
  bookId: string;
  userId: string;
  changedFields: Partial<GlobalBook>;
  reason?: string;
  status: EditProposalStatus;
  createdAt: number;
  reviewedAt?: number;
  moderatorId?: string;
  moderatorComment?: string;
}