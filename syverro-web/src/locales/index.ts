// src/locales/index.ts
import { ru } from './ru';
import { en } from './en';
import { kk } from './kk';
import { uk } from './uk';
import { be } from './be';
import { sr } from './sr';
import type { Locale, LocaleData } from './types';

export { ru, en, kk, uk, be, sr };
export type { Locale, LocaleData };

export const localePriority: Locale[] = ['ru', 'en', 'kk', 'uk', 'be', 'sr'];

export const getBrowserLocale = (): Locale => {
  const saved = localStorage.getItem('syverro_locale') as Locale | null;
  if (saved && localePriority.includes(saved)) return saved;

  const browserLang = navigator.language.split('-')[0];
  const matched = localePriority.find((l) => l === browserLang);
  if (matched) return matched;

  return 'ru';
};

export const getLocaleData = (locale: Locale): LocaleData => {
  switch (locale) {
    case 'en':
      return en;
    case 'kk':
      return kk;
    case 'uk':
      return uk;
    case 'be':
      return be;
    case 'sr':
      return sr;
    default:
      return ru;
  }
};