// src/navigation/AppNavigator.js
import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';

// Экраны для TabBar
import ProfileScreen from '../screens/ProfileScreen';
import SessionScreen from '../screens/SessionScreen';
import LibraryScreen from '../screens/LibraryScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Экран деталей (не в табах)
import BookDetailsScreen from '../screens/BookDetailsScreen';

// Дополнительные экраны (не в табах)
import InsightsScreen from '../screens/InsightsScreen';
import FavoriteBooksScreen from '../screens/FavoriteBooksScreen';
import AboutScreen from '../screens/AboutScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabIcon = ({ name, color, size }) => {
  const icons = {
    Profile: '👤',
    Session: '📖',
    Library: '📚',
    Settings: '⚙️',
  };
  return <Text style={{ fontSize: size, color }}>{icons[name]}</Text>;
};

function MainTabs() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 4,
        },
      }}
    >
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabIcon name="Profile" color={color} size={size} />,
          tabBarLabel: 'Профиль',
        }}
      />
      <Tab.Screen 
        name="Session" 
        component={SessionScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabIcon name="Session" color={color} size={size} />,
          tabBarLabel: 'Сессии',
        }}
      />
      <Tab.Screen 
        name="Library" 
        component={LibraryScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabIcon name="Library" color={color} size={size} />,
          tabBarLabel: 'Библиотека',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabIcon name="Settings" color={color} size={size} />,
          tabBarLabel: 'Настройки',
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator({ lang, locale, setLocale }) {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="BookDetails" component={BookDetailsScreen} />
     <Stack.Screen name="Insights">
  {props => <InsightsScreen {...props} lang={lang} />}
</Stack.Screen>
      <Stack.Screen name="FavoriteBooks" component={FavoriteBooksScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
    </Stack.Navigator>
  );
}