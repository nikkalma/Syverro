// src/screens/HomeScreen/EmptyState.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export default function EmptyState() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: theme.textSecondary, fontSize: 16 }}>{t('empty.title') || '📭 Нет книг'}</Text>
      <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 8 }}>{t('empty.subtitle') || 'Нажмите ➕, чтобы добавить'}</Text>
    </View>
  );
}