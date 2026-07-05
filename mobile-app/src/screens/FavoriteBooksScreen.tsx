// src/screens/FavoriteBooksScreen.tsx
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useStore } from '../store';
import BookCard from './HomeScreen/BookCard';
import type { Book } from '../types/book.types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface FavoriteBooksScreenProps {
  navigation: any;
}

export default function FavoriteBooksScreen({ navigation }: FavoriteBooksScreenProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { books } = useStore();
  
  const favoriteBooks = books.filter((b: Book) => b.favorite === true);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 50, marginBottom: 20 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 15 }} activeOpacity={0.4}>
          <Text style={{ color: theme.textPrimary, fontSize: 28 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: theme.textPrimary, fontSize: 28, fontWeight: 'bold' }}>
          ❤️ {t('favoriteBooks.title') || 'Избранные книги'}
        </Text>
      </View>

      {favoriteBooks.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: theme.textSecondary, fontSize: 16 }}>
            {t('favoriteBooks.emptyTitle') || 'Нет избранных книг'}
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 8 }}>
            {t('favoriteBooks.emptyMessage') || 'Нажмите ❤️ на книге, чтобы добавить'}
          </Text>
        </View>
      ) : (
        <FlatList 
          data={favoriteBooks} 
          keyExtractor={(item) => item.id} 
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          renderItem={({ item }) => (
            <BookCard 
              item={item} 
              width={CARD_WIDTH} 
              navigation={navigation} 
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}