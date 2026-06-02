import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Tab экраны
import ProfileScreen from '../screens/ProfileScreen';
import SessionScreen from '../screens/SessionScreen';
import LibraryScreen from '../screens/LibraryScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Stack экраны
import BookDetailsScreen from '../screens/BookDetailsScreen';
// ❌ УДАЛИТЬ: import InsightsScreen from '../screens/InsightsScreen';
import FavoriteBooksScreen from '../screens/FavoriteBooksScreen';
import AboutScreen from '../screens/AboutScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
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
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Профиль' }} />
      <Tab.Screen name="Session" component={SessionScreen} options={{ title: 'Сессии' }} />
      <Tab.Screen name="Library" component={LibraryScreen} options={{ title: 'Библиотека' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Настройки' }} />
    </Tab.Navigator>
  );
}

function MainStack() {
  const { theme } = useTheme();
  
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
      <Stack.Screen name="BookDetails" component={BookDetailsScreen} options={{ title: 'Детали книги' }} />
      {/* ❌ УДАЛИТЬ ЭТУ СТРОКУ: <Stack.Screen name="Insights" component={InsightsScreen} options={{ title: 'Аналитика' }} /> */}
      <Stack.Screen name="FavoriteBooks" component={FavoriteBooksScreen} options={{ title: 'Избранное' }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ title: 'О приложении' }} />
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