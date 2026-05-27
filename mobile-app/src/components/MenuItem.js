// mobile-app/src/components/MenuItem.js
import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export const MenuItem = ({ icon, title, onPress, isLast = false }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.4}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: theme.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border,
        marginBottom: isLast ? 24 : 12,
      }}
    >
      <Text style={{ color: theme.textPrimary, fontSize: 15 }}>
        {icon} {title}
      </Text>
    </TouchableOpacity>
  );
};