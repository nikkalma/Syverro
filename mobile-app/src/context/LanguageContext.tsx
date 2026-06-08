// src/context/LanguageContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import ru from '../locales/ru';
import en from '../locales/en';
import ua from '../locales/ua';
import be from '../locales/be';

type Locale = 'ru' | 'en' | 'ua' | 'be';

const locales: Record<Locale, any> = { ru, en, ua, be };

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>('ru');

  const t = (key: string, params: Record<string, string | number> = {}): string => {
    const keys = key.split('.');
    let value: any = locales[locale];
    
    for (const k of keys) {
      if (value === undefined) return key;
      value = value[k];
    }
    
    if (typeof value !== 'string') return key;
    
    return value.replace(/\{(\w+)\}/g, (_, param) => String(params[param] || `{${param}}`));
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};