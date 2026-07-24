import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from './mobile/src/context/ThemeContext';
import { LanguageProvider } from './mobile/src/context/LanguageContext';
import { LightingProvider } from './mobile/src/context/LightingContext';
import { authService } from './mobile/src/services/auth.service';
import { initDatabase } from './mobile/src/db/database';
import { startSync } from './mobile/src/sync/bootstrap';
import { useStore } from './mobile/src/store';
import AuthScreen from './mobile/src/screens/AuthScreen';
import AppNavigator from './mobile/src/navigation/AppNavigator';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const loadBooks = useStore((state) => state.loadBooks);

  useEffect(() => {
    const init = async () => {
      console.log('🚀 Инициализация приложения...');

      // 1. Инициализация SQLite
      await initDatabase();
      console.log('✅ База данных инициализирована');

      // 2. Проверка авторизации
      const token = await authService.getToken();
      console.log('🔍 Токен:', token ? 'есть' : 'нет');
      setIsAuthenticated(!!token);

      // 3. Если авторизован — загружаем данные и запускаем sync
      if (token) {
        console.log('📚 Загрузка данных из SQLite...');
        await loadBooks();
        console.log('✅ Данные загружены');

        console.log('🔄 Запуск синхронизации...');
        startSync();
        console.log('✅ Синхронизация запущена');
      }

      setIsReady(true);
      console.log('✅ Приложение готово');
    };

    init().catch((error) => {
      console.error('❌ Ошибка инициализации:', error);
      setIsReady(true);
    });
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#5C7C9A" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <LightingProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              {!isAuthenticated ? (
                <Stack.Screen name="Auth" component={AuthScreen} />
              ) : (
                <Stack.Screen name="Main" component={AppNavigator} />
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </LightingProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}