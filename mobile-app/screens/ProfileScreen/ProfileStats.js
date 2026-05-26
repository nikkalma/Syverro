import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function ProfileStats({ books, finishedBooks, totalPages, avgRating, favoriteCount, theme, navigation }) {
  const totalBooks = books.length;

  return (
    <>
      <View style={{ 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between',
        rowGap: 12,
        marginBottom: 20,
      }}>
        <View style={{ width: '31%', backgroundColor: theme.surface, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
          <Text style={{ fontSize: 22, marginBottom: 4 }}>📚</Text>
          <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: 'bold' }}>{totalBooks}</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 10 }}>всего книг</Text>
        </View>
        <View style={{ width: '31%', backgroundColor: theme.surface, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
          <Text style={{ fontSize: 22, marginBottom: 4 }}>✅</Text>
          <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: 'bold' }}>{finishedBooks}</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 10 }}>прочитано</Text>
        </View>
        <View style={{ width: '31%', backgroundColor: theme.surface, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
          <Text style={{ fontSize: 22, marginBottom: 4 }}>📄</Text>
          <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: 'bold' }}>{totalPages}</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 10 }}>страниц</Text>
        </View>
        <View style={{ width: '31%', backgroundColor: theme.surface, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
          <Text style={{ fontSize: 22, marginBottom: 4 }}>⭐</Text>
          <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: 'bold' }}>{avgRating}</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 10 }}>средняя</Text>
        </View>
        <View style={{ width: '31%', backgroundColor: theme.surface, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
          <Text style={{ fontSize: 22, marginBottom: 4 }}>❤️</Text>
          <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: 'bold' }}>{favoriteCount}</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 10 }}>любимых</Text>
        </View>
      </View>

      <TouchableOpacity 
        onPress={() => navigation.navigate('FavoriteBooks')}
        style={{ 
          backgroundColor: theme.primary, 
          padding: 14, 
          borderRadius: 12, 
          alignItems: 'center',
          marginBottom: 30,
        }}
        activeOpacity={0.7}
      >
        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>❤️ Мои любимые книги</Text>
      </TouchableOpacity>
    </>
  );
}