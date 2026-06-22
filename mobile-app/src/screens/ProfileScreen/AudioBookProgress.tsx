// src/screens/ProfileScreen/AudioBookProgress.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, radii } from '../../theme/spacing';
import { getTypography } from '../../theme/typography';
import type { Book } from '../../types/book';

interface AudioBookProgressProps {
  theme: any;
  books: Book[];
  locale: string;
}

export default function AudioBookProgress({ theme, books, locale }: AudioBookProgressProps) {
  const typography = getTypography(locale);
  
  const relevantStatuses = ['finished', 'reading', 'rereading'];
  const relevantBooks = books.filter(b => relevantStatuses.includes(b.status));
  
  const readingBooks = relevantBooks.filter(b => b.readingFormat === 'reading' || !b.readingFormat);
  const listeningBooks = relevantBooks.filter(b => b.readingFormat === 'listening');
  const totalActive = readingBooks.length + listeningBooks.length;
  
  if (totalActive === 0) return null;
  
  const audioPercentage = (listeningBooks.length / totalActive) * 100;
  
  return (
    <View style={styles.container}>
      <Text style={[typography.secondary, { color: theme.textMuted, marginBottom: spacing.sm }]}>
        {locale === 'ru' ? '📖 Текст vs 🎧 Аудио' : '📖 Text vs 🎧 Audio'}
      </Text>
      
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: `${audioPercentage}%`, backgroundColor: theme.accent }
          ]} 
        />
        <View 
          style={[
            styles.progressBarRemaining, 
            { width: `${100 - audioPercentage}%`, backgroundColor: theme.primary }
          ]} 
        />
      </View>
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.accent }]} />
          <Text style={[typography.caption, { color: theme.textSecondary }]}>
            {locale === 'ru' ? 'Аудиокниги' : 'Audio'} ({listeningBooks.length})
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
          <Text style={[typography.caption, { color: theme.textSecondary }]}>
            {locale === 'ru' ? 'Текстовые' : 'Text'} ({readingBooks.length})
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xl },
  progressBarContainer: { flexDirection: 'row', height: 8, borderRadius: radii.sm, overflow: 'hidden', marginBottom: spacing.sm },
  progressBar: { height: '100%' },
  progressBarRemaining: { height: '100%' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginTop: spacing.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
});