import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { LightingProvider } from './src/context/LightingContext';
import { authService } from './src/services/auth.service';
import AuthScreen from './src/screens/AuthScreen';
import AppNavigator from './src/navigation/AppNavigator';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 Проверка токена...');
      const token = await authService.getToken();
      console.log('🔍 Токен получен:', token ? 'есть' : 'нет');
      setIsAuthenticated(!!token);
      setIsReady(true);
      console.log('✅ isReady = true');
    };
    checkAuth();
  }, []);

  if (!isReady) {
    console.log('⏳ Ожидание isReady...');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#5C7C9A" />
      </View>
    );
  }

  console.log('🎯 Рендер навигации, isAuthenticated =', isAuthenticated);

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