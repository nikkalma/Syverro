// src/screens/ProfileScreen/components/KeyMetrics.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GlassCard from '../../components/GlassCard';
import { spacing } from '../../theme/spacing';
import { getTypography } from '../../theme/typography';

export default function KeyMetrics({ theme, finishedBooks, totalPagesRead, averageRatingFinished, locale }) {
  const typography = getTypography(locale);
  
  // 🔥 Конвертируем из 10-балльной в 5-балльную для отображения
  const averageRating5 = (averageRatingFinished / 2).toFixed(1);
  
  return (
    <GlassCard style={{ marginBottom: spacing.lg, padding: spacing.lg }}>
      <Text style={[typography.h3, { color: theme.textPrimary, marginBottom: spacing.md }]}>
        {locale === 'ru' ? '📊 Ключевые метрики' : '📊 Key Metrics'}
      </Text>
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: theme.primary }]}>{finishedBooks}</Text>
          <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
            {locale === 'ru' ? 'Прочитано книг' : 'Books read'}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: theme.primary }]}>{totalPagesRead}</Text>
          <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
            {locale === 'ru' ? 'Прочитано стр.' : 'Pages read'}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: theme.primary }]}>{averageRating5}</Text>
          <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
            {locale === 'ru' ? 'Ср. рейтинг' : 'Avg rating'}
          </Text>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
  metricItem: { alignItems: 'center', minWidth: '40%', marginBottom: spacing.md },
  metricValue: { fontSize: 28, fontWeight: 'bold' },
  metricLabel: { fontSize: 12, marginTop: spacing.xs },
});