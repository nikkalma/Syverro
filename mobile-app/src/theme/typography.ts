// mobile-app/src/theme/typography.ts
import { getFontFamily, fonts } from './fonts';

const asianAdjustments = (locale: string) => {
  if (locale === 'ja') return { lineHeightMultiplier: 1.15, letterSpacingOffset: 0.5 };
  if (locale === 'ko') return { lineHeightMultiplier: 1.1, letterSpacingOffset: 0.3 };
  return { lineHeightMultiplier: 1, letterSpacingOffset: 0 };
};

interface TypographyStyle {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  opacity?: number;
}

interface TypographySet {
  display: TypographyStyle;
  h1: TypographyStyle;
  h2: TypographyStyle;
  h3: TypographyStyle;
  body: TypographyStyle;
  secondary: TypographyStyle;
  caption: TypographyStyle;
  mono: TypographyStyle;
}

export const getTypography = (locale = 'en'): TypographySet => {
  const fontFamily = getFontFamily(locale);
  const asian = asianAdjustments(locale);

  return {
    display: {
      fontFamily: fonts.display,
      fontSize: 48,
      lineHeight: 56 * asian.lineHeightMultiplier,
      letterSpacing: -0.5 + asian.letterSpacingOffset,
    },
    h1: {
      fontFamily,
      fontSize: 28,
      lineHeight: 36 * asian.lineHeightMultiplier,
      letterSpacing: -0.3 + asian.letterSpacingOffset,
    },
    h2: {
      fontFamily,
      fontSize: 20,
      lineHeight: 28 * asian.lineHeightMultiplier,
      letterSpacing: 0 + asian.letterSpacingOffset,
    },
    h3: {
      fontFamily,
      fontSize: 16,
      lineHeight: 24 * asian.lineHeightMultiplier,
      letterSpacing: 0 + asian.letterSpacingOffset,
    },
    body: {
      fontFamily,
      fontSize: 14,
      lineHeight: 20 * asian.lineHeightMultiplier,
      letterSpacing: 0 + asian.letterSpacingOffset,
    },
    secondary: {
      fontFamily,
      fontSize: 12,
      lineHeight: 16 * asian.lineHeightMultiplier,
      letterSpacing: 0 + asian.letterSpacingOffset,
      opacity: 0.7,
    },
    caption: {
      fontFamily,
      fontSize: 10,
      lineHeight: 14 * asian.lineHeightMultiplier,
      letterSpacing: 0 + asian.letterSpacingOffset,
      opacity: 0.5,
    },
    mono: {
      fontFamily,
      fontSize: 12,
      lineHeight: 16 * asian.lineHeightMultiplier,
      letterSpacing: 0 + asian.letterSpacingOffset,
    },
  };
};