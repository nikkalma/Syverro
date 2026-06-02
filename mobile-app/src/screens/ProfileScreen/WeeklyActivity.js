// src/screens/ProfileScreen/components/WeeklyActivity.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GlassCard from '../../components/GlassCard';
import { spacing, radii } from '../../theme/spacing';
import { getTypography } from '../../theme/typography';

export default function WeeklyActivity({ theme, weekdayActivity, maxActivity, weekdays, locale }) {
  const typography = getTypography(locale);
  
  return (
    <GlassCard style={{ marginBottom: spacing.lg, padding: spacing.lg }}>
      <Text style={[typography.h3, { color: theme.textPrimary, marginBottom: spacing.md }]}>
        {locale === 'ru' ? '📅 Активность по дням' : '📅 Weekly Activity'}
      </Text>
      <View style={styles.barChart}>
        {weekdayActivity.map((value, index) => {
          const height = Math.max(4, (value / maxActivity) * 60);
          const isMax = value === maxActivity && maxActivity > 0;
          return (
            <View key={index} style={styles.barColumn}>
              <View style={[styles.bar, { height, backgroundColor: isMax ? theme.primary : theme.primary + '80' }]} />
              <Text style={[styles.barLabel, { color: theme.textMuted }]}>{weekdays[index]}</Text>
            </View>
          );
        })}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100 },
  barColumn: { alignItems: 'center', width: 30 },
  bar: { width: 24, borderRadius: radii.sm, marginBottom: spacing.xs },
  barLabel: { fontSize: 12 },
});