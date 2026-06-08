// src/screens/HomeScreen/AddBookForm.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import useStore from '../../store';
import type { Book } from '../../types/book.types';

interface AddBookFormProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddBookForm({ visible, onClose }: AddBookFormProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { addBook } = useStore();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');

  const handleAddBook = async () => {
    if (!title.trim() || !author.trim()) {
      Alert.alert(t('common.error') || 'Ошибка', t('errors.emptyFields') || 'Заполните название и автора');
      return;
    }
    
    const newBook: Omit<Book, 'id' | 'createdAt'> = { 
      title: title.trim(), 
      author: author.trim(), 
      status: 'planned', 
      rating: null,
      cover: null,
      section: null,
      genres: [], 
      totalPages: 0, 
      currentPage: 0,
      startDate: null, 
      endDate: null, 
      notes: '',
      languages: [],
      review: '',
      favorite: false,
      authorCountry: null,
      series: null,
      seriesPosition: null,
      originalYear: null,
      readingFormat: 'reading',
      lastRead: null,
    };
    
    await addBook(newBook);
    setTitle('');
    setAuthor('');
    onClose();
    Alert.alert(t('common.success') || 'Готово!', t('common.bookAdded') || 'Книга добавлена');
  };

  if (!visible) return null;

  return (
    <View style={{ marginBottom: 12 }}>
      <TextInput 
        placeholder={t('placeholders.title') || "Название"} 
        placeholderTextColor={theme.textSecondary} 
        value={title} 
        onChangeText={setTitle} 
        style={{ backgroundColor: theme.surface, color: theme.textPrimary, padding: 14, borderRadius: 12, marginBottom: 10 }} 
      />
      <TextInput 
        placeholder={t('placeholders.author') || "Автор"} 
        placeholderTextColor={theme.textSecondary} 
        value={author} 
        onChangeText={setAuthor} 
        style={{ backgroundColor: theme.surface, color: theme.textPrimary, padding: 14, borderRadius: 12, marginBottom: 12 }} 
      />
      <TouchableOpacity 
        onPress={handleAddBook}
        style={{ padding: 14, backgroundColor: theme.primary, borderRadius: 12, alignItems: 'center' }}
        activeOpacity={0.4}
      >
        <Text style={{ color: '#FFF', fontWeight: '600' }}>{t('buttons.save') || 'Сохранить'}</Text>
      </TouchableOpacity>
    </View>
  );
}