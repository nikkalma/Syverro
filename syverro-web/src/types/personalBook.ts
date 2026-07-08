export type PersonalBookStatus =
  | 'reading'
  | 'rereading'
  | 'completed'
  | 'planned'
  | 'postponed'
  | 'abandoned';


export type ReadingFormat =
  | 'paper'
  | 'ebook'
  | 'audio'
  | 'other';


export interface PersonalBook {
  userId: string;
  bookId: string;

  status: PersonalBookStatus;

  currentPage?: number;

  favorite?: boolean;

  notes?: string;

  quotes?: string[];

  review?: string;

  startedAt?: string;

  completedAt?: string;

  readingFormat?: ReadingFormat;

  readingSessions?: string[];

  rereadCount?: number;

  createdAt?: string;
  updatedAt?: string;
}


export const personalBookStatusLabels: Record<PersonalBookStatus, string> = {
  reading: 'Читаю',
  rereading: 'Перечитываю',
  completed: 'Прочитано',
  planned: 'Запланировано',
  postponed: 'Отложено',
  abandoned: 'Брошено',
};


export const personalBookStatusOrder: PersonalBookStatus[] = [
  'reading',
  'planned',
  'completed',
  'rereading',
  'postponed',
  'abandoned',
];
