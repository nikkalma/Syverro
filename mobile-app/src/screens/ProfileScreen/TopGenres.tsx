// src/screens/ProfileScreen/TopGenres.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, radii } from '../../theme/spacing';
import { getTypography } from '../../theme/typography';
import type { Book } from '../../types/book.types';

interface Props {
  theme: any;
  books: Book[];
  locale: string;
}

export default function TopGenres({ theme, books, locale }: Props) {
  const typography = getTypography(locale);
  
  const relevantStatuses = ['finished', 'reading', 'rereading'];
  const filteredBooks = books.filter(book => relevantStatuses.includes(book.status));
  
  if (filteredBooks.length === 0) return null;
  
  const genreMap = new Map<string, number>();
  filteredBooks.forEach(book => {
    if (book.genres && Array.isArray(book.genres)) {
      book.genres.forEach((genre: string) => {  // ← добавил тип :string
        genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
      });
    }
  });
  
  const sortedGenres = Array.from(genreMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  if (sortedGenres.length === 0) return null;
  
  const total = sortedGenres.reduce((sum, [, count]) => sum + count, 0);
  
  return (
    <View style={styles.container}>
      <Text style={[typography.secondary, { color: theme.textMuted, marginBottom: spacing.md }]}>
        {locale === 'ru' ? '🏆 Топ жанров' : '🏆 Top Genres'}
      </Text>
      
      {sortedGenres.map(([genre, count]) => {
        const percentage = (count / total) * 100;
        return (
          <View key={genre} style={styles.genreBlock}>
            <Text style={[typography.body, { color: theme.textPrimary, marginBottom: spacing.xs }]}>
              {genre}
            </Text>
            <View style={styles.barWrapper}>
              <View style={styles.barContainer}>
                <View style={[styles.bar, { width: `${percentage}%`, backgroundColor: theme.primary }]} />
              </View>
              <Text style={[typography.caption, { color: theme.textMuted, marginLeft: spacing.sm, width: 35, textAlign: 'right' }]}>
                {Math.round(percentage)}%
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xl },
  genreBlock: { marginBottom: spacing.md },
  barWrapper: { flexDirection: 'row', alignItems: 'center' },
  barContainer: { flex: 1, height: 6, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: radii.sm, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: radii.sm },
});