import React, { createContext, useContext, useState } from 'react';
import ru from '../locales/ru';
import en from '../locales/en';
import ua from '../locales/ua';
import be from '../locales/be';

const locales = { ru, en, ua, be };

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState('ru');

  // 🔥 Функция перевода
  const t = (key, params = {}) => {
    const keys = key.split('.');
    let value = locales[locale];
    
    for (const k of keys) {
      if (value === undefined) return key;
      value = value[k];
    }
    
    if (typeof value !== 'string') return key;
    
    // Замена параметров {param}
    return value.replace(/\{(\w+)\}/g, (_, param) => params[param] || `{${param}}`);
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};