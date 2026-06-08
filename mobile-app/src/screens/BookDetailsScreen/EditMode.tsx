// src/screens/BookDetailsScreen/EditMode.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Platform, Switch, Image, Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { File, Directory, Paths } from 'expo-file-system';
import GenreSelector from '../../components/GenreSelector';
import StatusPicker from './StatusPicker';
import { spacing, radii } from '../../theme/spacing';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import DateTimePicker from '@react-native-community/datetimepicker';

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
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  if (!editData) return null;

  const updateField = (field, value) => {
  // Авто-завершение при статусе "прочитано"
  if (field === 'status' && value === 'finished') {
    const totalPages = parseInt(editData.pages);
    if (totalPages && totalPages > 0) {
      setEditData({ 
        ...editData, 
        status: value, 
        currentPage: totalPages.toString() 
      });
      return;
    }
  }
  
  // Авто-смена статуса при достижении последней страницы
  if (field === 'currentPage') {
    const totalPages = parseInt(editData.pages);
    const newPage = parseInt(value);
    if (totalPages && newPage >= totalPages) {
      setEditData({ 
        ...editData, 
        currentPage: value, 
        status: 'finished' 
      });
      return;
    }
  }
  
  setEditData({ ...editData, [field]: value });
};

  const readingFormatOptions = [
    { value: 'reading', label: '📖 Читаю' },
    { value: 'listening', label: '🎧 Слушаю' },
  ];

  const languages = [
    { code: 'ru', label: 'Русский' },
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'es', label: 'Español' },
    { code: 'it', label: 'Italiano' },
    { code: 'pl', label: 'Polski' },
    { code: 'uk', label: 'Українська' },
    { code: 'be', label: 'Беларуская' },
  ];

  // Выбор обложки из галереи
  const pickCoverImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Нужно разрешение для доступа к галерее');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [2, 3],  // пропорции книги
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingCover(true);
        const pickedUri = result.assets[0].uri;

        // Папка для обложек
        const coversDir = new Directory(Paths.document, 'covers');
        try {
          await coversDir.create({ idempotent: true, intermediates: true });
        } catch (e) {
          console.log('Папка для обложек уже существует');
        }

        const fileName = `cover_${Date.now()}.jpg`;
        const newCoverFile = new File(coversDir, fileName);
        const pickedFile = new File(pickedUri);
        await pickedFile.copy(newCoverFile);

        updateField('cover', newCoverFile.uri);
        Alert.alert('Успех', 'Обложка добавлена');
      }
    } catch (error) {
      console.log('Ошибка выбора обложки:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить обложку');
    } finally {
      setUploadingCover(false);
    }
  };

  // Удаление обложки
  const removeCover = async () => {
    if (editData.cover && editData.cover.startsWith('file://')) {
      try {
        const coverFile = new File(editData.cover);
        await coverFile.delete();
      } catch (e) {
        console.log('Не удалось удалить файл:', e);
      }
    }
    updateField('cover', null);
  };

  const handleSavePress = () => {
    // Преобразуем жанры в массив, если пришли строкой
    let genres = editData.genres;
    if (typeof genres === 'string') {
      genres = genres.split(',').map(g => g.trim());
    }
    
    // Преобразуем языки в массив, если пришли строкой
    let languages = editData.languages;
    if (typeof languages === 'string') {
      languages = languages.split(',').map(l => l.trim());
    }

    const updatedBook = {
      ...book,
      title: editData.title,
      author: editData.author,
      status: editData.status,
      rating: editData.rating,
      genres: genres || [],
      languages: languages || [],
      totalPages: parseInt(editData.pages) || book.totalPages,
      currentPage: parseInt(editData.currentPage) || book.currentPage || 0,
      startDate: editData.startDate,
      endDate: editData.endDate,
      notes: editData.notes,
      review: editData.review,
      authorCountry: editData.authorCountry,
      series: editData.series,
      seriesPosition: editData.seriesPosition ? parseInt(editData.seriesPosition) : null,
      originalYear: editData.originalYear ? parseInt(editData.originalYear) : null,
      readingFormat: editData.readingFormat || 'reading',
      cover: editData.cover || book.cover,
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
      {/* Обложка */}
      <View style={{ marginBottom: spacing.md }}>
        <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>Обложка</Text>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={pickCoverImage}
            disabled={uploadingCover}
            style={{
              padding: 12,
              borderRadius: radii.md,
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: theme.border,
              flex: 1,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: theme.primary }}>
              {uploadingCover ? '⏳ Загрузка...' : (editData.cover ? '🖼 Изменить обложку' : '➕ Добавить обложку')}
            </Text>
          </TouchableOpacity>
          {editData.cover && (
            <TouchableOpacity
              onPress={removeCover}
              style={{
                padding: 12,
                borderRadius: radii.md,
                backgroundColor: theme.error + '20',
                borderWidth: 1,
                borderColor: theme.error,
              }}
            >
              <Text style={{ color: theme.error }}>🗑 Удалить</Text>
            </TouchableOpacity>
          )}
        </View>
        {editData.cover && (
          <Image
            source={{ uri: editData.cover }}
            style={{
              width: 100,
              height: 150,
              borderRadius: radii.md,
              marginTop: spacing.sm,
              alignSelf: 'center',
            }}
          />
        )}
      </View>

      {/* Название */}
      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>Название</Text>
      <TextInput
        value={editData.title}
        onChangeText={(val) => updateField('title', val)}
        placeholder="Название книги"
        placeholderTextColor={theme.textMuted}
        style={{
          padding: spacing.md,
          borderRadius: radii.md,
          marginBottom: spacing.md,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
        }}
      />

      {/* Автор */}
      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>Автор</Text>
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

      {/* Формат чтения */}
      <View style={{ marginBottom: spacing.md }}>
        <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>Формат</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {readingFormatOptions.map(option => (
            <TouchableOpacity
              key={option.value}
              onPress={() => updateField('readingFormat', option.value)}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: radii.md,
                backgroundColor: editData.readingFormat === option.value ? theme.primary : theme.surface,
                borderWidth: 1,
                borderColor: theme.border,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: editData.readingFormat === option.value ? '#FFF' : theme.textPrimary }}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Статус */}
      <StatusPicker
        selectedStatus={editData.status}
        onStatusChange={(status) => updateField('status', status)}
        theme={theme}
      />

      {/* Количество страниц */}
      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>Страниц</Text>
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

      {/* Текущая страница */}
      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>Текущая страница</Text>
      <TextInput
        value={editData.currentPage?.toString()}
        onChangeText={(val) => updateField('currentPage', val)}
        keyboardType="numeric"
        placeholder="Текущая страница"
        placeholderTextColor={theme.textMuted}
        style={{
          padding: spacing.md,
          borderRadius: radii.md,
          marginBottom: spacing.md,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
        }}
      />

      {/* Оценка */}
      <Text style={{ color: theme.textSecondary, marginBottom: 8 }}>Оценка</Text>
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

      {/* Жанры */}
      <GenreSelector
        selectedGenres={editData.genres || []}
        onGenresChange={(genres) => updateField('genres', genres)}
        lang={t}
      />

      {/* Язык чтения */}
      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>Язык чтения</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {languages.map(lang => (
            <TouchableOpacity
              key={lang.code}
              onPress={() => {
                const current = editData.languages || [];
                if (current.includes(lang.code)) {
                  updateField('languages', current.filter(l => l !== lang.code));
                } else {
                  updateField('languages', [...current, lang.code]);
                }
              }}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: (editData.languages || []).includes(lang.code) ? theme.primary : theme.surface,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Text style={{ color: (editData.languages || []).includes(lang.code) ? '#FFF' : theme.textPrimary }}>
                {lang.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Страна автора */}
      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>Страна автора</Text>
      <TextInput
        value={editData.authorCountry}
        onChangeText={(val) => updateField('authorCountry', val)}
        placeholder="Например: Россия, США, Великобритания"
        placeholderTextColor={theme.textMuted}
        style={{
          padding: spacing.md,
          borderRadius: radii.md,
          marginBottom: spacing.md,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
        }}
      />

      {/* Год оригинала */}
      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>Год оригинала</Text>
      <TextInput
        value={editData.originalYear?.toString()}
        onChangeText={(val) => updateField('originalYear', val)}
        keyboardType="numeric"
        placeholder="Например: 2020"
        placeholderTextColor={theme.textMuted}
        style={{
          padding: spacing.md,
          borderRadius: radii.md,
          marginBottom: spacing.md,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
        }}
      />

      {/* Серия */}
      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>Серия</Text>
      <TextInput
        value={editData.series}
        onChangeText={(val) => updateField('series', val)}
        placeholder="Название серии"
        placeholderTextColor={theme.textMuted}
        style={{
          padding: spacing.md,
          borderRadius: radii.md,
          marginBottom: spacing.md,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
        }}
      />

      {/* Номер в серии */}
      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>Номер в серии</Text>
      <TextInput
        value={editData.seriesPosition?.toString()}
        onChangeText={(val) => updateField('seriesPosition', val)}
        keyboardType="numeric"
        placeholder="Например: 1, 2, 3..."
        placeholderTextColor={theme.textMuted}
        style={{
          padding: spacing.md,
          borderRadius: radii.md,
          marginBottom: spacing.md,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
        }}
      />

      // Дата начала — добавляем TextInput рядом с календарём
<View style={{ marginBottom: spacing.md }}>
  <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>Дата начала</Text>
  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
    <TextInput
      style={{
        flex: 1,
        padding: spacing.md,
        borderRadius: radii.md,
        backgroundColor: theme.surface,
        color: theme.textPrimary,
        borderWidth: 1,
        borderColor: theme.border,
      }}
      placeholder="ДД.ММ.ГГГГ"
      placeholderTextColor={theme.textMuted}
      value={editData.startDate}
      onChangeText={(val) => updateField('startDate', val)}
    />
    <TouchableOpacity
      onPress={() => setShowStartDatePicker(true)}
      style={{
        padding: spacing.md,
        borderRadius: radii.md,
        backgroundColor: theme.surface,
        borderWidth: 1,
        borderColor: theme.border,
      }}
    >
      <Text style={{ fontSize: 20 }}>📅</Text>
    </TouchableOpacity>
  </View>
</View>

{showStartDatePicker && (
  <DateTimePicker
    value={editData.startDate ? new Date(editData.startDate.split('.').reverse().join('-')) : new Date()}
    mode="date"
    display="default"
    onChange={(event, selectedDate) => {
      setShowStartDatePicker(false);
      if (selectedDate) {
        const day = selectedDate.getDate().toString().padStart(2, '0');
        const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
        const year = selectedDate.getFullYear();
        updateField('startDate', `${day}.${month}.${year}`);
      }
    }}
  />
)}

    // Дата окончания
<View style={{ marginBottom: spacing.md }}>
  <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>Дата окончания</Text>
  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
    <TextInput
      style={{
        flex: 1,
        padding: spacing.md,
        borderRadius: radii.md,
        backgroundColor: theme.surface,
        color: theme.textPrimary,
        borderWidth: 1,
        borderColor: theme.border,
      }}
      placeholder="ДД.ММ.ГГГГ"
      placeholderTextColor={theme.textMuted}
      value={editData.endDate}
      onChangeText={(val) => updateField('endDate', val)}
    />
    <TouchableOpacity
      onPress={() => setShowEndDatePicker(true)}
      style={{
        padding: spacing.md,
        borderRadius: radii.md,
        backgroundColor: theme.surface,
        borderWidth: 1,
        borderColor: theme.border,
      }}
    >
      <Text style={{ fontSize: 20 }}>📅</Text>
    </TouchableOpacity>
  </View>
</View>

{showEndDatePicker && (
  <DateTimePicker
    value={editData.endDate ? new Date(editData.endDate.split('.').reverse().join('-')) : new Date()}
    mode="date"
    display="default"
    onChange={(event, selectedDate) => {
      setShowEndDatePicker(false);
      if (selectedDate) {
        const day = selectedDate.getDate().toString().padStart(2, '0');
        const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
        const year = selectedDate.getFullYear();
        updateField('endDate', `${day}.${month}.${year}`);
      }
    }}
  />
)}


      {/* Рецензия */}
      <Text style={{ color: theme.textSecondary, marginBottom: 5, marginTop: 8 }}>Рецензия</Text>
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
      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>Заметки</Text>
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