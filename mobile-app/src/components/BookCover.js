import React from 'react';
import { View, Text, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function BookCover({ coverUrl, title, width, height, style }) {
  const { theme } = useTheme();
  console.log('theme:', theme);
  
  if (coverUrl && !coverUrl.includes('picsum') && !coverUrl.includes('loremflick')) {
    return (
      <Image 
        source={{ uri: coverUrl }} 
        style={[{ width, height, borderRadius: 8 }, style]} 
      />
    );
  }
  
  const isDarkMode = theme.mode === 'dark';
  const fontSize = Math.min(width / 6, 14);
  
  return (
    <View style={[{
      width,
      height,
      backgroundColor: isDarkMode ? theme.primary : theme.surface,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 8,
      borderWidth: isDarkMode ? 0 : 1,
      borderColor: isDarkMode ? 'transparent' : theme.border,
    }, style]}>
      <View style={{ width: width - 16, alignItems: 'center' }}>
        <Text
          style={{
            color: isDarkMode ? '#FFFFFF' : theme.textPrimary,
            fontSize: fontSize,
            fontWeight: '500',
            textAlign: 'center',
            lineHeight: fontSize + 4,
          }}
          numberOfLines={4}
        >
          {title || '?'}
        </Text>
      </View>
    </View>
  );
}