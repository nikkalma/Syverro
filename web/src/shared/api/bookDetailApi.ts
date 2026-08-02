import { apiClient } from './client';
import type { PublicBookDetail } from '../../types/bookDetail';

interface PublicBookDetailResponse {
  id: string;
  title: string;
  subtitle: string | null;
  original_title: string | null;
  description: string | null;
  cover: string | null;
  publication_id: string | null;
  publication_year: number | null;
  original_language: string | null;
  country_of_origin: string | null;
  total_pages: number | null;
  publication_type: string;
  series_name: string | null;
  series_position: number | null;
  authors: Array<{
    id: string;
    name: string;
    display_name: string | null;
    slug: string | null;
    role: string | null;
    is_primary: boolean | null;
  }>;
  publication: {
    id: string;
    author_id: string;
    title: string;
    original_title: string | null;
    publication_year: number;
    publication_date: string | null;
    publication_type: string;
    description: string | null;
    pen_name: string | null;
    wikipedia_url: string | null;
    source_id: string | null;
  } | null;
  genres: Array<{ id: string; name: string; slug: string; type: string | null }>;
  knowledge: Array<{
    node_id: string;
    name: string;
    slug: string;
    node_type: string;
    relation_type: string;
    confidence: number;
    source: string | null;
    metadata: Record<string, unknown> | null;
  }>;
}

export function mapPublicBookDetail(data: PublicBookDetailResponse): PublicBookDetail {
  return {
    id: data.id,
    title: data.title,
    subtitle: data.subtitle,
    originalTitle: data.original_title,
    description: data.description,
    cover: data.cover,
    publicationId: data.publication_id,
    publicationYear: data.publication_year,
    originalLanguage: data.original_language,
    countryOfOrigin: data.country_of_origin,
    totalPages: data.total_pages,
    publicationType: data.publication_type,
    seriesName: data.series_name,
    seriesPosition: data.series_position,
    authors: data.authors.map((author) => ({
      id: author.id,
      name: author.name,
      displayName: author.display_name,
      slug: author.slug,
      role: author.role,
      isPrimary: author.is_primary,
    })),
    publication: data.publication ? {
      id: data.publication.id,
      authorId: data.publication.author_id,
      title: data.publication.title,
      originalTitle: data.publication.original_title,
      publicationYear: data.publication.publication_year,
      publicationDate: data.publication.publication_date,
      publicationType: data.publication.publication_type,
      description: data.publication.description,
      penName: data.publication.pen_name,
      wikipediaUrl: data.publication.wikipedia_url,
      sourceId: data.publication.source_id,
    } : null,
    genres: data.genres,
    knowledge: data.knowledge.map((item) => ({
      nodeId: item.node_id,
      name: item.name,
      slug: item.slug,
      nodeType: item.node_type,
      relationType: item.relation_type,
      confidence: item.confidence,
      source: item.source,
      metadata: item.metadata,
    })),
  };
}

export const bookDetailApi = {
  async getById(bookId: string): Promise<PublicBookDetail> {
    const response = await apiClient.get<PublicBookDetailResponse>(`/books/${bookId}`);
    return mapPublicBookDetail(response.data);
  },
};
