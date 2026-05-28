// mobile-app/src/components/GlassCard.js
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing, radii } from '../theme/spacing';

export default function GlassCard({ 
  children, 
  elevated = false, 
  style, 
  noPadding = false,
  onPress,
}) {
  const { theme, themeMode } = useTheme();
  
  const glassBackground = theme.glassBackground || (themeMode === 'dark' 
    ? 'rgba(14, 26, 38, 0.7)' 
    : 'rgba(236, 232, 226, 0.7)');
  
  const glassBorder = theme.glassBorder || (themeMode === 'dark'
    ? 'rgba(140, 170, 200, 0.12)'
    : 'rgba(216, 210, 200, 0.5)');

  const content = (
    <View
      style={[
        {
          backgroundColor: glassBackground,
          borderColor: glassBorder,
          borderWidth: 1,
          borderRadius: radii.xl,
          padding: noPadding ? 0 : spacing.lg,
          shadowColor: theme.primary,
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

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={1} delayLongPress={9999}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}