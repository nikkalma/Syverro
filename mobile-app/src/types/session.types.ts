export type SessionStatus = 'active' | 'completed';

export interface ReadingSession {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  startPage: number;
  endPage: number;
  pagesRead: number;
  duration: number;
  startTime: number;
  endTime: number | null;
  date: string;
  status: SessionStatus;
}

export type NewSession = Omit<ReadingSession, 'id'>;