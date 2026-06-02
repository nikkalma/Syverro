import React from 'react';
import { ThemeProvider } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { LightingProvider } from './src/context/LightingContext';  // ← ДОБАВИТЬ
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <LightingProvider>  {/* ← ОБЕРНУТЬ */}
          <AppNavigator />
        </LightingProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}