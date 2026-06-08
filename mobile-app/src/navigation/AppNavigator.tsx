// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

// Tab экраны
import ProfileScreen from '../screens/ProfileScreen';
import SessionScreen from '../screens/SessionScreen';
import LibraryScreen from '../screens/LibraryScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Stack экраны
import BookDetailsScreen from '../screens/BookDetailsScreen';
import FavoriteBooksScreen from '../screens/FavoriteBooksScreen';
import AboutScreen from '../screens/AboutScreen';
import QuotesScreen from '../screens/QuotesScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'book-outline';
          if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Session') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Library') {
            iconName = focused ? 'library' : 'library-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 4,
        },
      })}
    >
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('menu.profile') || 'Профиль' }} />
      <Tab.Screen name="Session" component={SessionScreen} options={{ title: t('session.title') || 'Сессии' }} />
      <Tab.Screen name="Library" component={LibraryScreen} options={{ title: t('menu.stats') || 'Библиотека' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: t('settings.title') || 'Настройки' }} />
    </Tab.Navigator>
  );
}

function MainStack() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.surface },
        headerTintColor: theme.textPrimary,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="BookDetails" component={BookDetailsScreen} options={{ title: t('screens.details') || 'Детали книги' }} />
      <Stack.Screen name="FavoriteBooks" component={FavoriteBooksScreen} options={{ title: t('favoriteBooks.title') || 'Избранное' }} />
      <Stack.Screen name="Quotes" component={QuotesScreen} options={{ title: t('quotes.title') || 'Мои цитаты' }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ title: t('about.title') || 'О приложении' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { theme } = useTheme();
  
  return (
    <NavigationContainer>
      <MainStack />
    </NavigationContainer>
  );
}