import type { AdminAuthor } from '../../../../types/admin';

export const AUTHOR_STATUS_PIPELINE = [
  'draft',
  'identity_complete',
  'editorial_complete',
  'knowledge_complete',
  'review_ready',
  'golden',
] as const;

export type AuthorMetadataStatus = (typeof AUTHOR_STATUS_PIPELINE)[number];

export const AUTHOR_STATUS_LABELS: Record<AuthorMetadataStatus, string> = {
  draft: 'Draft',
  identity_complete: 'Identity Complete',
  editorial_complete: 'Editorial Complete',
  knowledge_complete: 'Knowledge Complete',
  review_ready: 'Review Ready',
  golden: 'Golden',
};

export const AUTHOR_STATUS_COLORS: Record<AuthorMetadataStatus, string> = {
  draft: '#97A6BA',
  identity_complete: '#5B86A1',
  editorial_complete: '#4CAF50',
  knowledge_complete: '#A855F7',
  review_ready: '#FFA726',
  golden: '#FFD700',
};

export const AUTHOR_STATUS_BG: Record<AuthorMetadataStatus, string> = {
  draft: 'rgba(151,166,186,0.12)',
  identity_complete: 'rgba(91,134,161,0.12)',
  editorial_complete: 'rgba(76,175,80,0.12)',
  knowledge_complete: 'rgba(168,85,247,0.12)',
  review_ready: 'rgba(255,167,38,0.12)',
  golden: 'rgba(255,215,0,0.15)',
};

interface ValidationError {
  field: string;
  label: string;
}

const FIELD_LABELS: Record<string, string> = {
  birth_name: 'Birth Name',
  sort_name: 'Sort Name',
  birth_date: 'Birth Date',
  birth_place_id: 'Birth Place',
  death_date: 'Death Date',
  death_place_id: 'Death Place',
  nationality: 'Nationality',
  bio: 'Biography',
  occupations: 'Occupations',
  literary_movements: 'Literary Movements',
  languages: 'Languages',
  notable_works: 'Notable Works',
  genres: 'Genres',
  photo: 'Photo',
  wikipedia_url: 'Wikipedia URL',
  official_website: 'Official Website',
  portrait_caption: 'Portrait Caption',
  author_intro_quote: 'Short Description',
};

function missing(author: AdminAuthor, field: string): boolean {
  const val = (author as any)[field];
  if (val === null || val === undefined || val === '') return true;
  if (Array.isArray(val) && val.length === 0) return true;
  return false;
}

export function validateStatusPromotion(
  author: AdminAuthor,
  targetStatus: AuthorMetadataStatus
): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  const checks: Record<AuthorMetadataStatus, string[]> = {
    draft: [],
    identity_complete: ['birth_name', 'sort_name', 'birth_date', 'nationality'],
    editorial_complete: ['bio'],
    knowledge_complete: ['languages'],
    review_ready: ['photo'],
    golden: ['portrait_caption', 'author_intro_quote'],
  };

  const required = checks[targetStatus] || [];
  for (const field of required) {
    if (missing(author, field)) {
      errors.push({ field, label: FIELD_LABELS[field] || field });
    }
  }

  if (targetStatus === 'editorial_complete' || canPromoteTo(targetStatus, 'editorial_complete')) {
    if (missing(author, 'occupations')) errors.push({ field: 'occupations', label: FIELD_LABELS.occupations });
    if (missing(author, 'literary_movements')) errors.push({ field: 'literary_movements', label: FIELD_LABELS.literary_movements });
  }

  if (targetStatus === 'knowledge_complete' || canPromoteTo(targetStatus, 'knowledge_complete')) {
    if (missing(author, 'notable_works')) errors.push({ field: 'notable_works', label: FIELD_LABELS.notable_works });
    if (missing(author, 'genres')) errors.push({ field: 'genres', label: FIELD_LABELS.genres });
  }

  if (targetStatus === 'review_ready' || canPromoteTo(targetStatus, 'review_ready')) {
    if (missing(author, 'wikipedia_url') && missing(author, 'official_website')) {
      errors.push({ field: 'wikipedia_url', label: 'Wikipedia URL or Official Website' });
    }
  }

  return { valid: errors.length === 0, errors };
}

function canPromoteTo(target: string, level: string): boolean {
  const idx = AUTHOR_STATUS_PIPELINE.indexOf(target as any);
  const levelIdx = AUTHOR_STATUS_PIPELINE.indexOf(level as any);
  return idx >= 0 && levelIdx >= 0 && idx >= levelIdx;
}

export function getNextStatus(current: string): AuthorMetadataStatus | null {
  const idx = AUTHOR_STATUS_PIPELINE.indexOf(current as AuthorMetadataStatus);
  if (idx < 0 || idx >= AUTHOR_STATUS_PIPELINE.length - 1) return null;
  return AUTHOR_STATUS_PIPELINE[idx + 1];
}

export function getPrevStatus(current: string): AuthorMetadataStatus | null {
  const idx = AUTHOR_STATUS_PIPELINE.indexOf(current as AuthorMetadataStatus);
  if (idx <= 0) return null;
  return AUTHOR_STATUS_PIPELINE[idx - 1];
}
