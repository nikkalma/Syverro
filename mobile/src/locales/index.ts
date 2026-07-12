import ru from './ru';
import en from './en';
import ua from './ua';
import be from './be';

// Экспорт типов для каждого языка
export type { RussianLocale } from './ru';
export type { EnglishLocale } from './en';
export type { UkrainianLocale } from './ua';
export type { BelarusianLocale } from './be';

// Тип для всех доступных языков
export type LanguageCode = 'ru' | 'en' | 'ua' | 'be';

// Тип для всего объекта локализации
export type LocaleValue = string | number | boolean | null;
export interface LocaleObject {
  [key: string]: LocaleValue | LocaleObject;
}

// Тип для структуры локали (на основе ru)
export type LocaleType = typeof ru;

// Объект со всеми локалями с явной типизацией
const locales: Record<LanguageCode, LocaleType> = {
  ru: ru as LocaleType,
  en: en as LocaleType,
  ua: ua as LocaleType,
  be: be as LocaleType,
};

export default locales;

// Хелпер для получения локали по коду
export const getLocale = (code: LanguageCode): LocaleType => {
  if (!locales[code]) {
    console.warn(`Locale "${code}" not found, falling back to Russian`);
    return locales.ru;
  }
  return locales[code];
};

// Хелпер для проверки существования языка
export const isValidLanguage = (code: string): code is LanguageCode => {
  return ['ru', 'en', 'ua', 'be'].includes(code);
};

// Тип для аргументов перевода
export interface TranslationParams {
  [key: string]: string | number;
}

// Тип для функции перевода
export type TranslateFunction = (key: string, params?: TranslationParams) => string;

// Тип для контекста языка
export interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  setLocale: (lang: LanguageCode) => void;
  t: TranslateFunction;
  locales: Record<LanguageCode, LocaleType>;
}

// Тип для провайдера языка
export interface LanguageProviderProps {
  children: React.ReactNode;
  defaultLanguage?: LanguageCode;
}