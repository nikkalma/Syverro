// src/shared/api/bookApi.ts

import { apiClient } from './client';

import type {
  GlobalBook,
  EnrichedBook,
} from '../../types/globalBook';

import type {
  PersonalBook,
  PersonalBookStatus,
} from '../../types/personalBook';


// ============================================
// BACKEND RESPONSE TYPES (raw from API)
// ============================================

interface BookResponse {
  id: string;
  title: string;
  author: string;
  author_id: string | null;
  author_name: string | null;
  author_country: string | null;
  author_bio: string | null;
  cover: string | null;
  genres: string[];
  genre_ids: string[];
  genre_objects: Array<{ id: string; name: string; slug: string }>;
  description: string | null;
  total_pages: number | null;
  publication_type: string;
  metadata_status: string;
  moderation_status: string;
  moderation_reason: string | null;
  themes?: string[];
  motifs?: string[];
  subgenres?: string[];
  mood?: string[];
  vibe?: string[];
  subtitle?: string | null;
  original_language?: string | null;
  original_publication_year?: number | null;
  series_name?: string | null;
  series_position?: number | null;
  created_at: string;
  updated_at: string | null;
}

interface UserBookResponse {
  id: string;
  user_id: string;
  book_id: string;
  book: BookResponse;
  status: string;
  rating: number | null;
  current_page: number;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string | null;
}


// ============================================
// MAPPING: backend → frontend
// ============================================

function mapBookResponseToGlobalBook(data: BookResponse): GlobalBook {
  return {
    id: data.id,
    title: data.title,
    author: data.author,
    authorCountry: data.author_country ?? null,
    description: data.description ?? null,
    cover: data.cover,
    genres: data.genres ?? [],
    genreIds: data.genre_ids ?? [],
    genreObjects: data.genre_objects ?? [],
    themes: data.themes ?? [],
    motifs: data.motifs ?? [],
    subgenres: data.subgenres ?? [],
    mood: data.mood ?? [],
    vibe: data.vibe ?? [],
    subtitle: data.subtitle ?? null,
    originalLanguage: data.original_language ?? null,
    originalYear: data.original_publication_year ?? null,
    series: data.series_name ?? null,
    seriesPosition: data.series_position ?? null,
    totalPages: data.total_pages ?? 0,
    publicationType: (data.publication_type as 'official' | 'unofficial') ?? 'official',
    metadataStatus: (data.metadata_status as 'draft' | 'incomplete' | 'review_ready' | 'complete') ?? 'draft',
    moderationStatus: (data.moderation_status as 'pending' | 'approved' | 'rejected') ?? 'pending',
    createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
  };
}

function mapUserBookResponseToPersonalBook(data: UserBookResponse): PersonalBook {
  return {
    userId: data.user_id,
    bookId: data.book_id,
    status: (data.status as PersonalBookStatus) || 'planned',
    currentPage: data.current_page ?? 0,
    favorite: data.is_favorite ?? false,
    notes: data.notes ?? '',
    quotes: [],
    rating: data.rating,
    startedAt: data.start_date ?? undefined,
    completedAt: data.end_date ?? undefined,
    createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
    updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
  };
}

function mergeCatalogWithPersonal(
  catalog: GlobalBook[],
  personalBooks: PersonalBook[],
): EnrichedBook[] {
  const personalMap = new Map<string, PersonalBook>();
  for (const pb of personalBooks) {
    personalMap.set(pb.bookId, pb);
  }

  return catalog.map((book) => ({
    ...book,
    personal: personalMap.get(book.id) ?? null,
  }));
}


// ============================================
// BOOK API
// ============================================

export const bookApi = {

  // --------------------------------------------
  // CATALOG (public, no auth)
  // --------------------------------------------

  async getCatalog(): Promise<GlobalBook[]> {
    const response = await apiClient.get<BookResponse[]>('/books/catalog/');
    return (response.data ?? []).map(mapBookResponseToGlobalBook);
  },


  // --------------------------------------------
  // USER BOOKS (auth required)
  // --------------------------------------------

  async getUserBooks(): Promise<PersonalBook[]> {
    const response = await apiClient.get<UserBookResponse[]>('/books/user-books/');
    return (response.data ?? []).map(mapUserBookResponseToPersonalBook);
  },


  // --------------------------------------------
  // MERGED CATALOG + PERSONAL
  // --------------------------------------------

  async getEnrichedBooks(): Promise<EnrichedBook[]> {
    const [catalogResult, personalResult] = await Promise.allSettled([
      bookApi.getCatalog(),
      bookApi.getUserBooks(),
    ]);

    const catalog = catalogResult.status === 'fulfilled' ? catalogResult.value : [];
    const personalBooks = personalResult.status === 'fulfilled' ? personalResult.value : [];

    return mergeCatalogWithPersonal(catalog, personalBooks);
  },


  // --------------------------------------------
  // ADD TO LIBRARY
  // Backend POST /books/ creates Book + UserBook
  // Returns the book ID for follow-up calls
  // --------------------------------------------

  async addToLibrary(
    title: string,
    author: string,
    status: PersonalBookStatus = 'planned',
  ): Promise<string> {
    const response = await apiClient.post<BookResponse>('/books/', {
      title,
      author,
    });
    const bookId = response.data.id;

    if (status !== 'planned') {
      await apiClient.put(
        `/books/${bookId}/status`,
        null,
        { params: { status_value: status } },
      );
    }

    return bookId;
  },


  // --------------------------------------------
  // UPDATE STATUS
  // Backend PUT /books/{book_id}/status?status_value=X
  // --------------------------------------------

  async updateStatus(
    bookId: string,
    status: PersonalBookStatus,
  ): Promise<void> {
    await apiClient.put(
      `/books/${bookId}/status`,
      null,
      { params: { status_value: status } },
    );
  },

};
