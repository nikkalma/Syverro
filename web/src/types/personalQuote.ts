// src/types/personalQuote.ts
export interface PersonalQuote {
  id: string;
  text: string;
  page: number | null;
  note: string | null;
  createdAt: number;
}