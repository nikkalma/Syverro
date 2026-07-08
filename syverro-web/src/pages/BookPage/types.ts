// src/pages/BookPage/types.ts
import { EnrichedBook } from 'types/globalBook';

export interface BookPageProps {
  book: EnrichedBook;
  onUpdate: (book: EnrichedBook) => void;
  onAddToLibrary: (status: string) => void;
  isInLibrary: boolean;
}
