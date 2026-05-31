import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Keyboard, Switch } from 'react-native';
import GenreSelector from '../../components/GenreSelector';
import AuthorSelector from '../../components/AuthorSelector';
import StatusPicker from './StatusPicker';
import { spacing, radii } from '../../theme/spacing';

export default function EditMode({
  book,
  books,
  editAuthor,
  setEditAuthor,
  editStatus,
  setEditStatus,
  editRating,
  setEditRating,
  editGenresArray,
  setEditGenresArray,
  editLanguages,
  setEditLanguages,
  editPages,
  setEditPages,
  editStartDate,
  setEditStartDate,
  editEndDate,
  setEditEndDate,
  editNotes,
  setEditNotes,
  editReview,
  setEditReview,
  editAuthorCountry,
  setEditAuthorCountry,
  editSeries,
  setEditSeries,
  editSeriesPosition,
  setEditSeriesPosition,
  editOriginalYear,
  setEditOriginalYear,
  editactiveBookId,
  setEditactiveBookId,
  saveChanges,
  setIsEditing,
  setKeyboardHeight,
  scrollViewRef,
  lang,
  theme,
}) {
  const fields = lang?.fields || {
    pages: 'Страницы',
    startDate: 'Дата начала',
    endDate: 'Дата окончания',
    rating: 'Оценка',
    review: 'Отзыв',
    notes: 'Заметки',
    authorCountry: 'Страна автора',
    series: 'Серия',
    seriesPosition: 'Номер в серии',
    originalYear: 'Год оригинала',
  };
  
  const buttons = lang?.buttons || { save: 'Сохранить', cancel: 'Отмена' };

  return (
    <ScrollView
      ref={scrollViewRef}
      showsVerticalScrollIndicator={true}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 40 : 30 }}
    >
      <StatusPicker selectedStatus={editStatus} onStatusChange={setEditStatus} lang={lang} theme={theme} />

      <AuthorSelector
        selectedAuthor={editAuthor}
        onAuthorChange={setEditAuthor}
        authorsList={[...new Set(books.map(b => b.author).filter(Boolean))]}
        lang={lang}
        theme={theme}
      />

      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>{fields.authorCountry}</Text>
      <TextInput
        value={editAuthorCountry}
        onChangeText={setEditAuthorCountry}
        placeholder="Например: Россия, Япония"
        placeholderTextColor={theme.textMuted}
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        style={{
          padding: spacing.md,
          borderRadius: radii.md,
          marginBottom: spacing.md,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
        }}
      />

      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>{fields.series}</Text>
      <TextInput
        value={editSeries}
        onChangeText={setEditSeries}
        placeholder="Название серии"
        placeholderTextColor={theme.textMuted}
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        style={{
          padding: spacing.md,
          borderRadius: radii.md,
          marginBottom: spacing.md,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
        }}
      />

      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>{fields.seriesPosition}</Text>
      <TextInput
        value={editSeriesPosition}
        onChangeText={setEditSeriesPosition}
        keyboardType="numeric"
        placeholder="1, 2, 3..."
        placeholderTextColor={theme.textMuted}
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        style={{
          padding: spacing.md,
          borderRadius: radii.md,
          marginBottom: spacing.md,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
        }}
      />

      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>{fields.originalYear}</Text>
      <TextInput
        value={editOriginalYear}
        onChangeText={setEditOriginalYear}
        keyboardType="numeric"
        placeholder="1999, 1854..."
        placeholderTextColor={theme.textMuted}
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        style={{
          padding: spacing.md,
          borderRadius: radii.md,
          marginBottom: spacing.md,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
        }}
      />

      <GenreSelector
        selectedGenres={editGenresArray}
        onGenresChange={setEditGenresArray}
        lang={lang}
        theme={theme}
      />

      <Text style={{ color: theme.textSecondary, marginBottom: 5, marginTop: 8 }}>{fields.pages}</Text>
      <TextInput
        value={editPages}
        onChangeText={setEditPages}
        keyboardType="numeric"
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        style={{
          padding: spacing.md,
          borderRadius: radii.md,
          marginBottom: spacing.md,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
        }}
      />

      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>{fields.startDate}</Text>
      <TextInput
        value={editStartDate}
        onChangeText={setEditStartDate}
        placeholder="ДД.ММ.ГГГГ"
        placeholderTextColor={theme.textMuted}
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        style={{
          padding: spacing.md,
          borderRadius: radii.md,
          marginBottom: spacing.md,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
        }}
      />

      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>{fields.endDate}</Text>
      <TextInput
        value={editEndDate}
        onChangeText={setEditEndDate}
        placeholder="ДД.ММ.ГГГГ"
        placeholderTextColor={theme.textMuted}
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        style={{
          padding: spacing.md,
          borderRadius: radii.md,
          marginBottom: spacing.md,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
        }}
      />

      <Text style={{ color: theme.textSecondary, marginBottom: 8 }}>{fields.rating}</Text>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 15 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setEditRating(star)}
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: editRating === star ? theme.primary : theme.surface,
              borderWidth: editRating === star ? 0 : 1,
              borderColor: theme.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                color: editRating === star ? '#FFF' : theme.textPrimary,
                fontSize: 18,
                fontWeight: editRating === star ? 'bold' : 'normal',
              }}
            >
              {star}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, marginTop: 8 }}>
        <Text style={{ color: theme.textSecondary }}>Сделать основной книгой</Text>
        <Switch
          value={editactiveBookId}
          onValueChange={setEditactiveBookId}
          trackColor={{ false: theme.border, true: theme.primary }}
          thumbColor={'#FFF'}
        />
      </View>

      <Text style={{ color: theme.textSecondary, marginBottom: 5, marginTop: 8 }}>{fields.review}</Text>
      <TextInput
        value={editReview}
        onChangeText={setEditReview}
        multiline
        numberOfLines={4}
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
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

      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>{fields.notes}</Text>
      <TextInput
        value={editNotes}
        onChangeText={setEditNotes}
        multiline
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        style={{
          padding: spacing.md,
          borderRadius: radii.md,
          marginBottom: spacing.md,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
          minHeight: 80,
        }}
      />

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 40 }}>
        <TouchableOpacity
          onPress={saveChanges}
          style={{
            padding: 14,
            borderRadius: radii.lg,
            backgroundColor: theme.primary,
            flex: 1,
            alignItems: 'center',
          }}
          activeOpacity={0.7}
        >
          <Text style={{ color: '#FFF', fontWeight: 'bold' }}>💾 {buttons.save}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setIsEditing(false);
            Keyboard.dismiss();
            setKeyboardHeight(0);
            setTimeout(() => scrollViewRef.current?.scrollTo({ y: 0, animated: true }), 100);
          }}
          style={{
            padding: 14,
            borderRadius: radii.lg,
            backgroundColor: theme.error,
            flex: 1,
            alignItems: 'center',
          }}
          activeOpacity={0.7}
        >
          <Text style={{ color: '#FFF', fontWeight: 'bold' }}>✖️ {buttons.cancel}</Text>
        </TouchableOpacity>
        {/* Кнопка для цитат */}
<TouchableOpacity
  onPress={() => {
    setIsEditing(false); // выходим из режима редактирования
    navigation.navigate('QuotesModal', { bookId: book.id });
  }}
  style={{
    padding: 14,
    borderRadius: radii.lg,
    backgroundColor: theme.accent || theme.primary,
    flex: 1,
    alignItems: 'center',
    marginBottom: 12,
  }}
  activeOpacity={0.7}
>
  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>📝 Цитаты</Text>
</TouchableOpacity>
      </View>
    </ScrollView>
  );
}