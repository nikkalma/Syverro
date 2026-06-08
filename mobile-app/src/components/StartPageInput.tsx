// src/components/StartPageInput.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { spacing, radii } from '../theme/spacing';
import { useLanguage } from '../context/LanguageContext';
import type { Book } from '../types/book.types';

interface StartPageInputProps {
  book: Book;
  onSave: (page: number) => void;
  theme: any;
}

export default function StartPageInput({ book, onSave, theme }: StartPageInputProps) {
  const { t } = useLanguage();
  const [startPage, setStartPage] = useState(book.manualStartPage?.toString() || '');
  const [isEditing, setIsEditing] = useState(!book.manualStartPage && book.currentPage === 0);

  const maxPages = book.totalPages || 0;

  const handleSave = () => {
    const pageNum = parseInt(startPage, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      Alert.alert(t('common.error') || 'Ошибка', t('session.invalidPage') || 'Введите корректный номер страницы');
      return;
    }
    if (maxPages > 0 && pageNum > maxPages) {
      Alert.alert(t('common.error') || 'Ошибка', `${t('session.invalidPage') || 'Страница не может быть больше'} ${maxPages}`);
      return;
    }
    onSave(pageNum);
    setIsEditing(false);
  };

  if (!isEditing && book.manualStartPage) {
    return (
      <View style={{ marginBottom: spacing.md }}>
        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
          📍 {t('session.startPage') || 'Начато со страницы'}: {book.manualStartPage}
        </Text>
        <TouchableOpacity onPress={() => setIsEditing(true)}>
          <Text style={{ color: theme.primary, fontSize: 12 }}>{t('common.edit') || 'Изменить'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isEditing && !book.manualStartPage) {
    return (
      <TouchableOpacity onPress={() => setIsEditing(true)} style={{ marginBottom: spacing.md }}>
        <Text style={{ color: theme.primary, fontSize: 14 }}>✏️ {t('session.setStartPage') || 'Указать начальную страницу'}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={{ color: theme.textSecondary, marginBottom: spacing.sm }}>
        {t('session.startPageQuestion') || 'С какой страницы вы начали читать эту книгу?'}
      </Text>
      <TextInput
        value={startPage}
        onChangeText={setStartPage}
        keyboardType="numeric"
        placeholder={`1–${maxPages || '...'}`}
        placeholderTextColor={theme.textMuted}
        style={{
          padding: spacing.md,
          borderRadius: radii.md,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
          fontSize: 16,
          marginBottom: spacing.sm,
        }}
      />
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <TouchableOpacity
          onPress={handleSave}
          style={{ flex: 1, padding: spacing.sm, backgroundColor: theme.primary, borderRadius: radii.md, alignItems: 'center' }}
        >
          <Text style={{ color: '#FFF' }}>{t('common.save') || 'Сохранить'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsEditing(false)}
          style={{ flex: 1, padding: spacing.sm, backgroundColor: theme.surface, borderRadius: radii.md, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}
        >
          <Text style={{ color: theme.textSecondary }}>{t('common.cancel') || 'Отмена'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}