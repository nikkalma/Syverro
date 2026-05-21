import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function EmptyState({ lang }) {
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: theme.textSecondary, fontSize: 16 }}>{lang.empty?.title || '📭 Нет книг'}</Text>
      <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 8 }}>{lang.empty?.subtitle || 'Нажмите ➕, чтобы добавить'}</Text>
    </View>
  );
}