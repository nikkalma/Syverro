// src/components/BookCover.tsx
import React, { useState } from 'react';
import { View, Text, Image, ActivityIndicator, Animated, ImageStyle, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type AnimatedOpacity = number | Animated.Value | Animated.AnimatedInterpolation<string | number>;

interface BookCoverProps {
  coverUrl: string | null;
  title: string;
  width: number;
  height: number;
  style?: ViewStyle | ViewStyle[];
  opacity?: AnimatedOpacity;
}

export default function BookCover({ 
  coverUrl, 
  title, 
  width, 
  height, 
  style, 
  opacity = 1 
}: BookCoverProps) {
  const { theme, mode } = useTheme();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const isAnimated = opacity && typeof opacity === 'object';

  if (coverUrl && !imageError && (coverUrl.startsWith('http') || coverUrl.startsWith('file://'))) {
    if (isAnimated) {
      return (
        <View style={[{ width, height }, style]}>
          {imageLoading && (
            <View style={[styles.placeholder, { width, height, backgroundColor: theme.surface }]}>
              <ActivityIndicator color={theme.primary} />
            </View>
          )}
          <Animated.Image
            source={{ uri: coverUrl }}
            style={[styles.image, { width, height, opacity: opacity as Animated.Value }]}
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
            onError={() => { setImageError(true); setImageLoading(false); }}
          />
        </View>
      );
    }

    return (
      <View style={[{ width, height }, style]}>
        {imageLoading && (
          <View style={[styles.placeholder, { width, height, backgroundColor: theme.surface }]}>
            <ActivityIndicator color={theme.primary} />
          </View>
        )}
        <Image
          source={{ uri: coverUrl }}
          style={[styles.image, { width, height, opacity: opacity as number }]}
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
          onError={() => { setImageError(true); setImageLoading(false); }}
        />
      </View>
    );
  }

  // Плейсхолдер
  const isDarkMode = mode === 'dark';
  const fontSize = Math.min(width / 6, 14);

  return (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: isDarkMode ? theme.primary + '40' : theme.surface,
          borderRadius: 8,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 8,
          borderWidth: isDarkMode ? 0 : 1,
          borderColor: isDarkMode ? 'transparent' : theme.border,
        },
        style,
      ]}
    >
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

const styles = {
  image: {
    borderRadius: 8,
  } as ImageStyle,
  placeholder: {
    position: 'absolute' as 'absolute',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
};