// src/locales/types.ts
export type Locale = 'ru' | 'en' | 'kk' | 'uk' | 'be' | 'sr';

export interface LocaleData {
  // ===== READER PROFILE =====
  birthDate: string;
  nativeCountry: string;
  currentCountry: string;
  nativeLanguage: string;
  spokenLanguages: string;
  readingLanguages: string;
  readingLanguagesHint: string;
  holdCtrlHint: string;
  favoriteGenres: string;
  favoriteThemes: string;
  favoriteVibes: string;
  favoriteAuthors: string;
  favoriteAuthorsPlaceholder: string;
  favoriteLiteraryCountries: string;
  favoriteEras: string;
  readingGoals: string;
  readingGoalRelaxation: string;
  readingGoalEmotions: string;
  readingGoalKnowledge: string;
  readingGoalSelfDevelopment: string;
  readingGoalInspiration: string;
  readingGoalEscapism: string;
  readingGoalWorkStudy: string;
  save: string;
  cancel: string;
  edit: string;
  fill: string;
  emptyProfile: string;
  title: string;
  editTitle: string;

  // ===== TAXONOMY =====
  taxonomy: {
    mood: Record<string, string>;
    vibe: Record<string, string>;
    theme: Record<string, string>;
    motif: Record<string, string>;
    countries: Record<string, string>;   // ← добавляем
    languages: Record<string, string>;   // ← добавляем
    eras: Record<string, string>;        // ← добавляем
  };

  // ===== NAVIGATION =====
  nav: {
    insights: string;
    worldmap: string;
    profile: string;
  };

  // ===== LIBRARY =====
  library: {
    title: string;
    total: string;
    searchPlaceholder: string;
    grid: string;
    list: string;
    clearFilters: string;
    empty: string;
    emptyFiltered: string;
  };
}