// mobile-app/src/screens/HomeScreen/index.js
import React from 'react';
import { View, FlatList, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import useStore from '../../store';
import Header from '../../components/Header';
import BookCover from '../../components/BookCover';
import { Text } from '../../components/Text';
import { spacing, radii } from '../../theme/spacing';
import OrbBackground from '../../components/OrbBackground';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 16) / 3;
const ACTIVE_COVER_WIDTH = width * 0.4;

export default function HomeScreen({ navigation, lang }) {
  const { theme } = useTheme();
  const { books } = useStore();

  const activeBook = books.find(b => b.activeBookId === true) || books.find(b => b.status === 'reading');
  const readingBooks = books.filter(b => b.status === 'reading' && b.id !== activeBook?.id);

  const renderReadingCard = ({ item }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('BookDetails', { bookId: item.id, lang: lang })} 
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
        <Header navigation={navigation} lang={lang} booksCount={books.length} />

        <View style={{ paddingHorizontal: spacing.lg }}>

          {activeBook && (
            <View style={{ marginBottom: spacing.xl }}>
              <Text variant="h3" style={{ marginBottom: spacing.md, color: theme.primary }}>
                📖 Текущая книга
              </Text>
              
              <TouchableOpacity 
                onPress={() => navigation.navigate('BookDetails', { bookId: activeBook.id, lang: lang })}
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
                    Оценка: {activeBook.rating ? `${activeBook.rating}/5` : 'Нет'}
                  </Text>
                  <Text variant="h2" numberOfLines={2}>{activeBook.title}</Text>
                  <Text variant="body" style={{ marginTop: spacing.xs }}>{activeBook.author}</Text>
                  <Text variant="caption" style={{ marginTop: spacing.xs }}>
                    Жанры: {activeBook.genres?.join(', ') || '—'}
                  </Text>
                  <Text variant="caption">Начато: {activeBook.startDate || '—'}</Text>
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
            <View>
              <Text variant="h3" style={{ marginBottom: spacing.md }}>
                📚 В процессе чтения ({readingBooks.length})
              </Text>
              <FlatList 
                data={readingBooks}
                keyExtractor={item => item.id}
                numColumns={3}
                renderItem={renderReadingCard}
                scrollEnabled={false}
                columnWrapperStyle={{ justifyContent: 'space-between', gap: 8 }}
              />
            </View>
          )}

          {readingBooks.length === 0 && !activeBook && (
            <View style={{ padding: spacing.xl, alignItems: 'center' }}>
              <Text variant="body">Нет книг в процессе чтения</Text>
            </View>
          )}
          
          <View style={{ height: spacing.xl }} />
        </View>
      </ScrollView>
    </View>
  );
}