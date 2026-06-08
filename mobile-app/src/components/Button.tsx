// src/components/Button.tsx
import React from 'react';
import { TouchableOpacity, ActivityIndicator, TextStyle, ViewStyle } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../context/ThemeContext';
import { radii } from '../theme/spacing';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) => {
  const { theme } = useTheme();

  const getButtonStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: theme.primary, borderWidth: 0 };
      case 'secondary':
        return { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border };
      case 'outline':
        return { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.primary };
      case 'danger':
        return { backgroundColor: theme.error, borderWidth: 0 };
      default:
        return { backgroundColor: theme.primary, borderWidth: 0 };
    }
  };

  const getTextColor = (): string => {
    if (disabled) return theme.textMuted;
    switch (variant) {
      case 'primary': return '#FFFFFF';
      case 'secondary': return theme.textPrimary;
      case 'outline': return theme.primary;
      case 'danger': return '#FFFFFF';
      default: return '#FFFFFF';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        {
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: radii.lg,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
        },
        getButtonStyle(),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text variant="body" style={[{ color: getTextColor(), fontWeight: '500', opacity: 1 }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};