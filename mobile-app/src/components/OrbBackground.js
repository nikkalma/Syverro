// mobile-app/src/components/OrbBackground.js
import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLighting } from '../context/LightingContext';
import { radii } from '../theme/spacing';

export default function OrbBackground({ size = 350, style }) {
  const { theme, themeMode } = useTheme();
  const { orbPosition } = useLighting();
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.02, duration: 8000, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.98, duration: 8000, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.75, duration: 12000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.65, duration: 12000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const baseColor = theme.orbColor || (themeMode === 'dark' 
    ? 'rgba(28, 40, 58, 0.72)'
    : 'rgba(176, 162, 144, 0.7)');

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          right: -size / 3,
          top: -size / 3,
          width: size,
          height: size,
          borderRadius: radii.full,
          backgroundColor: baseColor,
          transform: [{ scale }],
          opacity,
          shadowColor: themeMode === 'dark' ? '#5C7C9A' : '#4A5A6A',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.2,
          shadowRadius: size * 0.08,
          elevation: 5,
        },
        style,
      ]}
    />
  );
}