// mobile-app/src/components/GlassCard.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { glass } from '../theme/glass';
import { spacing } from '../theme/spacing';

export const GlassCard = ({ children, elevated = false, style, themeMode = 'dark' }) => {
  const g = glass(themeMode);

  return (
    <View
      style={[
        {
          backgroundColor: g.background,
          borderColor: g.border,
          borderWidth: 1,
          borderRadius: g.borderRadius,
          padding: g.padding || spacing.lg,
          // Glow/тень
          shadowColor: themeMode === 'dark' ? '#7C5CFF' : '#6C5CE7',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: elevated ? 0.3 : 0.1,
          shadowRadius: elevated ? 20 : 8,
          elevation: elevated ? 8 : 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
