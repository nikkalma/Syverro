// mobile-app/src/components/OrbBackground.js
import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { radii } from '../theme/spacing';

export default function OrbBackground({ size = 350, style }) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 0.7, duration: 4000, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  }, [scale]);

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radii.full,
          backgroundColor: theme.orbColor,
          position: 'absolute',
          top: -size / 3,
          right: -size / 3,
          transform: [{ scale }],
        },
        style,
      ]}
    />
  );
}