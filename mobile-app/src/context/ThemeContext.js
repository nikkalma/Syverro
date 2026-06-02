import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../theme/colors';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState('light');
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem('themeMode', mode);
    }
  }, [mode, isLoading]);

  const getTheme = () => {
    if (mode === 'system') {
      return systemScheme === 'dark' ? darkTheme : lightTheme;
    }
    return mode === 'dark' ? darkTheme : lightTheme;
  };

  const toggleTheme = (newMode) => setMode(newMode);

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme: getTheme(), mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 🔥 ВАЖНО: useTheme должен быть здесь и правильно экспортироваться
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};