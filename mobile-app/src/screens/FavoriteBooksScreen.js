import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import useStore from '../store';
import BookCard from './HomeScreen/BookCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function FavoriteBooksScreen({ navigation, lang }) {
  const { theme } = useTheme();
  const { books } = useStore();
  
  const favoriteBooks = books.filter(b => b.favorite === true);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 50, marginBottom: 20 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 15 }} activeOpacity={0.4}>
          <Text style={{ color: theme.textPrimary, fontSize: 28 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: theme.textPrimary, fontSize: 28, fontWeight: 'bold' }}>❤️ Любимые книги</Text>
      </View>

      {favoriteBooks.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: theme.textSecondary, fontSize: 16 }}>Нет любимых книг</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 8 }}>Нажмите 🤍 на книге, чтобы добавить</Text>
        </View>
      ) : (
        <FlatList 
          data={favoriteBooks} 
          keyExtractor={item => item.id} 
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          renderItem={({ item }) => (
            <BookCard 
              item={item} 
              width={CARD_WIDTH} 
              navigation={navigation} 
              lang={lang} 
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}