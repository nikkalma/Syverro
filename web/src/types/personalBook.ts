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