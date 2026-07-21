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


export interface Quote {
  id: string;
  text: string;
  page?: number | null;
  note?: string | null;
  createdAt: number;
}


export interface PersonalBook {

  userId: string;

  bookId: string;


  status: PersonalBookStatus;


  currentPage: number;

  favorite: boolean;


  notes: string;

  quotes: Quote[];


  rating?: number | null;

  review?: string;


  readingFormat?: ReadingFormat;


  startedAt?: string;

  completedAt?: string;


  lastRead?: string;


  readingSessions?: string[];

  rereadCount?: number;


  mood?: string;

  readingContext?: string;

  reasonForReading?: string;


  createdAt: number;

  updatedAt: number;
}



export const personalBookStatusLabels:
Record<PersonalBookStatus, string> = {

  reading: 'Читаю',

  rereading: 'Перечитываю',

  completed: 'Прочитано',

  planned: 'Запланировано',

  postponed: 'Отложено',

  abandoned: 'Брошено',

};


export const personalBookStatusOrder:
PersonalBookStatus[] = [

  'reading',

  'planned',

  'completed',

  'rereading',

  'postponed',

  'abandoned',

];


export const personalBookStatusColors: Record<PersonalBookStatus, { bg: string; text: string; border: string }> = {
  reading:    { bg: 'rgba(212, 167, 106, 0.15)', text: '#D4A76A', border: 'rgba(212, 167, 106, 0.3)' },
  planned:    { bg: 'rgba(151, 166, 186, 0.12)', text: '#97A6BA', border: 'rgba(151, 166, 186, 0.25)' },
  completed:  { bg: 'rgba(107, 155, 122, 0.15)', text: '#6B9B7A', border: 'rgba(107, 155, 122, 0.3)' },
  rereading:  { bg: 'rgba(168, 130, 200, 0.12)', text: '#A882C8', border: 'rgba(168, 130, 200, 0.25)' },
  postponed:  { bg: 'rgba(180, 150, 120, 0.10)', text: '#B49678', border: 'rgba(180, 150, 120, 0.2)' },
  abandoned:  { bg: 'rgba(150, 150, 150, 0.10)', text: '#8A8A8A', border: 'rgba(150, 150, 150, 0.2)' },
};