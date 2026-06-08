// App.tsx
import React from 'react';
import { ThemeProvider } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { LightingProvider } from './src/context/LightingContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <LightingProvider>
          <AppNavigator />
        </LightingProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}