// src/pages/Profile/types.ts
export type StatusKey =
  | 'reading'
  | 'rereading'
  | 'want_to_read'
  | 'completed'
  | 'postponed'
  | 'abandoned';

export const statusConfig: Record<StatusKey, { label: string; icon: string; color: string }> = {
  reading: { label: 'Читаю', icon: '📖', color: '#5B86A1' },
  rereading: { label: 'Перечитываю', icon: '🔄', color: '#8B5CF6' },
  want_to_read: { label: 'Планирую', icon: '📌', color: '#97A6BA' },
  completed: { label: 'Прочитано', icon: '✅', color: '#4CAF50' },
  postponed: { label: 'Отложено', icon: '⏸️', color: '#FFA726' },
  abandoned: { label: 'Брошено', icon: '❌', color: '#EF5350' },
};

export const statusOrder: StatusKey[] = [
  'reading',
  'rereading',
  'want_to_read',
  'completed',
  'postponed',
  'abandoned',
];