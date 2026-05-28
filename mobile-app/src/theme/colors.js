// mobile-app/src/theme/colors.js

export const lightTheme = {
  // База — ОЧЕВИДНО тёплая бумага
  background: '#E0D4C3',           // ← ещё теплее, ещё темнее
  surface: '#D4C7B4',              // карточки — заметно темнее фона
  surfaceAlt: '#C8BAA6',           // альтернативная поверхность
  
  // Текст — мягкий, тёплый
  textPrimary: '#2A2622',          // мягкий тёмный
  textSecondary: '#6B6358',        // тёплый второстепенный
  textMuted: '#948A7C',            // пыльный, приглушённый
  
  // Акценты
  primary: '#4A5A6A',
  primarySoft: '#6B7A88',
  accent: '#B8A99A',
  accentSoft: '#D1C6BA',
  
  // Статусы
  success: '#6B8F7A',
  warning: '#D4A76A',
  error: '#C47A7A',
  info: '#7A8FC4',
  status: '#4A5A6A',
  
  // Границы
  border: '#BEB09C',
  borderSoft: '#D4C7B4',
  card: '#D4C7B4',
  cardHover: '#DDD0BE',
  cardActive: '#C8BAA6',
  
  // Специальные
  chip: '#C8BAA6',
  chipActive: '#BEB09C',
  currentBookGlow: '#4A5A6A',
  neonGlow: '#4A5A6A',
  
  // Стекло (тёплое)
  glassBackground: 'rgba(212, 199, 180, 0.7)',
  glassBorder: 'rgba(190, 176, 156, 0.5)',
  
  // Orb — глубокий, пыльный
  orbColor: 'rgba(176, 162, 144, 0.7)',
};

export const darkTheme = {
  // База — глубокий navy
  background: '#0B1220',
  surface: '#0E1A26',
  surfaceAlt: '#121F2E',
  
  // Текст
  textPrimary: '#E7EDF5',
  textSecondary: '#97A6BA',
  textMuted: '#6E7C90',
  
  // Акценты
  primary: '#5C7C9A',
  primarySoft: '#3A5570',
  accent: '#A8B0BA',
  accentSoft: '#2C3F55',
  
  // Статусы
  success: '#6B9B7A',
  warning: '#D4A76A',
  error: '#C47A7A',
  info: '#7A9BC4',
  status: '#5C7C9A',
  
  // Границы
  border: 'rgba(140, 170, 200, 0.12)',
  borderSoft: '#16232E',
  card: '#0E1A26',
  cardHover: '#15263A',
  cardActive: '#121F2E',
  
  // Специальные
  chip: '#1B2A3A',
  chipActive: '#2C3F55',
  currentBookGlow: '#5C7C9A',
  neonGlow: '#5C7C9A',
  
  // Стекло
  glassBackground: 'rgba(14, 26, 38, 0.7)',
  glassBorder: 'rgba(140, 170, 200, 0.12)',
  
  // Orb — cosmic haze
  orbColor: 'rgba(28, 40, 58, 0.72)',
};

export const light = lightTheme;
export const dark = darkTheme;