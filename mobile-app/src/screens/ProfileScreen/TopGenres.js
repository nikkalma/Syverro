// src/screens/ProfileScreen/components/TopGenres.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GlassCard from '../../components/GlassCard';
import { spacing } from '../../theme/spacing';
import { getTypography } from '../../theme/typography';

export default function TopGenres({ theme, topGenres, locale }) {
  const typography = getTypography(locale);
  
  if (topGenres.length === 0) return null;
  
  return (
    <GlassCard style={{ marginBottom: spacing.lg, padding: spacing.lg }}>
      <Text style={[typography.h3, { color: theme.textPrimary, marginBottom: spacing.md }]}>
        {locale === 'ru' ? '🏆 Топ жанров' : '🏆 Top Genres'}
      </Text>
      {topGenres.map(([genre, count], index) => (
        <View key={index} style={styles.genreRow}>
          <Text style={[typography.body, { color: theme.textPrimary }]}>{genre}</Text>
          <Text style={[typography.body, { color: theme.primary, fontWeight: '500' }]}>
            {locale === 'ru' ? `${count} книг` : `${count} ${count === 1 ? 'book' : 'books'}`}
          </Text>
        </View>
      ))}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  genreRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
});