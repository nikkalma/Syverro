// src/screens/ProfileScreen/WeeklyActivity.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, radii } from '../../theme/spacing';
import { getTypography } from '../../theme/typography';

interface Props {
  theme: any;
  weekdayActivity: number[];
  maxActivity: number;
  weekdays: string[];
  locale: string;
}

export default function WeeklyActivity({ theme, weekdayActivity, maxActivity, weekdays, locale }: Props) {
  const typography = getTypography(locale);
  
  return (
    <View style={styles.container}>
      <Text style={[typography.secondary, { color: theme.textMuted, marginBottom: spacing.md }]}>
        {locale === 'ru' ? '📊 Активность по дням' : '📊 Weekly Activity'}
      </Text>
      <View style={styles.barChart}>
        {weekdayActivity.map((value, index) => {
          const height = Math.max(4, (value / maxActivity) * 48);
          const isMax = value === maxActivity && maxActivity > 0;
          return (
            <View key={index} style={styles.barColumn}>
              <View style={[styles.bar, { height, backgroundColor: isMax ? theme.primary : theme.primary + '60' }]} />
              <Text style={[typography.caption, { color: theme.textMuted, marginTop: spacing.xs }]}>
                {weekdays[index]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xl },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 80,
  },
  barColumn: {
    alignItems: 'center',
    width: 32,
  },
  bar: {
    width: 24,
    borderRadius: radii.sm,
  },
});