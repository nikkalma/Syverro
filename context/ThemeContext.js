import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightTheme, DarkTheme } from '../constants/Colors';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState('light');
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка сохранённой темы при запуске
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('themeMode');
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setMode(savedMode);
        }
      } catch (error) {
        console.log('Ошибка загрузки темы:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, []);

  // Сохранение темы при изменении
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem('themeMode', mode);
    }
  }, [mode, isLoading]);

  const getTheme = () => {
    if (mode === 'system') {
      return systemScheme === 'dark' ? DarkTheme : LightTheme;
    }
    return mode === 'dark' ? DarkTheme : LightTheme;
  };

  const toggleTheme = (newMode) => setMode(newMode);

  if (isLoading) {
    // Можно показать заглушку, пока грузится тема
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme: getTheme(), mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);