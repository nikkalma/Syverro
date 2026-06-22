// src/pages/BookPage/types.ts
import { EnrichedBook } from '../../types/book';

export interface BookPageProps {
  book: EnrichedBook;
  onUpdate: (book: EnrichedBook) => void;
  onAddToLibrary: (status: string) => void;
  isInLibrary: boolean;
}