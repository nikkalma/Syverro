export interface PublicBookAuthor {
  id: string;
  name: string;
  displayName: string | null;
  slug: string | null;
  role: string | null;
  isPrimary: boolean | null;
}

export interface PublicBookPublication {
  id: string;
  authorId: string;
  title: string;
  originalTitle: string | null;
  publicationYear: number;
  publicationDate: string | null;
  publicationType: string;
  description: string | null;
  penName: string | null;
  wikipediaUrl: string | null;
  sourceId: string | null;
}

export interface PublicBookGenre {
  id: string;
  name: string;
  slug: string;
  type: string | null;
}

export interface PublicBookKnowledgeItem {
  nodeId: string;
  name: string;
  slug: string;
  nodeType: string;
  relationType: string;
  confidence: number;
  source: string | null;
  metadata: Record<string, unknown> | null;
}

export interface PublicBookDetail {
  id: string;
  title: string;
  subtitle: string | null;
  originalTitle: string | null;
  description: string | null;
  cover: string | null;
  publicationId: string | null;
  publicationYear: number | null;
  originalLanguage: string | null;
  countryOfOrigin: string | null;
  totalPages: number | null;
  publicationType: string;
  seriesName: string | null;
  seriesPosition: number | null;
  authors: PublicBookAuthor[];
  publication: PublicBookPublication | null;
  genres: PublicBookGenre[];
  knowledge: PublicBookKnowledgeItem[];
}
