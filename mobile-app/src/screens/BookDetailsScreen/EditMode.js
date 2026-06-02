import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Keyboard, Switch } from 'react-native';
import GenreSelector from '../../components/GenreSelector';
import StatusPicker from './StatusPicker';
import { spacing, radii } from '../../theme/spacing';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export default function EditMode({ 
  book, 
  books, 
  editData, 
  setEditData, 
  onSave, 
  onCancel 
}) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  if (!editData) return null;
  
  const updateField = (field, value) => {
    setEditData({ ...editData, [field]: value });
  };
  
  const fields = {
    author: t?.('fields.author') || 'Автор',
    pages: t?.('fields.pages') || 'Страницы',
    rating: t?.('fields.rating') || 'Оценка',
    review: t?.('fields.review') || 'Отзыв',
    notes: t?.('fields.notes') || 'Заметки',
  };
  
  const handleSavePress = () => {
    const updatedBook = {
      ...book,
      author: editData.author,
      status: editData.status,
      rating: editData.rating,
      genres: editData.genres,
      languages: editData.languages,
      totalPages: parseInt(editData.pages) || book.totalPages,
      startDate: editData.startDate,
      endDate: editData.endDate,
      notes: editData.notes,
      review: editData.review,
      authorCountry: editData.authorCountry,
      series: editData.series,
      seriesPosition: editData.seriesPosition ? parseInt(editData.seriesPosition) : null,
      originalYear: editData.originalYear ? parseInt(editData.originalYear) : null,
    };
    if (onSave) onSave(updatedBook);
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={true}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: Platform.OS === 'ios' ? 40 : 30 }}
    >
      {/* Статус */}
      <StatusPicker 
        selectedStatus={editData.status} 
        onStatusChange={(status) => updateField('status', status)}
        theme={theme}
      />

      {/* Автор */}
      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>{fields.author}</Text>
      <TextInput
        value={editData.author}
        onChangeText={(val) => updateField('author', val)}
        placeholder="Имя автора"
        placeholderTextColor={theme.textMuted}
        style={{
          padding: spacing.md,
          borderRadius: radii.md,
          marginBottom: spacing.md,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
        }}
      />

      {/* Страницы */}
      <Text style={{ color: theme.textSecondary, marginBottom: 5, marginTop: 8 }}>{fields.pages}</Text>
      <TextInput
        value={editData.pages?.toString()}
        onChangeText={(val) => updateField('pages', val)}
        keyboardType="numeric"
        placeholder="Количество страниц"
        placeholderTextColor={theme.textMuted}
        style={{
          padding: spacing.md,
          borderRadius: radii.md,
          marginBottom: spacing.md,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
        }}
      />

      {/* Рейтинг */}
      <Text style={{ color: theme.textSecondary, marginBottom: 8 }}>{fields.rating}</Text>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 15 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => updateField('rating', star)}
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: editData.rating === star ? theme.primary : theme.surface,
              borderWidth: editData.rating === star ? 0 : 1,
              borderColor: theme.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: editData.rating === star ? '#FFF' : theme.textPrimary, fontSize: 18 }}>
              {star}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Основная книга */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, marginTop: 8 }}>
        <Text style={{ color: theme.textSecondary }}>Сделать основной книгой</Text>
        <Switch
          value={editData.activeBookId || false}
          onValueChange={(val) => updateField('activeBookId', val)}
          trackColor={{ false: theme.border, true: theme.primary }}
          thumbColor={'#FFF'}
        />
      </View>

      {/* Рецензия */}
      <Text style={{ color: theme.textSecondary, marginBottom: 5, marginTop: 8 }}>{fields.review}</Text>
      <TextInput
        value={editData.review}
        onChangeText={(val) => updateField('review', val)}
        multiline
        numberOfLines={4}
        style={{
          padding: spacing.md,
          borderRadius: radii.md,
          marginBottom: spacing.md,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
          minHeight: 100,
          textAlignVertical: 'top',
        }}
        placeholder="Поделитесь впечатлениями о книге..."
        placeholderTextColor={theme.textMuted}
      />

      {/* Заметки */}
      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>{fields.notes}</Text>
      <TextInput
        value={editData.notes}
        onChangeText={(val) => updateField('notes', val)}
        multiline
        style={{
          padding: spacing.md,
          borderRadius: radii.md,
          marginBottom: spacing.md,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
          minHeight: 80,
        }}
      />

      {/* Кнопки */}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 40 }}>
        <TouchableOpacity
          onPress={handleSavePress}
          style={{ padding: 14, borderRadius: radii.lg, backgroundColor: theme.primary, flex: 1, alignItems: 'center' }}
        >
          <Text style={{ color: '#FFF', fontWeight: 'bold' }}>💾 Сохранить</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onCancel}
          style={{ padding: 14, borderRadius: radii.lg, backgroundColor: theme.error, flex: 1, alignItems: 'center' }}
        >
          <Text style={{ color: '#FFF', fontWeight: 'bold' }}>✖️ Отмена</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}