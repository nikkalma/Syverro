import AchievementsScreen from './screens/AchievementsScreen';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';
import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './context/ThemeContext';
import useStore from './store';
import BookDetailsScreen from './screens/BookDetailsScreen';
import AboutScreen from './screens/AboutScreen';
import StatsScreen from './screens/StatsScreen';
import HomeScreen from './screens/HomeScreen';
import CustomDrawerContent from './screens/CustomDrawerContent';
import STRINGS from './locales';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View } from 'react-native';
import ProfileScreen from './screens/ProfileScreen';
import FavoriteBooksScreen from './screens/FavoriteBooksScreen';
import { LogBox } from 'react-native';
LogBox.ignoreLogs(['Text strings must be rendered within a <Text> component']);

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// ========== НАВИГАТОР ==========
function AppNavigator({ lang, locale, setLocale }) {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} lang={lang} setLocale={setLocale} locale={locale} />}
      screenOptions={{ 
        headerShown: false, 
        swipeEnabled: false,
        drawerStyle: {
          width: 220,
        }
      }}
    >
      <Drawer.Screen name="Home">
        {props => <HomeScreen {...props} lang={lang} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [locale, setLocale] = useState('ru');
  const lang = STRINGS[locale];
  
  useEffect(() => {
    const loadLang = async () => {
      const saved = await AsyncStorage.getItem('appLocale');
      if (saved) setLocale(saved);
    };
    loadLang();
  }, []);
  
  useEffect(() => {
    AsyncStorage.setItem('appLocale', locale);
  }, [locale]);
  
  useEffect(() => {
    const runMigration = async () => {
      const migrated = await AsyncStorage.getItem('ratingsMigrated');
      if (!migrated) {
        const { migrateOldRatings } = useStore.getState();
        migrateOldRatings();
        await AsyncStorage.setItem('ratingsMigrated', 'true');
      }
    };
    runMigration();
  }, []);
  
  const onLayoutRootView = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);
  
  return (
    <View onLayout={onLayoutRootView} style={{ flex: 1 }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Main">
                {props => <AppNavigator {...props} key={locale} lang={lang} locale={locale} setLocale={setLocale} />}
              </Stack.Screen>
              <Stack.Screen name="Details">
                {props => <BookDetailsScreen {...props} lang={lang} />}
              </Stack.Screen>
              <Stack.Screen name="About">
                {props => <AboutScreen {...props} lang={lang} />}
              </Stack.Screen>
              <Stack.Screen name="Achievements">
                {props => <AchievementsScreen {...props} lang={lang} />}
            </Stack.Screen>
              <Stack.Screen name="Stats">
                {props => <StatsScreen {...props} lang={lang} />}
              </Stack.Screen>
              <Stack.Screen name="Profile">
                {props => <ProfileScreen {...props} lang={lang} />}
              </Stack.Screen>
              <Stack.Screen name="FavoriteBooks">
                {props => <FavoriteBooksScreen {...props} lang={lang} />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </ThemeProvider>
      </GestureHandlerRootView>
    </View>
  );
}