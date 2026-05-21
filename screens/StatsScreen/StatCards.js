import React from 'react';
import { View, Text } from 'react-native';

export default function StatCards({ stats, lang, theme }) {
  return (
    <View style={{ 
      flexDirection: 'row', 
      flexWrap: 'wrap', 
      justifyContent: 'space-between',
      rowGap: 12,
      marginBottom: 20,
    }}>
      <View style={{ width: '31%', backgroundColor: theme.surface, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
        <Text style={{ fontSize: 22, marginBottom: 4 }}>📖</Text>
        <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: 'bold' }}>{stats.readingCount}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 10 }}>{lang.status?.reading || 'Читаю'}</Text>
      </View>
      <View style={{ width: '31%', backgroundColor: theme.surface, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
        <Text style={{ fontSize: 22, marginBottom: 4 }}>📄</Text>
        <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: 'bold' }}>{stats.totalPages}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 10 }}>{lang.fields?.pages || 'Страниц'}</Text>
      </View>
      <View style={{ width: '31%', backgroundColor: theme.surface, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
        <Text style={{ fontSize: 22, marginBottom: 4 }}>⭐</Text>
        <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: 'bold' }}>{stats.avgRating}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 10 }}>{lang.fields?.rating || 'Ср. оценка'}</Text>
      </View>
    </View>
  );
}