import React from 'react';
import { View, Text } from 'react-native';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme } from 'victory-native';

export default function TopGenresBar({ genres, theme }) {
  // genres = [{ name: 'Фантастика', count: 12 }, ...]
  
  if (!genres || genres.length === 0) {
    return (
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Нет данных о жанрах</Text>
      </View>
    );
  }
  
  const data = genres.map((genre, index) => ({
    name: genre.name.length > 12 ? genre.name.slice(0, 10) + '…' : genre.name,
    count: genre.count,
    index: index,
  }));
  
  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
        🏆 Топ-3 жанра
      </Text>
      <View style={{ height: 200 }}>
        {data.map((item, idx) => (
          <View key={idx} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: theme.textPrimary, fontSize: 12 }}>{item.name}</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 11 }}>{item.count} кн.</Text>
            </View>
            <View style={{ 
              height: 24, 
              backgroundColor: theme.surface, 
              borderRadius: 12, 
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: theme.border,
            }}>
              <View style={{ 
                width: `${(item.count / maxCount) * 100}%`, 
                height: '100%', 
                backgroundColor: theme.primary,
                borderRadius: 12,
              }} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}