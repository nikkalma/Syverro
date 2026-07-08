// src/types/bookEntry.ts
export type BookStatus = 'planned' | 'reading' | 'completed' | 'postponed' | 'abandoned';

export interface BookEntry {
  id: string;
  bookId: string;
  userId: string;
  status: BookStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
  note?: string;
  rating?: number;
}

export const statusLabels: Record<BookStatus, string> = {
  planned: 'Планирую',
  reading: 'Читаю',
  completed: 'Прочитано',
  paused: 'Отложено',
  abandoned: 'Брошено',
};

export const statusOrder: BookStatus[] = ['reading', 'planned', 'completed', 'postponed', 'abandoned'];

// Цвета для статусов
export const statusColors: Record<BookStatus, string> = {
  reading: '#5B86A1',
  planned: '#97A6BA',
  completed: '#4CAF50',
  paused: '#FFA726',
  abandoned: '#EF5350',
};
