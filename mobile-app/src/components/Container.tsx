// src/components/Container.tsx
import React from 'react';
import { View } from 'react-native';
import { spacing } from '../theme/spacing';
import { lightTheme, darkTheme } from '../theme/colors';
import { OrbBackground } from './OrbBackground';
import { useTheme } from '../context/ThemeContext';

interface ContainerProps {
  children: React.ReactNode;
  withOrb?: boolean;
  noPadding?: boolean;
  style?: any;
}

export const Container = ({ children, withOrb = false, noPadding = false, style }: ContainerProps) => {
  const { mode } = useTheme();
  const bg = mode === 'dark' ? darkTheme.background : lightTheme.background;

  return (
    <View style={[{ flex: 1, backgroundColor: bg, padding: noPadding ? 0 : spacing.lg }, style]}>
      {withOrb && <OrbBackground themeMode={mode} />}
      {children}
    </View>
  );
};