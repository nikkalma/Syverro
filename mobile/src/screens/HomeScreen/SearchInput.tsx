// src/screens/HomeScreen/SearchInput.tsx
import React from 'react';
import { TextInput } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface SearchInputProps {
  visible: boolean;
  value: string;
  onChange: (text: string) => void;
}

export default function SearchInput({ visible, value, onChange }: SearchInputProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  if (!visible) return null;

  return (
    <TextInput
      placeholder={`🔍 ${t('placeholders.search') || 'Поиск по названию, автору, жанру...'}`}
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