// ============================================
// GLOBAL LIBRARY
// ============================================
export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string | null;
  genres: string[];
  total_pages: number | null;
  description: string | null;
  series: string | null;
  series_position: number | null;
  isbn: string | null;
  published_year: number | null;
  status: 'pending_moderation' | 'approved';
  created_by: string; // user_id
  created_at: string;
  updated_at: string | null;
}

export interface BookCreate {
  title: string;
  author: string;
  cover?: string | null;
  genres?: string[];
  total_pages?: number | null;
  description?: string | null;
  series?: string | null;
  series_position?: number | null;
  isbn?: string | null;
  published_year?: number | null;
}

// ============================================
// USER LIBRARY
// ============================================
export type BookStatus = 'reading' | 'completed' | 'want_to_read' | 'postponed' | 'abandoned';

export interface UserBook {
  id: string;
  user_id: string;
  book_id: string;
  book: Book; // полная информация о книге
  status: BookStatus;
  current_page: number;
  rating: number | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  quotes: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface UserBookCreate {
  book_id: string;
  status: BookStatus;
  current_page?: number;
  rating?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  is_favorite?: boolean;
}

// ============================================
// ENRICHED BOOK (для отображения в UI)
// ============================================
export interface EnrichedBook extends Book {
  userData: {
    user_book_id: string;
    status: BookStatus;
    current_page: number;
    rating: number | null;
    is_favorite: boolean;
    notes: string | null;
  } | null; // null = книга не добавлена в личную библиотеку
}