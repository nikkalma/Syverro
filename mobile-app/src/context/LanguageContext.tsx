import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import locales, { LanguageCode, TranslateFunction, TranslationParams } from '../locales';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  setLocale: (lang: LanguageCode) => void; // Добавить алиас
  t: TranslateFunction;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('ru');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    const saved = await AsyncStorage.getItem('@language');
    if (saved && ['ru', 'en', 'ua', 'be'].includes(saved)) {
      setLanguageState(saved as LanguageCode);
    }
  };

  const setLanguage = async (lang: LanguageCode) => {
    setLanguageState(lang);
    await AsyncStorage.setItem('@language', lang);
  };

  const t = (key: string, params?: TranslationParams): string => {
    const keys = key.split('.');
    let value: any = locales[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }
    
    if (typeof value !== 'string') {
      // Fallback to Russian
      let fallback: any = locales.ru;
      for (const k of keys) {
        if (fallback && typeof fallback === 'object') {
          fallback = fallback[k];
        } else {
          fallback = key;
          break;
        }
      }
      value = typeof fallback === 'string' ? fallback : key;
    }
    
    // Replace params
    if (params && typeof value === 'string') {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
      });
    }
    
    return value;
  };

  return (
    <LanguageContext.Provider 
      value={{ 
        language, 
        setLanguage, 
        setLocale: setLanguage, // Алиас для обратной совместимости
        t 
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};