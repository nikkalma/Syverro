import React from 'react';
import { View } from 'react-native';
import { spacing } from '../theme/spacing';
import { lightTheme, darkTheme } from '../theme/colors';
import { OrbBackground } from './OrbBackground';

export const Container = ({ children, withOrb = false, noPadding = false, themeMode = 'dark', style }) => {
  const bg = themeMode === 'dark' ? darkTheme.background : lightTheme.background;  // ← ИСПРАВЛЕНО

  return (
    <View style={[{ flex: 1, backgroundColor: bg, padding: noPadding ? 0 : spacing.lg }, style]}>
      {withOrb && <OrbBackground themeMode={themeMode} />}
      {children}
    </View>
  );
};