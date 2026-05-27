import { getFontFamily, fonts } from './fonts';

const asianAdjustments = (locale) => {
  if (locale === 'ja') return { lineHeightMultiplier: 1.15, letterSpacingOffset: 0.5 };
  if (locale === 'ko') return { lineHeightMultiplier: 1.1, letterSpacingOffset: 0.3 };
  return { lineHeightMultiplier: 1, letterSpacingOffset: 0 };
};

export const getTypography = (locale = 'en') => {
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
      fontSize: 32,
      lineHeight: 40 * asian.lineHeightMultiplier,
      letterSpacing: -0.3 + asian.letterSpacingOffset,
    },
    h2: {
      fontFamily,
      fontSize: 24,
      lineHeight: 32 * asian.lineHeightMultiplier,
      letterSpacing: 0 + asian.letterSpacingOffset,
    },
    h3: {
      fontFamily,
      fontSize: 20,
      lineHeight: 28 * asian.lineHeightMultiplier,
      letterSpacing: 0 + asian.letterSpacingOffset,
    },
    body: {
      fontFamily,
      fontSize: 16,
      lineHeight: 24 * asian.lineHeightMultiplier,
      letterSpacing: 0 + asian.letterSpacingOffset,
    },
    secondary: {
      fontFamily,
      fontSize: 14,
      lineHeight: 20 * asian.lineHeightMultiplier,
      letterSpacing: 0 + asian.letterSpacingOffset,
    },
    caption: {
      fontFamily,
      fontSize: 12,
      lineHeight: 16 * asian.lineHeightMultiplier,
      letterSpacing: 0 + asian.letterSpacingOffset,
    },
    mono: {
      fontFamily,
      fontSize: 14,
      lineHeight: 20 * asian.lineHeightMultiplier,
      letterSpacing: 0 + asian.letterSpacingOffset,
    },
  };
};