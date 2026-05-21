import React from 'react';
import { View, Text } from 'react-native';

export default function StatCard({ emoji, label, value, theme }) {
  const displayValue = String(value);
  
  return (
    <View style={{
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 4,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 75,
    }}>
      <Text style={{ fontSize: 18, marginBottom: 2 }}>{emoji}</Text>
      <Text style={{ 
        color: theme.textPrimary, 
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'center',
        numberOfLines: 2,
      }}>
        {displayValue}
      </Text>
      <Text style={{ 
        color: theme.textSecondary, 
        fontSize: 8,
        marginTop: 2,
        textAlign: 'center',
        numberOfLines: 2,
      }}>
        {label}
      </Text>
    </View>
  );
}