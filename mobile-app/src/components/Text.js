// mobile-app/src/components/Text.js
import React from 'react';
import { Text as RNText } from 'react-native';
import { getTypography } from '../theme/typography';
import { useLanguage } from './LanguageContext';
import { colors } from '../theme/colors';

export const Text = ({ variant = 'body', color, style, ...props }) => {
  const { locale } = useLanguage();
  const typography = getTypography(locale)[variant];

  return (
    <RNText
      style={[
        {
          fontFamily: typography.fontFamily,
          fontSize: typography.fontSize,
          lineHeight: typography.lineHeight,
          letterSpacing: typography.letterSpacing,
          color: color || colors.light.text,
        },
        style,
      ]}
      {...props}
    />
  );
};
