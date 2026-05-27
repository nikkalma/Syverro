import React from 'react';
import { TouchableOpacity, Text as RNText } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { getTypography } from '../theme/typography';

export const Button = ({ variant = 'primary', onPress, disabled, children, style }) => {
  const { theme } = useTheme();
  const { locale } = useLanguage();
  const typography = getTypography(locale).body;

  const themeMode = theme.mode === 'dark' ? 'dark' : 'light';
  const themeColors = themeMode === 'dark' ? colors.dark : colors.light;

  const background =
    variant === 'primary'
      ? themeColors.primary
      : variant === 'secondary'
      ? 'transparent'
      : 'transparent';
      
  const border = variant === 'secondary' ? themeColors.primary : 'transparent';
  const textColor =
    variant === 'primary'
      ? '#FFFFFF'
      : themeColors.primary;

  return (
    <TouchableOpacity
      activeOpacity={0.4}  // ← ЕДИНАЯ прозрачность для всех кнопок
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          backgroundColor: background,
          borderColor: border,
          borderWidth: variant === 'secondary' ? 1 : 0,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <RNText
        style={{
          fontFamily: typography.fontFamily,
          fontSize: typography.fontSize,
          lineHeight: typography.lineHeight,
          letterSpacing: typography.letterSpacing,
          color: textColor,
        }}
      >
        {children}
      </RNText>
    </TouchableOpacity>
  );
};