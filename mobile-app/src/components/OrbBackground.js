import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { colors } from '../theme/colors';

export const OrbBackground = ({ themeMode = 'dark', size = 200, style }) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.2, duration: 2000, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [scale]);

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: themeMode === 'dark' ? colors.dark.primary : colors.light.primary,
          position: 'absolute',
          top: -size / 3,
          right: -size / 3,
          transform: [{ scale }],
          opacity: 0.3,
        },
        style,
      ]}
    />
  );
};
