// src/types/admin.ts

// ============================================================
// РОЛИ И ПРАВА
// ============================================================

export type AdminRole = 'owner' | 'admin' | 'moderator' | 'user';

export const ADMIN_ROLES: AdminRole[] = ['owner', 'admin', 'moderator'];
export const ALL_ROLES: AdminRole[] = ['owner', 'admin', 'moderator', 'user'];

export const ROLE_LABELS: Record<AdminRole, string> = {
  owner: 'Владелец',
  admin: 'Администратор',
  moderator: 'Модератор',
  user: 'Пользователь',
};

export const ROLE_COLORS: Record<AdminRole, string> = {
  owner: '#EF5350',
  admin: '#5B86A1',
  moderator: '#FFA726',
  user: '#97A6BA',
};

// ============================================================
// ПОЛЬЗОВАТЕЛЬ
// ============================================================

export interface AdminUser {
  id: string;
  email?: string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  avatar?: string | null;
  role?: AdminRole;
  visible_role: AdminRole;
  is_active: boolean;
  created_at: string;
  last_active?: string | null;
  phone?: string | null;
  telegram_id?: string | null;
}

export interface AdminUserFilters {
  search?: string;
  role?: AdminRole | 'all';
  is_active?: boolean | 'all';
  date_from?: string;
  date_to?: string;
  sort_by?: keyof AdminUser;
  sort_order?: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface AdminUserUpdate {
  role?: AdminRole;
  is_active?: boolean;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
}

// ============================================================
// КНИГИ
// ============================================================

export interface AdminBook {
  id: string;
  title: string;
  author: string;
  author_id?: string | null;
  cover?: string | null;
  genres: string[];
  genre_ids?: string[];
  genre_objects?: Array<{ id: string; name: string; slug: string }>;
  description?: string | null;
  total_pages?: number | null;
  publication_format?: string | null;
  publication_type: 'official' | 'unofficial';
  metadata_status: 'draft' | 'incomplete' | 'review_ready' | 'complete';
  is_published: boolean;
  moderation_status: 'draft' | 'pending' | 'approved' | 'published' | 'archived';
  moderation_reason?: string | null;
  moderated_by?: string | null;
  moderated_at?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string;
  created_by_email?: string;
  // Enrichment fields
  subtitle?: string | null;
  original_title?: string | null;
  original_language?: string | null;
  country_of_origin?: string | null;
  original_publication_year?: number | null;
  series_name?: string | null;
  series_position?: number | null;
  themes?: string[];
  motifs?: string[];
  missing_fields?: string[];
  authors?: Array<{ id: string; name: string; country?: string | null }>;
}

export interface AdminBookFilters {
  search?: string;
  genre?: string;
  author?: string;
  is_published?: boolean | 'all';
  publication_type?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: keyof AdminBook;
  sort_order?: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface AdminBookCreate {
  title: string;
  author: string;
  author_id?: string | null;
  cover?: string | null;
  genres?: string[];
  genre_ids?: string[];
  description?: string | null;
  publication_format?: string | null;
  publication_type?: 'official' | 'unofficial';
}

export interface AdminBookUpdate extends Partial<AdminBookCreate> {
  is_published?: boolean;
  moderation_status?: 'draft' | 'pending' | 'approved' | 'published' | 'archived';
  metadata_status?: 'draft' | 'incomplete' | 'review_ready' | 'complete';
}

// ============================================================
// АВТОРЫ
// ============================================================

export interface AuthorAward {
  id: string;
  author_id: string;
  name: string;
  year?: number | null;
  organization?: string | null;
  work?: string | null;
  created_at: string;
}

export type DisplayNameMode = 'real_name' | 'birth_name' | 'pen_name' | 'custom';

export const DISPLAY_NAME_MODE_LABELS: Record<DisplayNameMode, string> = {
  real_name: 'Настоящее имя',
  birth_name: 'Имя при рождении',
  pen_name: 'Псевдоним',
  custom: 'Другое',
};

export function computeDisplayName(
  mode: DisplayNameMode,
  firstName?: string | null,
  lastName?: string | null,
  middleName?: string | null,
  birthName?: string | null,
  penNames?: string[] | null,
  customDisplayName?: string | null,
): string {
  switch (mode) {
    case 'real_name':
      return [firstName, middleName, lastName].filter(Boolean).join(' ') || '';
    case 'birth_name':
      return birthName || '';
    case 'pen_name':
      return (penNames && penNames.length > 0) ? penNames[0] : '';
    case 'custom':
      return customDisplayName || '';
  }
}

export interface AdminAuthor {
  id: string;
  name: string;
  slug?: string | null;
  birth_name?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  native_name?: string | null;
  sort_name?: string | null;
  // Identity
  display_name_mode?: DisplayNameMode;
  display_name?: string | null;
  pen_names?: string[];
  search_aliases?: string | null;
  // Basic information
  pseudonyms?: string[];
  nationality?: string | null;
  country?: string | null;  // backward-compat alias populated from nationality
  languages?: string[];
  gender?: string;
  official_website?: string | null;
  wikipedia_url?: string | null;
  // Biography
  bio?: string | null;
  birth_date?: string | null;
  death_date?: string | null;
  birth_place?: string | null;
  death_place?: string | null;
  // Career
  occupations?: string[];
  literary_movements?: string[];
  active_from_year?: number | null;
  active_to_year?: number | null;
  // Bibliography
  notable_works?: string[];
  genres?: string[];
  writing_languages?: string[];
  // Media
  photo?: string | null;
  gallery?: string[];
  signature_image?: string | null;
  portrait_caption?: string | null;
  hero_background_url?: string | null;
  author_intro_quote?: string | null;
  short_description?: string | null; // frontend alias read from/written to author_intro_quote
  slug_locked?: boolean;
  // System
  creation_type: string;
  book_count: number;
  awards?: AuthorAward[];
  created_at: string;
  updated_at: string;
}

export function getAuthorDisplayName(author: AdminAuthor): string {
  if (author.display_name) return author.display_name;
  if (author.display_name_mode && author.display_name_mode !== 'custom') {
    const computed = computeDisplayName(
      author.display_name_mode,
      author.first_name,
      author.last_name,
      author.middle_name,
      author.birth_name,
      author.pen_names || author.pseudonyms,
    );
    if (computed) return computed;
  }
  if (author.native_name) return author.native_name;
  if (author.first_name || author.last_name) {
    return [author.first_name, author.middle_name, author.last_name]
      .filter(Boolean)
      .join(' ');
  }
  if (author.sort_name) return author.sort_name;
  return author.name;
}

export interface AdminAuthorFilters {
  search?: string;
  country?: string;
  sort_by?: keyof AdminAuthor;
  sort_order?: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface AdminAuthorCreate {
  name: string;
  slug?: string | null;
  display_name_mode?: DisplayNameMode;
  display_name?: string | null;
  pen_names?: string[];
  search_aliases?: string | null;
  birth_name?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  native_name?: string | null;
  sort_name?: string | null;
  pseudonyms?: string[];
  nationality?: string | null;
  languages?: string[];
  gender?: string;
  official_website?: string | null;
  wikipedia_url?: string | null;
  bio?: string | null;
  birth_date?: string | null;
  death_date?: string | null;
  birth_place?: string | null;
  death_place?: string | null;
  occupations?: string[];
  literary_movements?: string[];
  active_from_year?: number | null;
  active_to_year?: number | null;
  notable_works?: string[];
  genres?: string[];
  writing_languages?: string[];
  photo?: string | null;
  gallery?: string[];
  signature_image?: string | null;
  portrait_caption?: string | null;
  hero_background_url?: string | null;
  author_intro_quote?: string | null;
  short_description?: string | null;
  slug_locked?: boolean;
}

export interface AdminAuthorUpdate extends Partial<AdminAuthorCreate> {}

export const GENDER_OPTIONS = [
  { value: 'unknown', label: 'Не указан' },
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' },
  { value: 'nonbinary', label: 'Небинарный' },
  { value: 'organization', label: 'Организация' },
];

// ============================================================
// ЖАНРЫ
// ============================================================

export interface AdminGenre {
  id: string;
  name: string;
  slug: string;
  type: string;
  description?: string | null;
  parent_id?: string | null;
  book_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminGenreFilters {
  search?: string;
  sort_by?: keyof AdminGenre;
  sort_order?: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface AdminGenreCreate {
  name: string;
  description?: string | null;
  parent_id?: string | null;
  type: string;
}

export interface AdminGenreUpdate {
  name?: string;
  description?: string | null;
  parent_id?: string | null;
  type?: string;
}

// ============================================================
// ЛОГИ
// ============================================================

export type AdminLogType = 
  | 'user_login'
  | 'user_logout'
  | 'user_register'
  | 'user_role_change'
  | 'user_block'
  | 'user_unblock'
  | 'user_delete'
  | 'book_create'
  | 'book_update'
  | 'book_delete'
  | 'book_publish'
  | 'book_hide'
  | 'author_create'
  | 'author_update'
  | 'author_delete'
  | 'genre_create'
  | 'genre_update'
  | 'genre_delete'
  | 'settings_update'
  | 'admin_login'
  | 'admin_logout';

export const LOG_TYPE_LABELS: Record<AdminLogType, string> = {
  user_login: 'Вход пользователя',
  user_logout: 'Выход пользователя',
  user_register: 'Регистрация',
  user_role_change: 'Смена роли',
  user_block: 'Блокировка',
  user_unblock: 'Разблокировка',
  user_delete: 'Удаление пользователя',
  book_create: 'Создание книги',
  book_update: 'Обновление книги',
  book_delete: 'Удаление книги',
  book_publish: 'Публикация книги',
  book_hide: 'Скрытие книги',
  author_create: 'Создание автора',
  author_update: 'Обновление автора',
  author_delete: 'Удаление автора',
  genre_create: 'Создание жанра',
  genre_update: 'Обновление жанра',
  genre_delete: 'Удаление жанра',
  settings_update: 'Обновление настроек',
  admin_login: 'Вход в Студию',
  admin_logout: 'Выход из Студии',
};

export interface AdminLog {
  id: string;
  type: AdminLogType;
  user_id?: string | null;
  user_email?: string | null;
  endpoint: string;
  method: string;
  status_code: number;
  ip?: string | null;
  user_agent?: string | null;
  details?: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminLogFilters {
  type?: AdminLogType | 'all';
  user_id?: string;
  user_email?: string;
  date_from?: string;
  date_to?: string;
  status_code?: number;
  endpoint?: string;
  sort_by?: keyof AdminLog;
  sort_order?: 'asc' | 'desc';
  page: number;
  limit: number;
}

// ============================================================
// СТАТИСТИКА (DASHBOARD)
// ============================================================

export interface AdminDashboardStats {
  total_users: number;
  total_books: number;
  total_authors: number;
  total_genres: number;
  active_users: number;
  new_users_24h: number;
  new_books_24h: number;
  users_by_role: Record<AdminRole, number>;
}

// ============================================================
// НАСТРОЙКИ
// ============================================================

export interface AdminSettings {
  registration_enabled: boolean;
  max_file_size_mb: number;
  site_name: string;
  site_description: string;
  maintenance_mode: boolean;
  require_email_verification: boolean;
  default_user_role: AdminRole;
}

// ============================================================
// ОБЩИЕ
// ============================================================

export interface AdminApiResponse<T> {
  data: T;
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface AdminApiError {
  detail: string;
  code?: string;
  field?: string;
}

// ============================================================
// ПРОВЕРКА ПРАВ
// ============================================================

export function getDisplayRole(user: AdminUser): AdminRole {
  return user.visible_role ?? user.role ?? 'user';
}

export function isAdmin(role: AdminRole): boolean {
  return role === 'owner' || role === 'admin';
}

export function isModerator(role: AdminRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'moderator';
}

export function canManageUsers(role: AdminRole): boolean {
  return role === 'owner' || role === 'admin';
}

export function canDeleteUsers(role: AdminRole): boolean {
  return role === 'owner';
}

export function canManageSettings(role: AdminRole): boolean {
  return role === 'owner';
}

export function canManageBooks(role: AdminRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'moderator';
}

export function canManageAuthors(role: AdminRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'moderator';
}

export function canManageGenres(role: AdminRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'moderator';
}

export function canViewLogs(role: AdminRole): boolean {
  return role === 'owner' || role === 'admin';
}

export function canModerate(role: AdminRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'moderator';
}

export function canModerateFull(role: AdminRole): boolean {
  return role === 'owner' || role === 'admin';
}

export type ModerationStatus = 'draft' | 'pending' | 'approved' | 'published' | 'archived';

export const MODERATION_PIPELINE: ModerationStatus[] = ['draft', 'pending', 'approved', 'published'];

export const MODERATION_PIPELINE_ARCHIVED: ModerationStatus = 'archived';

export const MODERATION_STATUS_LABELS: Record<ModerationStatus, string> = {
  draft: 'Черновик',
  pending: 'На модерации',
  approved: 'Одобрено',
  published: 'Опубликована',
  archived: 'Архивирована',
};

export const MODERATION_STATUS_COLORS: Record<ModerationStatus, string> = {
  draft: '#97A6BA',
  pending: '#FFA726',
  approved: '#4CAF50',
  published: '#5B86A1',
  archived: '#EF5350',
};

export function getNextModerationStatus(current: ModerationStatus): ModerationStatus | null {
  if (current === 'archived') return null;
  const idx = MODERATION_PIPELINE.indexOf(current);
  if (idx === -1 || idx >= MODERATION_PIPELINE.length - 1) return null;
  return MODERATION_PIPELINE[idx + 1];
}

export function getModerationActions(current: ModerationStatus): { label: string; nextStatus: ModerationStatus; color: string }[] {
  const actions: { label: string; nextStatus: ModerationStatus; color: string }[] = [];
  const next = getNextModerationStatus(current);
  if (next) {
    const labels: Record<string, string> = {
      pending: '📨 Отправить на модерацию',
      approved: '✅ Одобрить',
      published: '📗 Опубликовать',
    };
    actions.push({ label: labels[next] || next, nextStatus: next, color: '#4CAF50' });
  }
  if (current !== 'archived' && current !== 'draft') {
    actions.push({ label: '⏮ Вернуть в черновик', nextStatus: 'draft', color: '#FFA726' });
  }
  if (current === 'published') {
    actions.push({ label: '📦 Архивировать', nextStatus: 'archived', color: '#EF5350' });
  }
  return actions;
}

export type PublicationType = 'official' | 'unofficial';

export const PUBLICATION_TYPE_LABELS: Record<PublicationType, string> = {
  official: 'Официальная',
  unofficial: 'Неофициальная',
};

export const PUBLICATION_TYPE_COLORS: Record<PublicationType, string> = {
  official: '#5B86A1',
  unofficial: '#A855F7',
};

export type MetadataStatus = 'draft' | 'incomplete' | 'review_ready' | 'complete';

export const METADATA_STATUS_LABELS: Record<MetadataStatus, string> = {
  draft: 'Черновик',
  incomplete: 'Неполные',
  review_ready: 'На проверке',
  complete: 'Заполнены',
};

export const METADATA_STATUS_COLORS: Record<MetadataStatus, string> = {
  draft: '#97A6BA',
  incomplete: '#FFA726',
  review_ready: '#5B86A1',
  complete: '#4CAF50',
};

export const ENRICHMENT_FIELD_LABELS: Record<string, string> = {
  title: 'Название',
  authors: 'Авторы',
  description: 'Описание',
  cover: 'Обложка',
  genres: 'Жанры',
  original_language: 'Язык оригинала',
  country_of_origin: 'Страна происхождения',
  original_publication_year: 'Год издания',
  series_name: 'Серия',
  series_position: 'Номер в серии',
  themes: 'Темы',
  motifs: 'Мотивы',
};

// ============================================================
// ТАКСОНОМИЯ
// ============================================================

export type TaxonomyNodeType = 'genre' | 'literary_direction' | 'theme' | 'motif' | 'concept';

export const TAXONOMY_NODE_TYPES: TaxonomyNodeType[] = ['genre', 'literary_direction', 'theme', 'motif', 'concept'];

export const TAXONOMY_NODE_TYPE_LABELS: Record<TaxonomyNodeType, string> = {
  genre: 'Жанры',
  literary_direction: 'Литературные направления',
  theme: 'Темы',
  motif: 'Мотивы',
  concept: 'Концепты',
};

export const TAXONOMY_NODE_TYPE_ICONS: Record<TaxonomyNodeType, string> = {
  genre: '🏷️',
  literary_direction: '🧭',
  theme: '🎯',
  motif: '🔄',
  concept: '💡',
};

export interface TaxonomyNode {
  id: string;
  name: string;
  slug: string;
  node_type: TaxonomyNodeType;
  description: string | null;
  parent_id: string | null;
  is_active: boolean;
  is_published: boolean;
  aliases: string[];
  sort_order: number;
  book_count: number;
  children: TaxonomyNode[];
  created_at: string;
  updated_at: string;
}

export const TAXONOMY_NODE_COLORS: Record<TaxonomyNodeType, string> = {
  genre: '#5B86A1',
  literary_direction: '#A855F7',
  theme: '#FBBF24',
  motif: '#EC4899',
  concept: '#4CAF50',
};

export const CREATION_TYPE_LABELS: Record<string, string> = {
  individual_author: 'Индивидуальный автор',
  multiple_authors: 'Несколько авторов',
  anonymous_traditional: 'Анонимное / традиционное',
  religious_canon: 'Религиозный канон',
  oral_tradition: 'Устное творчество',
  collective_creation: 'Коллективное творчество',
};
