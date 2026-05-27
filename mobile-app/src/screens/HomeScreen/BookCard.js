import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import useStore from '../../store';
import BookCover from '../../components/BookCover';

export default function BookCard({ item, width, navigation, lang }) {
  const { theme } = useTheme();
  const { deleteBook, toggleFavorite } = useStore();  // ← добавили toggleFavorite

  const handleDelete = () => {
    Alert.alert(
      lang.actions?.deleteTitle || 'Удаление книги',
      `${lang.actions?.deleteConfirm || 'Точно удалить'} "${item.title}"?`,
      [
        { text: lang.actions?.cancel || 'Отмена', style: 'cancel' },
        { text: lang.actions?.delete || 'Удалить', onPress: () => deleteBook(item.id), style: 'destructive' }
      ]
    );
  };

  return (
    <TouchableOpacity 
      onPress={() => navigation.navigate('Details', { bookId: item.id, lang: lang })} 
      style={{ 
        width: width,
        backgroundColor: theme.surface,
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.border,
      }}
      activeOpacity={0.4}
    >
      <BookCover 
        coverUrl={item.cover}
        title={item.title}
        width={width}
        height={width * 1.5}
      />
      <View style={{ padding: 10 }}>
        <Text 
          style={{ 
            color: theme.textPrimary, 
            fontSize: 13, 
            fontWeight: 'bold', 
            marginBottom: 4,
          }} 
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.title}
        </Text>
        <Text 
          style={{ 
            color: theme.textSecondary, 
            fontSize: 11, 
            marginBottom: 4,
          }} 
          numberOfLines={1}
        >
          {item.author}
        </Text>
        <Text style={{ color: theme.status, fontSize: 12, fontWeight: '500', marginBottom: 2 }}>
          {lang.status[item.status]}
        </Text>
        {item.rating && item.rating > 0 && (
          <Text style={{ color: theme.status, fontSize: 11 }}>
            {'⭐'.repeat(item.rating)}
          </Text>
        )}
      </View>
      
      {/* Кнопка удаления */}
      <TouchableOpacity 
        onPress={handleDelete}
        style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 4 }}
        activeOpacity={0.4}
      >
        <Text style={{ color: '#fff', fontSize: 16 }}>🗑️</Text>
      </TouchableOpacity>
      
      {/* Кнопка лайка (любимая книга) */}
      <TouchableOpacity 
        onPress={() => toggleFavorite(item.id)}
        style={{ position: 'absolute', top: 8, right: 40, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 4 }}
        activeOpacity={0.4}
      >
        <Text style={{ fontSize: 16 }}>{item.favorite ? '❤️' : '🤍'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}