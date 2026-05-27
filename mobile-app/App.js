import InsightsScreen from './src/screens/InsightsScreen';
import ChallengesScreen from './src/screens/ChallengesScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';
import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './src/context/ThemeContext';
import useStore from './src/store';  // ← ИСПРАВЛЕНО: было './store'
import BookDetailsScreen from './src/screens/BookDetailsScreen';
import AboutScreen from './src/screens/AboutScreen';
import StatsScreen from './src/screens/StatsScreen';
import { LanguageProvider } from './src/context/LanguageContext';
import HomeScreen from './src/screens/HomeScreen';
import CustomDrawerContent from './src/screens/CustomDrawerContent';
import STRINGS from './src/locales';  // ← ИСПРАВЛЕНО: было './locales'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View } from 'react-native';
import ProfileScreen from './src/screens/ProfileScreen';
import FavoriteBooksScreen from './src/screens/FavoriteBooksScreen';
import { LogBox } from 'react-native';
import { useFonts } from 'expo-font';


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
  // 1. ВСЕ ХУКИ В НАЧАЛЕ
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

  const [fontsLoaded] = useFonts({
    'Inter_28pt-Regular': require('./assets/fonts/Inter_28pt-Regular.ttf'),
    'Inter_28pt-Semibold': require('./assets/fonts/Inter_28pt-SemiBold.ttf'),
    'NotoSansJP-Regular': require('./assets/fonts/NotoSansJP-Regular.ttf'),
    'NotoSansKR-Regular': require('./assets/fonts/NotoSansKR-Regular.ttf'),
    'PlayfairDisplay-Regular': require('./assets/fonts/PlayfairDisplay-Regular.ttf'),
  });

  // 2. ТОЛЬКО ПОСЛЕ ВСЕХ ХУКОВ — ПРОВЕРКИ
  if (!fontsLoaded) {
    return null;
  }
  
  return (
    <LanguageProvider initialLocale={locale}>
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
                <Stack.Screen name="Insights">
                  {props => <InsightsScreen {...props} lang={lang} />}
                </Stack.Screen>
                <Stack.Screen name="Challenges">
                  {props => <ChallengesScreen {...props} lang={lang} />}
                </Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </ThemeProvider>
        </GestureHandlerRootView>
      </View>
    </LanguageProvider>
  );
}