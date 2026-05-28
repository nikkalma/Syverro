import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import BookCover from '../../components/BookCover';
import { Text } from '../../components/Text';
import { useTheme } from '../../context/ThemeContext';
import useStore from '../../store';
import { spacing } from '../../theme/spacing';

export default function BookCard({ item, width, navigation, lang }) {
  const { theme } = useTheme();
  const { setActiveBook } = useStore();

  return (
    <TouchableOpacity 
      onPress={() => navigation.navigate('Details', { bookId: item.id, lang })}
      style={{ width, marginBottom: spacing.md }}
      activeOpacity={0.7}
    >
      <View style={{ position: 'relative' }}>
        <BookCover 
          coverUrl={item.cover}
          title={item.title}
          width={width}
          height={width * 1.4}
        />
        
        {/* Кнопка "Сделать активной" */}
        <TouchableOpacity 
          onPress={() => setActiveBook(item.id)}
          style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: 6, zIndex: 10 }}
        >
          <Text style={{ fontSize: 14, color: item.isActive ? '#FFD700' : '#FFF' }}>
            {item.isActive ? '⭐' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={{ marginTop: spacing.xs }}>
        <Text variant="secondary" style={{ color: theme.textPrimary }} numberOfLines={1}>
          {item.title}
        </Text>
        <Text variant="caption" style={{ color: theme.textSecondary }} numberOfLines={1}>
          {item.author}
        </Text>
        <Text variant="caption" style={{ color: theme.textSecondary, marginTop: 2 }}>
          Оценка: {item.rating ? `${item.rating}/5` : 'Нет'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}