import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Keyboard } from 'react-native';
import GenreSelector from '../../components/GenreSelector';
import AuthorSelector from '../../components/AuthorSelector';
import LanguageSelector from '../../components/LanguageSelector';
import StatusPicker from './StatusPicker';
import RatingStars from './RatingStars';

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
  saveChanges,
  setIsEditing,
  setKeyboardHeight,
  scrollViewRef,
  lang,
  theme,
}) {
  console.log('🔍 lang?.fields:', lang?.fields);
console.log('🔍 authorCountry:', lang?.fields?.authorCountry);
console.log('🔍 series:', lang?.fields?.series);
console.log('🔍 seriesPosition:', lang?.fields?.seriesPosition);
console.log('🔍 originalYear:', lang?.fields?.originalYear);
  const fields = lang?.fields || {
    pages: 'Страницы',
    startDate: 'Дата начала',
    endDate: 'Дата окончания',
    rating: 'Оценка',
    review: 'Отзыв (будет виден всем)',
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
      contentContainerStyle={{
        paddingBottom: Platform.OS === 'ios' ? 40 : 30,
      }}
    >
      <StatusPicker
        selectedStatus={editStatus}
        onStatusChange={setEditStatus}
        lang={lang}
        theme={theme}
      />

      <AuthorSelector
        selectedAuthor={editAuthor}
        onAuthorChange={setEditAuthor}
        authorsList={[...new Set(books.map(b => b.author).filter(Boolean))]}
        lang={lang}
        theme={theme}
      />

      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
        {fields.authorCountry}
      </Text>
      <TextInput
        value={editAuthorCountry}
        onChangeText={setEditAuthorCountry}
        placeholder="Например: Россия, Япония"
        placeholderTextColor={theme.textSecondary}
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        onFocus={() => {
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }}
        style={{
          padding: 12,
          borderRadius: 12,
          marginBottom: 15,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
        }}
      />

      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
        {fields.series}
      </Text>
      <TextInput
        value={editSeries}
        onChangeText={setEditSeries}
        placeholder="Название серии"
        placeholderTextColor={theme.textSecondary}
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        onFocus={() => {
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }}
        style={{
          padding: 12,
          borderRadius: 12,
          marginBottom: 15,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
        }}
      />

      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
        {fields.seriesPosition}
      </Text>
      <TextInput
        value={editSeriesPosition}
        onChangeText={setEditSeriesPosition}
        keyboardType="numeric"
        placeholder="1, 2, 3..."
        placeholderTextColor={theme.textSecondary}
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        onFocus={() => {
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }}
        style={{
          padding: 12,
          borderRadius: 12,
          marginBottom: 15,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
        }}
      />

      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
        {fields.originalYear}
      </Text>
      <TextInput
        value={editOriginalYear}
        onChangeText={setEditOriginalYear}
        keyboardType="numeric"
        placeholder="1999, 1854..."
        placeholderTextColor={theme.textSecondary}
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        onFocus={() => {
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }}
        style={{
          padding: 12,
          borderRadius: 12,
          marginBottom: 15,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
        }}
      />

      <LanguageSelector
        selectedLanguages={editLanguages}
        onLanguagesChange={setEditLanguages}
        lang={lang}
        theme={theme}
      />

      <GenreSelector
        selectedGenres={editGenresArray}
        onGenresChange={setEditGenresArray}
        lang={lang}
        theme={theme}
      />

      <Text style={{ color: theme.textSecondary, marginBottom: 5, marginTop: 8 }}>
        {fields.pages}
      </Text>
      <TextInput
        value={editPages}
        onChangeText={setEditPages}
        keyboardType="numeric"
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        onFocus={() => {
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }}
        style={{
          padding: 12,
          borderRadius: 12,
          marginBottom: 15,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
        }}
      />

      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
        {fields.startDate}
      </Text>
      <TextInput
        value={editStartDate}
        onChangeText={setEditStartDate}
        placeholder="ДД.ММ.ГГГГ"
        placeholderTextColor={theme.textSecondary}
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        onFocus={() => {
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }}
        style={{
          padding: 12,
          borderRadius: 12,
          marginBottom: 15,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
        }}
      />

      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
        {fields.endDate}
      </Text>
      <TextInput
        value={editEndDate}
        onChangeText={setEditEndDate}
        placeholder="ДД.ММ.ГГГГ"
        placeholderTextColor={theme.textSecondary}
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        onFocus={() => {
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }}
        style={{
          padding: 12,
          borderRadius: 12,
          marginBottom: 15,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
        }}
      />

      <Text style={{ color: theme.textSecondary, marginBottom: 8 }}>
        {fields.rating}
      </Text>
      <RatingStars
        rating={editRating}
        onRatingChange={setEditRating}
        theme={theme}
        lang={lang}
      />

      <Text style={{ color: theme.textSecondary, marginBottom: 5, marginTop: 8 }}>
        {fields.review}
      </Text>
      <TextInput
        value={editReview}
        onChangeText={setEditReview}
        multiline
        numberOfLines={4}
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        onFocus={() => {
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }}
        style={{
          padding: 12,
          borderRadius: 12,
          marginBottom: 15,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
          minHeight: 100,
          textAlignVertical: 'top',
        }}
        placeholder="Поделитесь впечатлениями о книге..."
        placeholderTextColor={theme.textSecondary}
      />

      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>
        {fields.notes}
      </Text>
      <TextInput
        value={editNotes}
        onChangeText={setEditNotes}
        multiline
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        onFocus={() => {
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }}
        style={{
          padding: 12,
          borderRadius: 12,
          marginBottom: 15,
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
            borderRadius: 12,
            backgroundColor: theme.primary,
            flex: 1,
            alignItems: 'center',
          }}
          activeOpacity={0.7}
        >
          <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
            💾 {buttons.save}
          </Text>
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
            borderRadius: 12,
            backgroundColor: '#ff4444',
            flex: 1,
            alignItems: 'center',
          }}
          activeOpacity={0.7}
        >
          <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
            ✖️ {buttons.cancel}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}