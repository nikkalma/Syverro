// src/components/OrbBackground.tsx
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useLighting } from '../context/LightingContext';

const { width, height } = Dimensions.get('window');

interface OrbBackgroundProps {
  size?: number;
}

export default function OrbBackground({ size = 400 }: OrbBackgroundProps) {
  const { orbPosition, themeMode } = useLighting();
  
  const secondarySize = size * 0.6;
  const tertiarySize = size * 0.3;
  
  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView intensity={themeMode === 'dark' ? 15 : 8} style={StyleSheet.absoluteFill} />
      
      <View
        style={[
          styles.orb,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            left: (width - size) * orbPosition.x,
            top: (height - size) * orbPosition.y,
            backgroundColor: themeMode === 'dark' 
              ? 'rgba(92, 124, 154, 0.12)' 
              : 'rgba(74, 90, 106, 0.08)',
          },
        ]}
      />
      
      <View
        style={[
          styles.orb,
          {
            width: secondarySize,
            height: secondarySize,
            borderRadius: secondarySize / 1.6,
            left: (width - secondarySize) * (1 - orbPosition.x * 0.7),
            top: (height - secondarySize) * (orbPosition.y * 1.3),
            backgroundColor: themeMode === 'dark' 
              ? 'rgba(92, 124, 154, 0.08)' 
              : 'rgba(74, 90, 106, 0.05)',
          },
        ]}
      />
      
      <View
        style={[
          styles.orb,
          {
            width: tertiarySize,
            height: tertiarySize * 0.8,
            borderRadius: tertiarySize / 2.4,
            left: (width - tertiarySize) * 0.3,
            top: (height - tertiarySize) * 0.7,
            backgroundColor: themeMode === 'dark' 
              ? 'rgba(92, 124, 154, 0.06)' 
              : 'rgba(74, 90, 106, 0.03)',
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    opacity: 0.8,
  },
});