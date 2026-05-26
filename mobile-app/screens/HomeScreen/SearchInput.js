import React from 'react';
import { TextInput } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function SearchInput({ visible, value, onChange, lang }) {
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    <TextInput
      placeholder={`🔍 ${lang.placeholders?.search || 'Поиск по названию, автору, жанру...'}`}
      placeholderTextColor={theme.textSecondary}
      value={value}
      onChangeText={onChange}
      style={{
        backgroundColor: theme.surface,
        color: theme.textPrimary,
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
      }}
    />
  );
}