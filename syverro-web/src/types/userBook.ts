// src/types/userBook.ts
export type UserBookStatus =
  | 'planned'
  | 'reading'
  | 'completed'
  | 'paused'
  | 'abandoned';

export interface UserBook {
  id: string;
  userId: string;
  bookId: string;
  status: UserBookStatus;
  currentPage: number;
  addedAt: string;
  startedAt?: string;
  finishedAt?: string;
  personalNote?: string;
}

export const statusLabels: Record<UserBookStatus, string> = {
  planned: 'Планирую',
  reading: 'Читаю',
  completed: 'Прочитано',
  paused: 'Отложено',
  abandoned: 'Брошено',
};

export const statusOrder: UserBookStatus[] = [
  'reading',
  'planned',
  'completed',
  'paused',
  'abandoned',
];