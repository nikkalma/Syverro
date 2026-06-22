// src/types/reader.ts

export type ReadingGoal =
  | 'relaxation'
  | 'emotions'
  | 'knowledge'
  | 'self-development'
  | 'inspiration'
  | 'escapism'
  | 'work-study';

export const readingGoalLabels: Record<ReadingGoal, string> = {
  relaxation: 'Отдых',
  emotions: 'Эмоции',
  knowledge: 'Новые знания',
  'self-development': 'Саморазвитие',
  inspiration: 'Вдохновение',
  escapism: 'Эскапизм',
  'work-study': 'Работа / учёба',
};

export interface ReaderProfile {
  // Основная информация
  birthDate?: string; // YYYY-MM-DD
  nativeCountry?: string;
  currentCountry?: string;
  displayName?: string;
  avatar?: string;
  status?: string;
  level?: string;

  // Языки
  nativeLanguage?: string;
  spokenLanguages?: string[];
  readingLanguages?: string[];

  // Предпочтения
  favoriteGenres?: string[];
  favoriteThemes?: string[];
  favoriteVibes?: string[];
  favoriteAuthors?: string[];
  favoriteLiteraryCountries?: string[];
  favoriteEras?: string[];
  favoriteMotifs?: string[];   // ← добавили

  // Цели чтения
  readingGoals?: ReadingGoal[];
  
  // Цитата дня
  quoteOfTheDay?: string;
}