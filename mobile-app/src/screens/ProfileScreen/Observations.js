// src/screens/ProfileScreen/components/Observations.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GlassCard from '../../components/GlassCard';
import { spacing } from '../../theme/spacing';
import { getTypography } from '../../theme/typography';

export default function Observations({ theme, observations, locale }) {
  const typography = getTypography(locale);
  
  if (observations.length === 0) return null;
  
  return (
    <GlassCard style={{ marginBottom: spacing.lg, padding: spacing.lg }}>
      <Text style={[typography.h3, { color: theme.textPrimary, marginBottom: spacing.md }]}>
        {locale === 'ru' ? '💭 Наблюдения' : '💭 Insights'}
      </Text>
      {observations.map((obs, index) => (
        <Text key={index} style={[typography.secondary, { color: theme.textSecondary, marginBottom: spacing.sm }]}>
          • {obs}
        </Text>
      ))}
    </GlassCard>
  );
}