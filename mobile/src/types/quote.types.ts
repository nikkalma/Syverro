export interface Quote {
  id: string;
  bookId: string;
  text: string;
  createdAt: number;
}

export type NewQuote = Omit<Quote, 'id' | 'createdAt'>;