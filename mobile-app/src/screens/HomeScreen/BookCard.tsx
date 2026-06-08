// src/screens/HomeScreen/BookCard.tsx
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import BookCover from '../../components/BookCover';
import { Text } from '../../components/Text';
import { useTheme } from '../../context/ThemeContext';
import useStore from '../../store';
import { spacing } from '../../theme/spacing';
import type { Book } from '../../types/book.types';

interface BookCardProps {
  item: Book;
  width: number;
  navigation: any;
}

export default function BookCard({ item, width, navigation }: BookCardProps) {
  const { theme } = useTheme();
  const { toggleFavorite } = useStore();

  return (
    <TouchableOpacity 
      onPress={() => navigation.navigate('BookDetails', { bookId: item.id })}
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
        
        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation();
            toggleFavorite(item.id);
          }}
          style={{ 
            position: 'absolute', 
            top: spacing.sm, 
            right: spacing.sm, 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            borderRadius: 20, 
            padding: spacing.xs, 
            zIndex: 10 
          }}
        >
          <Text style={{ fontSize: 12, color: item.favorite ? '#FF6B6B' : '#FFF' }}>
            {item.favorite ? '❤️' : '♡'}
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
          {t('bookDetails.rating')}: {item.rating ? `${item.rating}/5` : t('common.none') || 'Нет'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}