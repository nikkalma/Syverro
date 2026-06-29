// src/types/userBook.ts
export type UserBookStatus =
  | 'reading'
  | 'shelf'
  | 'completed'
  | 'paused'
  | 'abandoned'
  | 'rereading'; 

export interface UserBook {
  id: string;
  userId: string;
  bookId: string;
  status: UserBookStatus;
  rereadCount: number;          // ← вместо isRereading
  currentPage: number;
  addedAt: string;
  startedAt?: string;
  completedAt?: string;
  personalNote?: string;
}

export const statusLabels: Record<UserBookStatus, string> = {
  reading: 'Читаю',
  shelf: 'На полке',             // ← вместо planned
  completed: 'Завершено',
  paused: 'Отложено',
  abandoned: 'Брошено',
  rereading: 'Перечитываю',
};

export const statusOrder: UserBookStatus[] = [
  'reading',
  'shelf',
  'completed',
  'paused',
  'abandoned',
  'rereading',
];