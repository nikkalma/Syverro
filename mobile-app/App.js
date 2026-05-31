import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { LightingProvider } from './src/context/LightingContext';
import useStore from './src/store';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const { profile, updateProfile } = useStore();

  return (
    <LanguageProvider>
      <ThemeProvider>
        <LightingProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </LightingProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}