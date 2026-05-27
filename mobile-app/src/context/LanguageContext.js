import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext('en');

export const LanguageProvider = ({ children, initialLocale = 'en' }) => {
  const [locale, setLocale] = useState(initialLocale);
  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);