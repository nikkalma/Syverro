import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import useStore from '../../store';

export default function AddBookForm({ visible, onClose, lang }) {
  const { theme } = useTheme();
  const { addBook } = useStore();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');

  const handleAddBook = async () => {
    if (!title.trim() || !author.trim()) {
      Alert.alert('Ошибка', 'Заполните название и автора');
      return;
    }
    
  const newBook = { 
    id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 6),
    title, 
    author, 
    status: 'planned', 
    rating: null,
    cover: null,
    section: '', 
    genres: [], 
    pages: null, 
    startDate: '', 
    endDate: '', 
    notes: '',
    languages: [],
    review: '',
    createdAt: Date.now(),
    favorite: false,
    // НОВЫЕ ПОЛЯ
    authorCountry: '',
    series: '',
    seriesPosition: null,
    originalYear: null,
  };
    
    await addBook(newBook);
    setTitle('');
    setAuthor('');
    onClose();
    Alert.alert('Готово!', 'Книга добавлена');
  };

  if (!visible) return null;

  return (
    <View style={{ marginBottom: 12 }}>
      <TextInput 
        placeholder={lang.placeholders?.title || "Название"} 
        placeholderTextColor={theme.textSecondary} 
        value={title} 
        onChangeText={setTitle} 
        style={{ backgroundColor: theme.surface, color: theme.textPrimary, padding: 14, borderRadius: 12, marginBottom: 10 }} 
      />
      <TextInput 
        placeholder={lang.placeholders?.author || "Автор"} 
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
        <Text style={{ color: '#FFF', fontWeight: '600' }}>{lang.buttons?.save || 'Сохранить'}</Text>
      </TouchableOpacity>
    </View>
  );
}