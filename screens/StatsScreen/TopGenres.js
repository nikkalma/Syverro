import React from 'react';
import { View, Text } from 'react-native';

export default function TopGenres({ stats, lang, theme }) {
  if (stats.topGenres.length === 0) {
    return (
      <View style={{ marginBottom: 28 }}>
        <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>
          🏆 {lang.stats?.topGenres || 'Топ-3 жанра (прочитанные)'}
        </Text>
        <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>{lang.stats?.noGenreData || 'Нет данных о жанрах в прочитанных книгах'}</Text>
      </View>
    );
  }

  const maxCount = stats.topGenres[0]?.count || 1;

  return (
    <View style={{ marginBottom: 28 }}>
      <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>
        🏆 {lang.stats?.topGenres || 'Топ-3 жанра (прочитанные)'}
      </Text>
      {stats.topGenres.map((genre, idx) => {
        const percent = (genre.count / maxCount) * 100;
        return (
          <View key={idx} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: theme.textPrimary, fontSize: 12, flex: 1 }} numberOfLines={1}>
                {genre.name}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 11 }}>{genre.count} {lang.stats?.books || 'кн.'}</Text>
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
                width: `${percent}%`, 
                height: '100%', 
                backgroundColor: theme.primary,
                borderRadius: 12,
              }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}