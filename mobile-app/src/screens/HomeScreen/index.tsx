// src/screens/HomeScreen/index.tsx
import React from 'react';
import { View, FlatList, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import useStore from '../../store';
import Header from '../../components/Header';
import BookCover from '../../components/BookCover';
import { Text } from '../../components/Text';
import { spacing, radii } from '../../theme/spacing';
import OrbBackground from '../../components/OrbBackground';
import type { Book } from '../../types/book.types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 16) / 3;
const ACTIVE_COVER_WIDTH = width * 0.4;

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { books, activeBookId } = useStore();

  const activeBook = books.find((b: Book) => b.id === activeBookId) || books.find((b: Book) => b.status === 'reading');
  const readingBooks = books.filter((b: Book) => b.status === 'reading' && b.id !== activeBook?.id);

  const renderReadingCard = ({ item }: { item: Book }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('BookDetails', { bookId: item.id })} 
      style={{ width: CARD_WIDTH, marginBottom: spacing.md }}
      activeOpacity={0.7}
    >
      <BookCover 
        coverUrl={item.cover} 
        title={item.title} 
        width={CARD_WIDTH} 
        height={CARD_WIDTH * 1.4} 
      />
      <Text variant="secondary" numberOfLines={1} style={{ marginTop: spacing.xs }}>
        {item.title}
      </Text>
      <Text variant="caption" numberOfLines={1}>{item.author}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <OrbBackground size={350} />
      
      <ScrollView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <Header navigation={navigation} booksCount={books.length} />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.xxl }}>

          {activeBook && (
            <View style={{ gap: spacing.md }}>
              <Text variant="h3" style={{ color: theme.primary }}>
                {t('session.currentBook') || '📖 Текущая книга'}
              </Text>
              
              <TouchableOpacity 
                onPress={() => navigation.navigate('BookDetails', { bookId: activeBook.id })}
                style={{ flexDirection: 'row', gap: spacing.md }}
                activeOpacity={0.7}
              >
                <View style={{
                  borderRadius: radii.xl,
                  borderWidth: 3,
                  borderColor: theme.currentBookGlow || theme.primary,
                  shadowColor: theme.currentBookGlow || theme.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 6,
                  overflow: 'hidden',
                }}>
                  <BookCover 
                    coverUrl={activeBook.cover} 
                    title={activeBook.title} 
                    width={ACTIVE_COVER_WIDTH} 
                    height={ACTIVE_COVER_WIDTH * 1.4} 
                  />
                </View>
                
                <View style={{ flex: 1, justifyContent: 'flex-start' }}>
                  <Text variant="body" style={{ marginBottom: spacing.xs }}>
                    {t('bookDetails.rating')}: {activeBook.rating ? `${activeBook.rating}/5` : t('common.none') || 'Нет'}
                  </Text>
                  <Text variant="h2" numberOfLines={2}>{activeBook.title}</Text>
                  <Text variant="body" style={{ marginTop: spacing.xs }}>{activeBook.author}</Text>
                  <Text variant="caption" style={{ marginTop: spacing.xs }}>
                    {t('fields.genres')}: {activeBook.genres?.join(', ') || '—'}
                  </Text>
                  <Text variant="caption">{t('fields.startDate')}: {activeBook.startDate || '—'}</Text>
                </View>
              </TouchableOpacity>
              
              {activeBook.notes ? (
                <View style={{ marginTop: spacing.md, padding: spacing.sm, backgroundColor: theme.surface, borderRadius: radii.md }}>
                  <Text variant="caption">📝 {activeBook.notes}</Text>
                </View>
              ) : null}
            </View>
          )}

          {readingBooks.length > 0 && (
            <View style={{ gap: spacing.md }}>
              <Text variant="h3">
                {t('session.readingBooks') || '📚 В процессе чтения'} ({readingBooks.length})
              </Text>
              <FlatList 
                data={readingBooks}
                keyExtractor={(item) => item.id}
                numColumns={3}
                renderItem={renderReadingCard}
                scrollEnabled={false}
                columnWrapperStyle={{ justifyContent: 'space-between', gap: spacing.sm }}
              />
            </View>
          )}

          {readingBooks.length === 0 && !activeBook && (
            <View style={{ padding: spacing.xxxl, alignItems: 'center' }}>
              <Text variant="body">{t('empty.title') || 'Нет книг в процессе чтения'}</Text>
            </View>
          )}
          
          <View style={{ height: spacing.xl }} />
        </View>
      </ScrollView>
    </View>
  );
}