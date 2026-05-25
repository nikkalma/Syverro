import React from 'react';
import { View, Text } from 'react-native';

export default function ProgressBar({ stats, lang, theme }) {
  return (
    <View style={{ marginBottom: 28 }}>
      <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>
        📖 {lang.insights?.progress || 'Прогресс чтения'}
      </Text>
      <View style={{ 
        height: 32, 
        backgroundColor: theme.surface, 
        borderRadius: 16, 
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.border,
      }}>
        <View style={{ 
          width: `${stats.percentRead}%`, 
          height: '100%', 
          backgroundColor: theme.primary,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>
            {stats.percentRead}%
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={{ color: theme.textSecondary, fontSize: 11 }}>✅ {lang.insights?.finished || 'Прочитано'}: {stats.finishedCount}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 11 }}>📚 {lang.insights?.total || 'Всего'}: {stats.totalBooks}</Text>
      </View>
    </View>
  );
}