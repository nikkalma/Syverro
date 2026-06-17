import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

// Screens
import AuthScreen from '../screens/AuthScreen';        // ← ДОБАВИТЬ
import LibraryScreen from '../screens/LibraryScreen';
import SessionScreen from '../screens/SessionScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import QuotesScreen from '../screens/QuotesScreen';
import FavoriteBooksScreen from '../screens/FavoriteBooksScreen';
import AboutScreen from '../screens/AboutScreen';
import BookDetailsScreen from '../screens/BookDetailsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border || theme.textSecondary + '20',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'book-outline';

          switch (route.name) {
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            case 'Library':
              iconName = focused ? 'library' : 'library-outline';
              break;
            case 'Session':
              iconName = focused ? 'timer' : 'timer-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: 4,
        },
      })}
    >
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: t('tabs.profile') || 'Профиль' }}
      />
      <Tab.Screen 
        name="Library" 
        component={LibraryScreen} 
        options={{ title: t('tabs.library') || 'Библиотека' }}
      />
      <Tab.Screen 
        name="Session" 
        component={SessionScreen} 
        options={{ title: t('tabs.session') || 'Сессия' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: t('tabs.settings') || 'Настройки' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.surface },
        headerTintColor: theme.textPrimary,
        headerTitleStyle: { fontWeight: '300', fontSize: 18 },
        headerBackTitle: '',  
        presentation: 'card',
      }}
    >
      {/* 🔐 ЭКРАН АВТОРИЗАЦИИ - ПЕРВЫЙ */}
      <Stack.Screen 
        name="Auth" 
        component={AuthScreen} 
        options={{ headerShown: false }} 
      />
      
      {/* 🏠 ГЛАВНЫЕ ЭКРАНЫ (после входа) */}
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="BookDetails" 
        component={BookDetailsScreen} 
        options={{ title: t('screens.bookDetails') || '' }} 
      />
      <Stack.Screen 
        name="Quotes" 
        component={QuotesScreen} 
        options={{ title: t('screens.quotes') || 'Цитаты' }} 
      />
      <Stack.Screen 
        name="FavoriteBooks" 
        component={FavoriteBooksScreen} 
        options={{ title: t('screens.favorites') || 'Избранное' }} 
      />
      <Stack.Screen 
        name="About" 
        component={AboutScreen} 
        options={{ title: t('screens.about') || 'О приложении' }} 
      />
    </Stack.Navigator>
  );
}