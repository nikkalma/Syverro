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
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  avatar?: string | null;
  role: AdminRole;
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
  cover?: string | null;
  genres: string[];
  total_pages?: number | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  created_by_email?: string;
  description?: string | null;
}

export interface AdminBookFilters {
  search?: string;
  genre?: string;
  author?: string;
  is_published?: boolean | 'all';
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
  cover?: string | null;
  genres?: string[];
  total_pages?: number | null;
  description?: string | null;
}

export interface AdminBookUpdate extends Partial<AdminBookCreate> {
  is_published?: boolean;
}

// ============================================================
// АВТОРЫ
// ============================================================

export interface AdminAuthor {
  id: string;
  name: string;
  photo?: string | null;
  bio?: string | null;
  country?: string | null;
  birth_year?: number | null;
  death_year?: number | null;
  book_count: number;
  created_at: string;
  updated_at: string;
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
  photo?: string | null;
  bio?: string | null;
  country?: string | null;
  birth_year?: number | null;
  death_year?: number | null;
}

export interface AdminAuthorUpdate extends Partial<AdminAuthorCreate> {}

// ============================================================
// ЖАНРЫ
// ============================================================

export interface AdminGenre {
  id: string;
  name: string;
  slug: string;
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
}

export interface AdminGenreUpdate {
  name: string;
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
  admin_login: 'Вход в админку',
  admin_logout: 'Выход из админки',
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