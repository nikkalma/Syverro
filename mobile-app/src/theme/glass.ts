// src/theme/glass.ts
import { spacing } from './spacing';

export const glass = (themeMode: 'light' | 'dark' = 'dark') => ({
  background: themeMode === 'dark'
    ? 'rgba(18, 28, 36, 0.72)'
    : 'rgba(248, 244, 234, 0.72)',
  border: themeMode === 'dark'
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(0, 0, 0, 0.05)',
  borderRadius: 24,
  padding: spacing.md,
});