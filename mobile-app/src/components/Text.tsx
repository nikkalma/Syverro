// src/components/Text.tsx
import React from 'react';
import { Text as RNText, TextStyle } from 'react-native';
import { getTypography } from '../theme/typography';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

type TextVariant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'secondary' | 'caption' | 'mono';

interface TextProps {
  variant?: TextVariant;
  color?: string;
  style?: TextStyle | TextStyle[];
  opacity?: number;
  children?: React.ReactNode;
  numberOfLines?: number;
}

export const Text = ({ 
  variant = 'body', 
  color, 
  style, 
  opacity, 
  children, 
  numberOfLines,
  ...props 
}: TextProps) => {
  const { locale } = useLanguage();
  const { theme } = useTheme();
  const typography = getTypography(locale)[variant];

  const getDefaultOpacity = () => {
    switch (variant) {
      case 'display':
      case 'h1':
      case 'h2':
      case 'h3':
        return 1.0;
      case 'body':
        return 0.9;
      case 'secondary':
        return 0.7;
      case 'caption':
        return 0.5;
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
      numberOfLines={numberOfLines}
      {...props}
    >
      {children}
    </RNText>
  );
};