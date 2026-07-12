// src/components/Header.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  navigation: any;
  booksCount: number;
}

export default function Header({ navigation, booksCount }: HeaderProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <View style={{ 
      flexDirection: 'row', 
      alignItems: 'center', 
      marginTop: 35, 
      marginBottom: 20,
      paddingHorizontal: 18,
    }}>
      <TouchableOpacity 
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        style={{ marginRight: 15, padding: 5 }}
        activeOpacity={0.4}
      >
        <Text style={{ color: theme.textPrimary, fontSize: 32 }}>☰</Text>
      </TouchableOpacity>
      
      <Text style={{ color: theme.textPrimary, fontSize: 28, flex: 1 }}>{t('app.title')}</Text>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ color: theme.textSecondary, fontSize: 14 }}>📚 {booksCount} {t('books.count')}</Text>
      </View>
    </View>
  );
}