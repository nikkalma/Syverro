// mobile-app/src/components/Text.js
import React from 'react';
import { Text as RNText } from 'react-native';
import { getTypography } from '../theme/typography';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export const Text = ({ variant = 'body', color, style, opacity, ...props }) => {
  const { locale } = useLanguage();
  const { theme } = useTheme();
  const typography = getTypography(locale)[variant];

  const getDefaultOpacity = () => {
    switch (variant) {
      case 'h1':
      case 'h2':
      case 'h3':
        return 1.0;
      case 'body':
        return 0.9;
      case 'secondary':
        return 0.7;
      case 'caption':
        return 0.45;
      default:
        return 0.9;
    }
  };

  const finalOpacity = opacity !== undefined ? opacity : getDefaultOpacity();

  return (
    <RNText
      style={[
        {
          fontFamily: typography.fontFamily,
          fontSize: typography.fontSize,
          lineHeight: typography.lineHeight,
          letterSpacing: typography.letterSpacing,
          color: color || theme.textPrimary,
          opacity: finalOpacity,
        },
        style,
      ]}
      {...props}
    />
  );
};