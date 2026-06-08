// src/theme/fonts.ts

export const fonts = {
  ui: 'Inter_28pt-Regular',
  uiBold: 'Inter_28pt-Semibold',
  ja: 'NotoSansJP-Regular',
  ko: 'NotoSansKR-Regular',
  display: 'PlayfairDisplay-Regular',
};

export const getFontFamily = (locale: string, isBold: boolean = false): string => {
  if (locale === 'ja') return fonts.ja;
  if (locale === 'ko') return fonts.ko;
  return isBold ? fonts.uiBold : fonts.ui;
};