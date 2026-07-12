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
  | 'audio';



export interface Quote {
  id: string;

  text: string;

  page?: number | null;

  note?: string | null;

  createdAt?: number;
}



export interface PersonalBook {

  id: string;

  userId: string;

  bookId: string;


  status: PersonalBookStatus;


  currentPage: number;


  favorite: boolean;


  notes: string;


  quotes: Quote[];


  review?: string | null;


  readingFormat?: ReadingFormat;


  startedAt?: string;


  completedAt?: string;


  rereadCount: number;
}



export const personalBookStatusLabels: Record<PersonalBookStatus, string> = {

  reading: 'Читаю',

  rereading: 'Перечитываю',

  completed: 'Завершено',

  planned: 'Хочу прочитать',

  postponed: 'Отложено',

  abandoned: 'Брошено',

};



export const personalBookStatusOrder: PersonalBookStatus[] = [

  'reading',

  'planned',

  'completed',

  'postponed',

  'abandoned',

  'rereading',

];
