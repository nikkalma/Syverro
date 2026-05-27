export const fonts = {
  ui: 'Inter_28pt-Regular',      // ← точное имя файла
  uiBold: 'Inter_28pt-Semibold', // ← точное имя файла
  ja: 'NotoSansJP-Regular',      // ← точное имя файла
  ko: 'NotoSansKR-Regular',      // ← точное имя файла
  display: 'PlayfairDisplay-Regular', // ← точное имя файла
};

export const getFontFamily = (locale, isBold = false) => {
  if (locale === 'ja') return fonts.ja;
  if (locale === 'ko') return fonts.ko;
  return isBold ? fonts.uiBold : fonts.ui;
};